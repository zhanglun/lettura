//! IMAP 会话层：连接/登录/搜索/拉取。
//!
//! 只认 [`MailSettings`]，不知道 `FetchedArticle` 长什么样——条目映射归
//! `mapping.rs`，两个方向互不感知，方便离线测映射、在线测连接。

use std::fmt::Debug;

use async_native_tls::TlsConnector;
use futures_util::StreamExt;
use serde_json::Value;
use tokio::io::{AsyncRead, AsyncWrite};

/// 统一 IO 流 trait：TLS 与明文两条路径产出不同的流类型，装箱抹平，
/// 上层流程只写一份。单条连接的场景，dyn 开销可以忽略。
pub trait MailStream: AsyncRead + AsyncWrite + Unpin + Debug + Send {}
impl<T: AsyncRead + AsyncWrite + Unpin + Debug + Send> MailStream for T {}

/// 统一会话类型
pub type MailSession = async_imap::Session<Box<dyn MailStream>>;

/// UID FETCH 单批上限，防止超大邮箱一条命令把响应撑爆
pub const FETCH_BATCH: usize = 100;

/// 账户连接参数，对应 source_accounts.settings 的 JSON 形状：
/// `{host, port?, user, password, folder?, tls?}`；port 缺省按 tls 取 993/143。
#[derive(Debug)]
pub struct MailSettings {
  pub host: String,
  pub port: u16,
  pub user: String,
  pub password: String,
  pub folder: String,
  pub tls: bool,
}

/// settings 是用户手填的 JSON，缺什么要用中文说清缺什么
pub fn parse_settings(value: &Value) -> Result<MailSettings, String> {
  let host = required_str(value, "host", "IMAP 服务器地址（如 imap.gmail.com）")?;
  let user = required_str(value, "user", "IMAP 登录用户名（通常是邮箱地址）")?;
  let password = value
    .get("password")
    .and_then(Value::as_str)
    .ok_or_else(|| "账户配置缺少 password（IMAP 登录密码/授权码）".to_string())?;
  let tls = value.get("tls").and_then(Value::as_bool).unwrap_or(true);
  let port = value
    .get("port")
    .and_then(Value::as_u64)
    .map(|p| p as u16)
    .unwrap_or(if tls { 993 } else { 143 });
  let folder = value
    .get("folder")
    .and_then(Value::as_str)
    .map(str::trim)
    .filter(|s| !s.is_empty())
    .unwrap_or("INBOX")
    .to_string();

  Ok(MailSettings {
    host,
    port,
    user,
    password: password.to_string(),
    folder,
    tls,
  })
}

fn required_str(value: &Value, key: &str, what: &str) -> Result<String, String> {
  value
    .get(key)
    .and_then(Value::as_str)
    .map(str::trim)
    .filter(|s| !s.is_empty())
    .map(str::to_string)
    .ok_or_else(|| format!("账户配置缺少 {key}（{what}）"))
}

/// 建立连接 → 登录 → SELECT folder。每一步失败都带上可操作的中文上下文，
/// 认证失败与连不上分开说——用户要先知道是该改密码还是该改地址。
pub async fn connect_session(settings: &MailSettings) -> Result<MailSession, String> {
  log::debug!(
    "连接 IMAP 服务器 {}:{}（{}）",
    settings.host,
    settings.port,
    if settings.tls { "TLS" } else { "明文" }
  );
  let addr = (settings.host.as_str(), settings.port);
  let tcp = tokio::net::TcpStream::connect(addr).await.map_err(|e| {
    format!(
      "连接 IMAP 服务器失败（{}:{}）：{}。请检查服务器地址与端口",
      settings.host, settings.port, e
    )
  })?;

  let stream: Box<dyn MailStream> = if settings.tls {
    let tls = TlsConnector::new()
      .connect(settings.host.clone(), tcp)
      .await
      .map_err(|e| {
        format!(
          "TLS 握手失败（{}:{}）：{}。请确认该端口提供 TLS 服务，或把账户 tls 设为 false",
          settings.host, settings.port, e
        )
      })?;
    Box::new(tls)
  } else {
    Box::new(tcp)
  };

  let client = async_imap::Client::new(stream);
  let mut session = client
    .login(settings.user.as_str(), settings.password.as_str())
    .await
    .map_err(|(e, _)| {
      let hint = match &e {
        // RFC 5530：服务器明确说凭据不对
        async_imap::error::Error::No(resp) if resp.contains("AUTHENTICATIONFAILED") => {
          "用户名或密码不正确。部分服务商（Gmail/QQ/163）需使用应用专用授权码而非登录密码"
            .to_string()
        }
        _ => format!("服务器响应：{e}"),
      };
      format!("IMAP 登录失败（{}）。{}", settings.user, hint)
    })?;

  session
    .select(settings.folder.as_str())
    .await
    .map_err(|e| format!("打开邮箱文件夹 {} 失败：{}", settings.folder, e))?;
  Ok(session)
}

