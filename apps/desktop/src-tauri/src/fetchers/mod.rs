//! fetcher registry（组装点）+ 探测分发 + 归一化条目 → 主库模型的转换器。
//!
//! 这里是 fetcher 家族与主 crate 的唯一衔接面：
//!   - registry：fetcher 家族在此注册（顺序 = 探测认领顺序，rss 兜底放最后）
//!   - 探测分发：显式 provider_hint 直达；否则按 claims 认领，rss 兜底
//!   - 转换器：`FetchedArticle/FeedDraft → NewArticle/NewFeed`，入库路径
//!     （UNIQUE(link,title) 去重、health_status、事件）全部留在主 crate

use std::collections::HashMap;
use std::sync::Arc;

use crate::models;
use fetcher_core::{Carrier, DetectInput, DetectOutput, FeedDraft, FetchedArticle, Fetcher};
use once_cell::sync::Lazy;

/// 注册顺序即探测认领顺序：专门的在前，rss 兜底垫底。
/// 新增源 = 新 crate + 这里一行。
static FETCHERS: Lazy<Vec<Arc<dyn Fetcher>>> = Lazy::new(|| {
  vec![
    Arc::new(fetcher_mail::MailFetcher),
    Arc::new(fetcher_bilibili::BilibiliFetcher),
    Arc::new(fetcher_site::SiteFetcher),
    Arc::new(fetcher_rss::RssFetcher),
  ]
});

/// 按 feeds.provider 取 fetcher；未知 provider 回落 rss
/// （存量行全部 provider='rss'，回落只为防御手工改库/迁移缺失）。
pub fn resolve(provider: &str) -> Arc<dyn Fetcher> {
  FETCHERS
    .iter()
    .find(|f| f.id() == provider)
    .or_else(|| FETCHERS.iter().find(|f| f.id() == "rss"))
    .cloned()
    .expect("rss fetcher must be registered")
}

/// 无显式 provider_hint 时，按探测分发同序推断粘贴内容的来源
/// （rss 兜底不参与——它什么都能"接"，不构成账户推断依据）。
pub fn claimed_provider(raw: &str) -> Option<&'static str> {
  FETCHERS
    .iter()
    .filter(|f| f.id() != "rss")
    .find(|f| f.claims(raw))
    .map(|f| f.id())
}

/// 探测分发：
/// 1. 显式 provider_hint（前端订阅模式）→ 只用该 fetcher，错误直传
/// 2. 否则按注册顺序试 claims 命中的 fetcher，首个成功即用
/// 3. 有 fetcher 认领过但都失败 → 记住第一个错误，rss 也失败时返回它
///    （比 rss 的"Not a feed"更具操作性；rss 成功则用 rss——如 GitHub API
///    限流时自动回落到 commits.atom）
pub async fn detect(input: &DetectInput) -> Result<DetectOutput, String> {
  if let Some(hint) = &input.provider_hint {
    let fetcher = resolve(hint);
    return fetcher.detect(input).await;
  }

  let mut claimed_error: Option<String> = None;
  for fetcher in FETCHERS.iter().filter(|f| f.id() != "rss") {
    if !fetcher.claims(&input.raw) {
      continue;
    }
    match fetcher.detect(input).await {
      Ok(output) => return Ok(output),
      Err(err) => {
        if claimed_error.is_none() {
          claimed_error = Some(err);
        }
      }
    }
  }

  match resolve("rss").detect(input).await {
    Ok(output) => Ok(output),
    Err(rss_err) => Err(claimed_error.unwrap_or(rss_err)),
  }
}

/// FeedDraft → 主库订阅行（uuid/origin/sort 由调用方与 add_feed 决定）
pub fn to_new_feed(
  uuid: &str,
  feed_url: &str,
  provider: &str,
  draft: &FeedDraft,
  origin: &str,
  account_uuid: Option<String>,
  source_config: Option<String>,
) -> models::NewFeed {
  models::NewFeed {
    uuid: uuid.to_string(),
    origin: origin.to_string(),
    title: draft.title.clone(),
    link: draft.link.clone(),
    logo: draft.logo.clone(),
    feed_url: feed_url.to_string(),
    description: draft.description.clone(),
    pub_date: draft.pub_date.clone(),
    updated: draft.updated.clone(),
    sort: 0,
    carrier: draft.carrier.as_str().to_string(),
    provider: provider.to_string(),
    account_uuid,
    source_config,
  }
}

/// FetchedArticle → 主库文章行
pub fn to_new_article(
  channel_uuid: &str,
  feed_url: &str,
  item: &FetchedArticle,
) -> models::NewArticle {
  let media_json = serde_json::to_string(&item.media).expect("media_object must serialize");

  models::NewArticle {
    uuid: uuid::Uuid::new_v4().hyphenated().to_string(),
    feed_uuid: channel_uuid.to_string(),
    title: item.title.clone(),
    link: item.link.clone(),
    content: item.content_html.clone().unwrap_or_default(),
    feed_url: feed_url.to_string(),
    description: item.summary.clone().unwrap_or_default(),
    author: item.author.clone().unwrap_or_default(),
    pub_date: item.published_at.clone(),
    media_object: media_json,
    carrier: item.carrier.as_str().to_string(),
  }
}

/// 从条目媒体里取单集时长（秒）——播客列表预览用
pub fn item_duration(item: &FetchedArticle) -> Option<i64> {
  item.media.iter().find_map(|m| m.duration.map(|d| d as i64))
}

pub fn carrier_from_str(s: &str) -> Option<Carrier> {
  Carrier::from_str(s)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_resolve_falls_back_to_rss() {
    assert_eq!(resolve("rss").id(), "rss");
    assert_eq!(resolve("no-such-provider").id(), "rss");
  }

  #[test]
  fn test_fetcher_order() {
    // 认领顺序：专门的在前，rss 兜底垫底
    let ids: Vec<&str> = FETCHERS.iter().map(|f| f.id()).collect();
    assert_eq!(ids.first(), Some(&"mail"));
    assert_eq!(ids.last(), Some(&"rss"));
  }

  #[test]
  fn test_claimed_provider_for_account_fallback() {
    // 账户回落推断：space 链接 → bilibili；发件人地址 → mail；普通 URL → None（rss 兜底）
    assert_eq!(claimed_provider("https://space.bilibili.com/546195"), Some("bilibili"));
    assert_eq!(claimed_provider("digest@substack.com"), Some("mail"));
    assert_eq!(claimed_provider("https://example.com/feed.xml"), None);
  }

  #[test]
  fn test_to_new_article_defaults() {
    let item = FetchedArticle {
      title: "t".into(),
      link: "https://example.com/a".into(),
      content_html: None,
      summary: None,
      author: None,
      published_at: String::new(),
      media: vec![],
      carrier: Carrier::Text,
    };
    let article = to_new_article("feed-uuid", "https://example.com/feed", &item);
    assert_eq!(article.feed_uuid, "feed-uuid");
    assert_eq!(article.content, "");
    assert_eq!(article.description, "");
    assert_eq!(article.author, "");
    assert_eq!(article.media_object, "[]");
    assert_eq!(article.carrier, "text");
    assert!(!article.uuid.is_empty());
  }
}
