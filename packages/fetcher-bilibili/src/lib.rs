//! 抓 B 站 UP 主动态的 fetcher：把视频投稿 / 图文 / 纯文字动态归一化成
//! [`FetchedArticle`]。
//! - 订阅：粘贴 space.bilibili.com/{mid} → wbi 签名调 acc/info 拿昵称头像
//! - 同步：wbi 签名调 polymer/web-dynamic/feed/space 拉动态流
//! B 站接口有风控：所有请求走全局 3 秒间隔限速 + 浏览器 UA/referer，
//! 建议在设置里给该源配 SESSDATA 账户提高成功率。

pub mod dynamic;
pub mod rate_limit;
pub mod wbi;

use async_trait::async_trait;
use fetcher_core::{
  AccountMaterial, Carrier, DetectInput, DetectOutput, FeedDraft, FetchContext, FetchedArticle,
  Fetcher,
};
use once_cell::sync::Lazy;
use regex::Regex;
use reqwest::header::{HeaderMap, HeaderValue, COOKIE, REFERER, USER_AGENT};
use serde::Deserialize;
use serde_json::Value;

/// B 站接口对非浏览器 UA 一律风控，必须伪装成桌面 Chrome
const BROWSER_UA: &str =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const SPACE_URL: &str = "https://space.bilibili.com";

static MID_RE: Lazy<Regex> = Lazy::new(|| {
  // space.bilibili.com/{mid} 或 bilibili.com/space/{mid}，带不带 scheme/查询串都行
  Regex::new(r"(?i)(?:space\.bilibili\.com|bilibili\.com/space)/(\d+)").unwrap()
});

pub struct BilibiliFetcher;

/// 从任意粘贴内容里提取用户 mid
pub fn extract_mid(raw: &str) -> Option<String> {
  MID_RE
    .captures(raw.trim())
    .and_then(|c| c.get(1))
    .map(|m| m.as_str().to_string())
}

/// 统一的浏览器指纹头：UA + referer，配了 SESSDATA 再补 cookie。
/// fetcher 不自建客户端（UA/代理/超时策略在 app 侧），这里只在每次请求上覆盖头。
pub fn browser_headers(sessdata: Option<&str>) -> HeaderMap {
  let mut headers = HeaderMap::new();
  headers.insert(USER_AGENT, HeaderValue::from_static(BROWSER_UA));
  headers.insert(
    REFERER,
    HeaderValue::from_static("https://space.bilibili.com/"),
  );
  if let Some(sd) = sessdata {
    if let Ok(value) = HeaderValue::from_str(&format!("SESSDATA={}", sd)) {
      headers.insert(COOKIE, value);
    }
  }
  headers
}

/// SESSDATA 藏在账户 settings 的 {"sessdata": "..."} 里
fn sessdata_of(account: Option<&AccountMaterial>) -> Option<&str> {
  account
    .and_then(|a| a.settings.get("sessdata"))
    .and_then(|v| v.as_str())
}

/// fetch 阶段从 source_config 读回 mid（detect 存数值，兼容字符串形态）
fn mid_from_config(config: &Value) -> Option<String> {
  match config.get("mid")? {
    Value::Number(n) => Some(n.to_string()),
    Value::String(s) => Some(s.clone()),
    _ => None,
  }
}

/// 带限速的 GET：HTTP 403/412 一律按风控翻成中文提示
async fn get_json(
  http: &reqwest::Client,
  url: &str,
  sessdata: Option<&str>,
) -> Result<Value, String> {
  rate_limit::pace().await;
  let resp = http
    .get(url)
    .headers(browser_headers(sessdata))
    .send()
    .await
    .map_err(|e| format!("B站接口请求失败: {}", e))?;
  let status = resp.status().as_u16();
  if status == 403 || status == 412 {
    return Err(risk_error(sessdata.is_none()));
  }
  resp
    .json::<Value>()
    .await
    .map_err(|e| format!("B站响应解析失败: {}", e))
}

/// 风控/登录类错误按「是否配过账户」给出可操作的文案：
/// 没配过 → 引导添加；配过仍被拒 → 引导更新
fn risk_error(no_account: bool) -> String {
  if no_account {
    "B站请求被风控：尚未配置 SESSDATA。请到 设置 → 来源账户 添加 B站账户".into()
  } else {
    "B站风控或 SESSDATA 失效，请到设置更新".into()
  }
}

