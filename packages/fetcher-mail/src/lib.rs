//! fetcher-mail：IMAP 邮箱抓取器——把指定发件人的 newsletter 邮件归一化成
//! [`FetchedArticle`]。
//!
//! 与 fetcher-rss 同一条契约：实现 [`Fetcher`]，无状态，feed 配置与凭据从
//! ctx 进、条目出；不碰数据库、不碰调度、不发事件。分层：
//!   - `imap.rs` 连接/登录/搜索/拉取（只认 MailSettings，不认识条目）
//!   - `mapping.rs` 邮件 → 条目的字段映射（纯函数，离线可测）
//!   - 本文件组装 detect/fetch 两个流程，并提供主 crate 直调的
//!     `probe_account` / `max_uid_in`
//!
//! 增量协议：source_config.last_uid 记已同步的最大 uid（主 crate 同步成功后
//! 写回），下次只拉 > last_uid 的邮件；首次同步（last_uid==0）只取最新
//! 50 封，避免老邮箱全量灌库。

use async_trait::async_trait;
use fetcher_core::{
  Carrier, DetectInput, DetectOutput, FeedDraft, FetchContext, FetchedArticle, Fetcher,
};
use serde_json::Value;

pub mod imap;
pub mod mapping;

/// detect 预览每发件人取最新几封
const PREVIEW_COUNT: u32 = 5;
/// 首次同步（last_uid==0）最多灌入多少封
const INITIAL_FETCH_MAX: u32 = 50;

pub struct MailFetcher;

#[async_trait]
impl Fetcher for MailFetcher {
  fn id(&self) -> &'static str {
    "mail"
  }

  fn carrier_hint(&self) -> Carrier {
    Carrier::Email
  }

  /// 输入含 '@' 即认领——邮件地址
  fn claims(&self, raw: &str) -> bool {
    raw.contains('@')
  }

  /// 订阅探测：校验发件人地址 + 登录邮箱可达性，抓每发件人最新几封做预览。
  /// 登录不可达 / 地址非法都直接 Err，让用户当场改输入。
  async fn detect(&self, input: &DetectInput) -> Result<DetectOutput, String> {
    let addresses = parse_from_addresses(&input.raw)?;
    let account = input
      .account
      .as_ref()
      .ok_or_else(|| "请先在设置中添加邮箱账户".to_string())?;
    let settings = imap::parse_settings(&account.settings)?;

    let mut session = imap::connect_session(&settings).await?;
    let mut entries: Vec<FetchedArticle> = Vec::new();
    for addr in &addresses {
      let uids = imap::latest_uids(imap::search_uids(&mut session, addr).await?, PREVIEW_COUNT);
      for (uid, raw) in imap::fetch_raw_messages(&mut session, &uids).await? {
        entries.push(mapping::article_from_raw(&account.uuid, uid, &raw)?);
      }
    }
    let _ = session.logout().await;

    Ok(DetectOutput {
      provider: self.id().to_string(),
      feed: FeedDraft {
        title: format!("邮件订阅 · {}", addresses[0]),
        carrier: Carrier::Email,
        ..FeedDraft::default()
      },
      // resolved_url 同地址组合恒同串：既当 feeds.feed_url 又当去重键
      resolved_url: format!(
        "urn:lettura:mail/{}/{}",
        account.uuid,
        addresses_key(&addresses)
      ),
      candidates: Vec::new(),
      entries,
      source_config: serde_json::json!({ "from_addresses": addresses }),
    })
  }

  /// 周期同步：并集所有发件人的 uid → 按 last_uid 增量 → 分批拉原文 → 映射。
  /// 任何一步失败都 Err——半成功的数据没法写 last_uid 游标。
  async fn fetch(&self, ctx: &FetchContext) -> Result<Vec<FetchedArticle>, String> {
    let account = ctx
      .account
      .as_ref()
      .ok_or_else(|| "邮件源缺少关联账户，无法同步".to_string())?;
    let settings = imap::parse_settings(&account.settings)?;
    let addresses = from_addresses_of(&ctx.feed.source_config)?;
    let last_uid = ctx
      .feed
      .source_config
      .get("last_uid")
      .and_then(Value::as_u64)
      .unwrap_or(0);

    let mut session = imap::connect_session(&settings).await?;

    let mut uids: Vec<u32> = Vec::new();
    for addr in &addresses {
      uids.extend(imap::search_uids(&mut session, addr).await?);
    }
    uids.sort_unstable();
    uids.dedup();

    let selected: Vec<u32> = if last_uid > 0 {
      uids
        .into_iter()
        .filter(|uid| u64::from(*uid) > last_uid)
        .collect()
    } else {
      imap::latest_uids(uids, INITIAL_FETCH_MAX)
    };

    let mut items: Vec<FetchedArticle> = Vec::new();
    for batch in selected.chunks(imap::FETCH_BATCH) {
      for (uid, raw) in imap::fetch_raw_messages(&mut session, batch).await? {
        items.push(mapping::article_from_raw(&account.uuid, uid, &raw)?);
      }
    }
    let _ = session.logout().await;
    log::debug!(
      "邮件源 {} 本次同步 {} 封（last_uid={last_uid}）",
      ctx.feed.uuid,
      items.len()
    );
    Ok(items)
  }
}