/// `UID SEARCH FROM "addr"`：某发件人的全部邮件 uid。
/// 地址先经 parse_from_addresses 校验过，不含会破坏引号包裹的字符。
pub async fn search_uids(session: &mut MailSession, from: &str) -> Result<Vec<u32>, String> {
  let query = format!("FROM \"{from}\"");
  let uids = session
    .uid_search(query.as_str())
    .await
    .map_err(|e| format!("搜索发件人 {from} 的邮件失败：{e}"))?;
  Ok(uids.into_iter().collect())
}

/// 升序去重后取最新 max 个 uid（uid 单调递增，尾部即最新）
pub fn latest_uids(mut uids: Vec<u32>, max: u32) -> Vec<u32> {
  uids.sort_unstable();
  uids.dedup();
  let start = uids.len().saturating_sub(max as usize);
  uids.split_off(start)
}

/// 分批调用方已按 FETCH_BATCH 切好；这里一次拉一批。
/// 用 BODY.PEEK[] 不动 \\Seen 标记——用户在邮件客户端里的已读状态不该被同步改掉。
pub async fn fetch_raw_messages(
  session: &mut MailSession,
  uids: &[u32],
) -> Result<Vec<(u32, Vec<u8>)>, String> {
  if uids.is_empty() {
    return Ok(Vec::new());
  }
  let set = uids
    .iter()
    .map(u32::to_string)
    .collect::<Vec<_>>()
    .join(",");
  let mut stream = session
    .uid_fetch(set.as_str(), "(UID BODY.PEEK[])")
    .await
    .map_err(|e| format!("拉取邮件（uid {set}）失败：{e}"))?;

  let mut out = Vec::with_capacity(uids.len());
  while let Some(item) = stream.next().await {
    let fetch = item.map_err(|e| format!("读取邮件（uid {set}）的响应失败：{e}"))?;
    let uid = fetch
      .uid
      .ok_or_else(|| format!("服务器响应缺少 UID（uid set {set}）"))?;
    let body = fetch.body().unwrap_or_default().to_vec();
    out.push((uid, body));
  }
  // 服务器可能乱序回，统一升序，调用方与测试都好写
  out.sort_by_key(|(uid, _)| *uid);
  Ok(out)
}

#[cfg(test)]
mod tests {
  use super::*;
  use serde_json::json;

  #[test]
  fn settings_fill_defaults_and_report_missing() {
    let full = json!({
      "host": " imap.example.com ", "port": 1993,
      "user": "me@example.com", "password": "secret",
      "folder": "Newsletters", "tls": false
    });
    let s = parse_settings(&full).expect("valid settings");
    assert_eq!(s.host, "imap.example.com", "host 要去空白");
    assert_eq!(s.port, 1993, "显式端口优先");
    assert_eq!(s.folder, "Newsletters");
    assert!(!s.tls);

    // tls=true 缺省端口 993，false 则 143
    let s = parse_settings(&json!({"host": "h", "user": "u", "password": "p"})).unwrap();
    assert_eq!(s.port, 993);
    assert_eq!(s.folder, "INBOX", "folder 缺省收件箱");
    let s =
      parse_settings(&json!({"host": "h", "user": "u", "password": "p", "tls": false})).unwrap();
    assert_eq!(s.port, 143);

    // 缺关键字段：错误要指出缺的是哪一块
    for (key, msg) in [("host", "host"), ("user", "user"), ("password", "password")] {
      let mut v = json!({"host": "h", "user": "u", "password": "p"});
      v.as_object_mut().unwrap().remove(key);
      let err = parse_settings(&v).unwrap_err();
      assert!(err.contains(msg), "错误信息应包含 {msg}，实际：{err}");
    }
  }

  /// 真实 IMAP 连通性测试：需要真账户。
  /// 设 LETTURA_IMAP_HOST / LETTURA_IMAP_USER / LETTURA_IMAP_PASSWORD
  /// （可选 LETTURA_IMAP_FOLDER、LETTURA_IMAP_FROM）后 `cargo test -- --ignored` 运行。
  #[tokio::test]
  #[ignore = "需要真实 IMAP 账户凭据（环境变量提供）"]
  async fn live_imap_connect_and_search() {
    let host = std::env::var("LETTURA_IMAP_HOST").expect("设 LETTURA_IMAP_HOST");
    let settings = MailSettings {
      port: 993,
      tls: true,
      folder: std::env::var("LETTURA_IMAP_FOLDER").unwrap_or_else(|_| "INBOX".into()),
      host: host.clone(),
      user: std::env::var("LETTURA_IMAP_USER").expect("设 LETTURA_IMAP_USER"),
      password: std::env::var("LETTURA_IMAP_PASSWORD").expect("设 LETTURA_IMAP_PASSWORD"),
    };

    let mut session = connect_session(&settings).await.expect("连接登录成功");
    let from = std::env::var("LETTURA_IMAP_FROM").unwrap_or_else(|_| "github.com".into());
    let uids = search_uids(&mut session, &from).await.expect("搜索成功");
    println!("FROM {from}: {} 封", uids.len());
    let latest = latest_uids(uids, 5);
    let raws = fetch_raw_messages(&mut session, &latest)
      .await
      .expect("拉取成功");
    for (uid, raw) in &raws {
      println!("uid {} -> {} 字节", uid, raw.len());
      assert!(!raw.is_empty(), "uid {uid} 的原文不应为空");
    }
    let _ = session.logout().await;
  }
}