/// B 站业务码 → 中文错误：-352/-412 是风控，-101 是没登录/SESSDATA 失效
fn api_error(code: i64, message: &str, no_account: bool) -> String {
  match code {
    -352 | -412 => risk_error(no_account),
    -101 => {
      if no_account {
        risk_error(true)
      } else {
        "B站账号未登录（-101）：SESSDATA 已失效，请到设置更新".into()
      }
    }
    _ => format!("B站接口错误 {}: {}", code, message),
  }
}

/// 设置页「测试连接」：nav 接口带 SESSDATA，登录成功返回昵称，
/// -101 → SESSDATA 无效/过期。settings 形如 {"sessdata": "..."}。
pub async fn probe_account(settings: &Value) -> Result<String, String> {
  let sessdata = settings
    .get("sessdata")
    .and_then(|v| v.as_str())
    .map(str::trim)
    .filter(|s| !s.is_empty())
    .ok_or("settings 缺少 sessdata 字段")?;

  rate_limit::pace().await;
  let http = reqwest::Client::new();
  let resp: Value = http
    .get("https://api.bilibili.com/x/web-interface/nav")
    .headers(browser_headers(Some(sessdata)))
    .send()
    .await
    .map_err(|e| format!("B站接口请求失败: {}", e))?
    .json()
    .await
    .map_err(|e| format!("B站响应解析失败: {}", e))?;

  let code = resp.get("code").and_then(|v| v.as_i64()).unwrap_or(-1);
  if code != 0 {
    return Err(api_error(code, resp.get("message").and_then(|v| v.as_str()).unwrap_or(""), false));
  }
  let uname = resp
    .pointer("/data/uname")
    .and_then(|v| v.as_str())
    .unwrap_or("");
  Ok(format!("登录成功：{uname}"))
}

/// acc/info 响应，只取展示需要的 name/face
#[derive(Deserialize)]
struct AccInfoResp {
  code: i64,
  #[serde(default)]
  message: String,
  #[serde(default)]
  data: AccInfo,
}

#[derive(Deserialize, Default)]
struct AccInfo {
  #[serde(default)]
  name: String,
  #[serde(default)]
  face: String,
}

/// 当前秒级时间戳（wts）
fn unix_now() -> i64 {
  std::time::SystemTime::now()
    .duration_since(std::time::UNIX_EPOCH)
    .map(|d| d.as_secs() as i64)
    .unwrap_or(0)
}