/// 设置页「测试连接」：连接 + 登录 + SELECT，全通过才算可用。
/// 失败的错误串已区分认证失败 / 连不上，可直接展示给用户。
pub async fn probe_account(settings: &Value) -> Result<String, String> {
  let parsed = imap::parse_settings(settings)?;
  let mut session = imap::connect_session(&parsed).await?;
  let _ = session.logout().await;
  Ok(format!(
    "连接成功：{}@{}（{}，文件夹 {}）",
    parsed.user,
    parsed.host,
    if parsed.tls { "TLS" } else { "明文" },
    parsed.folder
  ))
}

/// 从条目 link 尾段解析最大 uid——主 crate 同步成功后写回
/// source_config.last_uid 作增量游标用。
pub fn max_uid_in(items: &[FetchedArticle]) -> Option<u64> {
  items
    .iter()
    .filter_map(|item| item.link.rsplit('/').next())
    .filter_map(|tail| tail.parse::<u64>().ok())
    .max()
}

/// 用户输入的发件人列表：逗号/分号/空白分隔，逐个校验。
/// 禁引号与反斜杠——它们会破坏 IMAP SEARCH 的引号包裹。
pub fn parse_from_addresses(raw: &str) -> Result<Vec<String>, String> {
  let mut out: Vec<String> = Vec::new();
  for part in raw.split([',', ';', ' ', '\t', '\n', '\r']) {
    let addr = part.trim();
    if addr.is_empty() {
      continue;
    }
    if !addr.contains('@') {
      return Err(format!("“{addr}”不是有效的邮箱地址（缺少 @）"));
    }
    if addr.contains('"') || addr.contains('\\') {
      return Err(format!("邮箱地址 {addr} 含有非法字符"));
    }
    out.push(addr.to_string());
  }
  if out.is_empty() {
    return Err("请至少填写一个发件人邮箱地址".to_string());
  }
  Ok(out)
}

/// resolved_url 的稳定键：排序去重后的地址逗号串（同一组合 → 同一 feed）
fn addresses_key(addresses: &[String]) -> String {
  let mut sorted: Vec<&str> = addresses.iter().map(String::as_str).collect();
  sorted.sort_unstable();
  sorted.dedup();
  sorted.join(",")
}

/// fetch 用的源配置：from_addresses 必须有且非空，否则说明订阅数据不完整
fn from_addresses_of(config: &Value) -> Result<Vec<String>, String> {
  let list: Vec<String> = config
    .get("from_addresses")
    .and_then(Value::as_array)
    .map(|arr| {
      arr
        .iter()
        .filter_map(Value::as_str)
        .map(str::to_string)
        .collect()
    })
    .unwrap_or_default();
  if list.is_empty() {
    return Err("源配置缺少 from_addresses，请重新订阅该邮件源".to_string());
  }
  Ok(list)
}

#[cfg(test)]
mod tests {
  use super::*;
  use fetcher_core::AccountMaterial;

  fn article(link: &str) -> FetchedArticle {
    FetchedArticle {
      title: String::new(),
      link: link.to_string(),
      content_html: None,
      summary: None,
      author: None,
      published_at: String::new(),
      media: Vec::new(),
      carrier: Carrier::Email,
    }
  }

  #[test]
  fn addresses_parse_and_validate() {
    // 单个
    assert_eq!(parse_from_addresses("a@b.com").unwrap(), vec!["a@b.com"]);
    // 逗号 + 空白 + 分号混排
    assert_eq!(
      parse_from_addresses("a@b.com, c@d.com  e@f.com;g@h.com").unwrap(),
      vec!["a@b.com", "c@d.com", "e@f.com", "g@h.com"]
    );
    // 全空 / 纯逗号
    assert!(parse_from_addresses(" , ").is_err());
    // 不含 @
    let err = parse_from_addresses("notanemail").unwrap_err();
    assert!(err.contains('@'), "错误要说明缺 @：{err}");
    // 混合列表里有一个非法即整体 Err（detect 直接拦下让用户改）
    assert!(parse_from_addresses("a@b.com, bad").is_err());
    // 引号与反斜杠会破坏 IMAP SEARCH
    assert!(parse_from_addresses("a@b\"c.com").is_err());
    assert!(parse_from_addresses("a@b\\c.com").is_err());
  }

  #[test]
  fn resolved_key_sorts_and_dedups() {
    let addresses = vec![
      "z@b.com".to_string(),
      "a@b.com".to_string(),
      "z@b.com".to_string(),
    ];
    assert_eq!(addresses_key(&addresses), "a@b.com,z@b.com");
  }

  #[test]
  fn max_uid_reads_link_tail() {
    let items = vec![
      article("urn:lettura:mail/acc-1/9"),
      article("urn:lettura:mail/acc-1/230"),
      article("urn:lettura:mail/acc-2/42"),
      article("https://example.com/not-a-uid"), // 尾段解析不出数字，应被跳过
    ];
    assert_eq!(max_uid_in(&items), Some(230));
    assert_eq!(max_uid_in(&[]), None);
    assert_eq!(max_uid_in(&[article("https://example.com/x")]), None);
  }

  #[test]
  fn source_config_addresses_required() {
    assert_eq!(
      from_addresses_of(&serde_json::json!({ "from_addresses": ["a@b.com", "c@d.com"] })).unwrap(),
      vec!["a@b.com", "c@d.com"]
    );
    assert!(from_addresses_of(&serde_json::json!({})).is_err());
    assert!(from_addresses_of(&serde_json::json!({ "from_addresses": [] })).is_err());
    assert!(from_addresses_of(&serde_json::json!({ "from_addresses": [1, 2] })).is_err());
  }

  /// claims 是订阅模式的快速认领：含 @ 即 mail，不含则让给别的 fetcher
  #[test]
  fn claims_by_at_sign() {
    assert!(MailFetcher.claims("digest@substack.com"));
    assert!(!MailFetcher.claims("https://example.com/feed.xml"));
  }

  /// fetch 缺账户时的错误路径（不碰网络）
  #[tokio::test]
  async fn fetch_rejects_missing_account() {
    let ctx = FetchContext {
      feed: fetcher_core::FeedView {
        uuid: "f-1".into(),
        feed_url: "urn:lettura:mail/acc-1/a@b.com".into(),
        provider: "mail".into(),
        origin: String::new(),
        carrier: Carrier::Email,
        source_config: serde_json::json!({ "from_addresses": ["a@b.com"] }),
      },
      account: None,
      // mail 流程不发 HTTP，客户端只是契约里的必填位
      http: reqwest::Client::new(),
    };
    let err = MailFetcher.fetch(&ctx).await.unwrap_err();
    assert!(err.contains("账户"), "实际：{err}");
  }

  /// AccountMaterial 形状对齐 fetcher-core，防止主 crate 接线时字段漂移
  #[test]
  fn account_material_shape() {
    let material = AccountMaterial {
      uuid: "acc-1".into(),
      provider: "mail".into(),
      settings: serde_json::json!({"host": "imap.example.com", "user": "u", "password": "p"}),
    };
    assert_eq!(material.provider, "mail");
    assert!(imap::parse_settings(&material.settings).is_ok());
  }

  /// 真实端到端：需要真账户。环境变量同 imap.rs 的 live 测试，
  /// 另加 LETTURA_MAIL_FROMS（逗号分隔发件人）。
  #[tokio::test]
  #[ignore = "需要真实 IMAP 账户凭据（环境变量提供）"]
  async fn live_detect_and_fetch() {
    use fetcher_core::{DetectInput, FeedView};
    use std::env;

    let settings = serde_json::json!({
      "host": env::var("LETTURA_IMAP_HOST").expect("设 LETTURA_IMAP_HOST"),
      "user": env::var("LETTURA_IMAP_USER").expect("设 LETTURA_IMAP_USER"),
      "password": env::var("LETTURA_IMAP_PASSWORD").expect("设 LETTURA_IMAP_PASSWORD"),
    });
    assert!(probe_account(&settings).await.is_ok());

    let froms = env::var("LETTURA_MAIL_FROMS").expect("设 LETTURA_MAIL_FROMS");
    let client = reqwest::Client::new();
    let input = DetectInput {
      raw: froms,
      provider_hint: Some("mail".into()),
      carrier_hint: Some(Carrier::Email),
      account: Some(AccountMaterial {
        uuid: "live-acc".into(),
        provider: "mail".into(),
        settings,
      }),
      http: client.clone(),
    };
    let output = MailFetcher.detect(&input).await.expect("detect 成功");
    println!("预览条目数：{}", output.entries.len());

    let ctx = FetchContext {
      feed: FeedView {
        uuid: "live-feed".into(),
        feed_url: output.resolved_url.clone(),
        provider: "mail".into(),
        origin: String::new(),
        carrier: Carrier::Email,
        source_config: output.source_config.clone(),
      },
      account: input.account.clone(),
      http: client,
    };
    let items = MailFetcher.fetch(&ctx).await.expect("fetch 成功");
    println!("同步条目数：{}", items.len());
    if let Some(max) = max_uid_in(&items) {
      println!("max_uid：{max}");
    }
  }
}