#[async_trait]
impl Fetcher for BilibiliFetcher {
  fn id(&self) -> &'static str {
    "bilibili"
  }

  fn carrier_hint(&self) -> Carrier {
    Carrier::Video
  }

  /// 只有 space 链接才认领；rss 是兜底，分发顺序上它最后
  fn claims(&self, raw: &str) -> bool {
    extract_mid(raw).is_some()
  }

  /// 粘贴 UP 主页 → wbi 签名调 acc/info，拿昵称头像出源草稿
  async fn detect(&self, input: &DetectInput) -> Result<DetectOutput, String> {
    let mid = extract_mid(&input.raw)
      .ok_or("不是 B 站用户主页链接：请粘贴 space.bilibili.com/{UID} 形式的地址")?;
    let sessdata = sessdata_of(input.account.as_ref());

    let mixin = wbi::get_mixin_key(&input.http, sessdata).await?;
    let query = wbi::sign_query(&[("mid", mid.as_str())], &mixin, unix_now());
    let url = format!("https://api.bilibili.com/x/space/wbi/acc/info?{}", query);
    let value = get_json(&input.http, &url, sessdata).await?;
    let resp: AccInfoResp =
      serde_json::from_value(value).map_err(|e| format!("B站用户信息解析失败: {}", e))?;
    if resp.code != 0 {
      return Err(api_error(resp.code, &resp.message, sessdata.is_none()));
    }

    Ok(DetectOutput {
      provider: self.id().to_string(),
      feed: FeedDraft {
        title: resp.data.name,
        logo: resp.data.face,
        link: format!("{}/{}", SPACE_URL, mid),
        carrier: Carrier::Video,
        ..Default::default()
      },
      resolved_url: format!("{}/{}", SPACE_URL, mid),
      candidates: vec![],
      entries: vec![],
      // mid 存数值；正则保证是纯数字，溢出等意外就原样存字符串兜底
      source_config: match mid.parse::<u64>() {
        Ok(n) => serde_json::json!({ "mid": n }),
        Err(_) => serde_json::json!({ "mid": mid }),
      },
    })
  }

  /// 周期同步：拉动态流，映射成条目
  async fn fetch(&self, ctx: &FetchContext) -> Result<Vec<FetchedArticle>, String> {
    let mid = mid_from_config(&ctx.feed.source_config)
      .ok_or("feeds.source_config 缺少 B 站 mid，请删掉该源重新订阅")?;
    let sessdata = sessdata_of(ctx.account.as_ref());

    let mixin = wbi::get_mixin_key(&ctx.http, sessdata).await?;
    let query = wbi::sign_query(&[("host_mid", mid.as_str())], &mixin, unix_now());
    let url = format!(
      "https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?{}",
      query
    );
    let value = get_json(&ctx.http, &url, sessdata).await?;
    let resp: dynamic::DynamicResp =
      serde_json::from_value(value).map_err(|e| format!("B站动态响应解析失败: {}", e))?;
    if resp.code != 0 {
      return Err(api_error(resp.code, &resp.message, sessdata.is_none()));
    }
    Ok(dynamic::to_articles(&resp.data.items))
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn claims_only_space_urls() {
    let fetcher = BilibiliFetcher;
    assert!(fetcher.claims("space.bilibili.com/546195"));
    assert!(fetcher.claims("https://space.bilibili.com/546195?spm_id_from=333.999"));
    assert!(fetcher.claims("https://bilibili.com/space/546195"));
    assert!(fetcher.claims("bilibili.com/space/546195"));
    assert!(fetcher.claims("  https://space.bilibili.com/546195/dynamic  "));
    // 视频页、无 mid 的主页、其他站点不认领（rss 是兜底）
    assert!(!fetcher.claims("https://www.bilibili.com/video/BV1xx411c7mD"));
    assert!(!fetcher.claims("https://space.bilibili.com/"));
    assert!(!fetcher.claims("https://example.com/feed.xml"));
    assert!(!fetcher.claims(""));
  }

  #[test]
  fn extract_mid_from_both_forms() {
    assert_eq!(
      extract_mid("https://space.bilibili.com/546195"),
      Some("546195".into())
    );
    assert_eq!(
      extract_mid("bilibili.com/space/546195?spm=xx"),
      Some("546195".into())
    );
    assert_eq!(extract_mid("https://www.bilibili.com/video/av170001"), None);
  }

  #[test]
  fn mid_roundtrip_through_source_config() {
    let as_number = serde_json::json!({ "mid": 546195_u64 });
    assert_eq!(mid_from_config(&as_number), Some("546195".into()));
    let as_string = serde_json::json!({ "mid": "546195" });
    assert_eq!(mid_from_config(&as_string), Some("546195".into()));
    assert_eq!(mid_from_config(&serde_json::json!({})), None);
  }

  #[test]
  fn sessdata_reads_account_settings() {
    let account = AccountMaterial {
      uuid: "u".into(),
      provider: "bilibili".into(),
      settings: serde_json::json!({ "sessdata": "abc,def" }),
    };
    assert_eq!(sessdata_of(Some(&account)), Some("abc,def"));
    assert_eq!(sessdata_of(None), None);
  }

  #[test]
  fn browser_headers_carry_ua_referer_cookie() {
    let headers = browser_headers(Some("abc"));
    assert_eq!(headers.get(USER_AGENT).unwrap(), BROWSER_UA);
    assert_eq!(headers.get(REFERER).unwrap(), "https://space.bilibili.com/");
    assert_eq!(headers.get(COOKIE).unwrap(), "SESSDATA=abc");
    assert!(browser_headers(None).get(COOKIE).is_none());
  }

  #[test]
  fn api_error_messages_are_actionable() {
    // 配过账户仍被拒 → 提示更新；没配过 → 引导添加
    assert_eq!(
      api_error(-352, "risk control", false),
      "B站风控或 SESSDATA 失效，请到设置更新"
    );
    assert_eq!(
      api_error(-412, "intercepted", true),
      "B站请求被风控：尚未配置 SESSDATA。请到 设置 → 来源账户 添加 B站账户"
    );
    assert_eq!(
      api_error(-101, "", true),
      "B站请求被风控：尚未配置 SESSDATA。请到 设置 → 来源账户 添加 B站账户"
    );
    assert!(api_error(-101, "", false).contains("SESSDATA 已失效"));
    assert_eq!(api_error(1, "boom", false), "B站接口错误 1: boom");
  }
}
