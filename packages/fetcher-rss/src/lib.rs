//! 抓 RSS 的 fetcher：从 `apps/desktop/src-tauri/src/feed/mod.rs` 原样搬运的
//! 请求/解析/发现层，改为通过调用方传入的 HTTP 客户端发请求
//! （UA/代理/超时策略仍由 app 侧 `create_client` 单一决定）。

use async_trait::async_trait;
use feed_rs::parser;
use fetcher_core::{
  Carrier, DetectInput, DetectOutput, FeedDraft, FetchContext, FetchedArticle, Fetcher,
};

pub mod discovery;
pub mod mapping;

use mapping::to_article;

pub struct RssFetcher;

#[async_trait]
impl Fetcher for RssFetcher {
  fn id(&self) -> &'static str {
    "rss"
  }

  fn carrier_hint(&self) -> Carrier {
    Carrier::Text
  }

  /// rss 是探测分发的兜底：任何输入都愿意试
  fn claims(&self, _raw: &str) -> bool {
    true
  }

  /// 「粘贴任何地址」的兑现：直接是 feed 就用它；是网页就认声明的
  /// alternate，再试常见路径。预览与订阅共用（解析结果有短时缓存，
  /// 订阅时不再发第二次请求）。
  async fn detect(&self, input: &DetectInput) -> Result<DetectOutput, String> {
    let (res, resolved_url, candidates) =
      discovery::resolve_feed_input(&input.raw, &input.http).await?;

    let entries: Vec<FetchedArticle> = res
      .entries
      .iter()
      .map(|entry| to_article(entry, input.carrier_hint))
      .collect();

    let feed = FeedDraft {
      title: res
        .title
        .as_ref()
        .map(|t| t.content.clone())
        .unwrap_or_default(),
      link: res
        .links
        .first()
        .map(|l| l.href.clone())
        .unwrap_or_default(),
      logo: res.logo.as_ref().map(|l| l.uri.clone()).unwrap_or_default(),
      description: res
        .description
        .as_ref()
        .map(|d| d.content.clone())
        .unwrap_or_default(),
      pub_date: mapping::normalize_pub_date(res.published),
      updated: mapping::normalize_pub_date(res.updated),
      // 源级载体：客户端提示优先（video/email），否则由条目音频反推
      carrier: feed_carrier(input.carrier_hint, &entries),
    };

    Ok(DetectOutput {
      provider: self.id().to_string(),
      feed,
      resolved_url,
      candidates,
      entries,
      source_config: serde_json::Value::Null,
    })
  }

  /// 周期同步：直接抓取解析（不走缓存——同步路径要的是新鲜数据）。
  async fn fetch(&self, ctx: &FetchContext) -> Result<Vec<FetchedArticle>, String> {
    let (body, _final_url) = discovery::fetch_body(&ctx.feed.feed_url, &ctx.http).await?;
    let res = parser::parse(body.as_bytes()).map_err(|error| {
      log::error!("content parse error{:?}", error);
      error.to_string()
    })?;

    // 同步路径的载体提示沿用源上已落库的 carrier（与旧 create_article_models 一致）
    Ok(
      res
        .entries
        .iter()
        .map(|entry| to_article(entry, Some(ctx.feed.carrier)))
        .collect(),
    )
  }
}

/// 源级载体提示：客户端按订阅模式声明（video/email），或由条目音频反推
pub fn feed_carrier(hint: Option<Carrier>, entries: &[FetchedArticle]) -> Carrier {
  if let Some(carrier @ (Carrier::Video | Carrier::Email)) = hint {
    return carrier;
  }
  if entries.iter().any(|entry| entry.carrier == Carrier::Audio) {
    return Carrier::Audio;
  }
  Carrier::Text
}

#[cfg(test)]
mod tests {
  use super::*;
  use fetcher_core::{MediaAttachment, MediaContent};

  /// 迁自主 crate `feed/article.rs`：入库判定语义必须保持——
  /// audio enclosure → audio；来源声明 video/email 则照用；其余 text
  #[test]
  fn test_classify_from_parsed_feed() {
    let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0"><channel>
        <title>测试源</title><link>https://example.com</link><description>d</description>
        <item>
          <title>EP.1 音频单集</title>
          <link>https://example.com/ep1</link>
          <enclosure url="https://example.com/ep1.mp3" type="audio/mpeg" length="1"/>
        </item>
        <item>
          <title>文字公告</title>
          <link>https://example.com/post</link>
          <description>纯文字</description>
        </item>
      </channel></rss>"#;

    let feed = parser::parse(xml.as_bytes()).expect("parse test feed");
    let audio_entry = &feed.entries[0];
    let text_entry = &feed.entries[1];

    // 条目载体（决定"能不能站内播"）
    assert_eq!(
      mapping::classify_item(None, &audio_entry.media),
      Carrier::Audio
    );
    assert_eq!(
      mapping::classify_item(None, &text_entry.media),
      Carrier::Text
    );
    assert_eq!(
      mapping::classify_item(Some(Carrier::Video), &audio_entry.media),
      Carrier::Audio,
      "有音频就是音频（先问能不能播）"
    );
    assert_eq!(
      mapping::classify_item(Some(Carrier::Video), &text_entry.media),
      Carrier::Video
    );
    assert_eq!(
      mapping::classify_item(Some(Carrier::Email), &text_entry.media),
      Carrier::Email
    );

    // 归一化条目上 carriers 落位一致
    let items: Vec<FetchedArticle> = feed.entries.iter().map(|e| to_article(e, None)).collect();
    assert_eq!(items[0].carrier, Carrier::Audio);
    assert_eq!(items[1].carrier, Carrier::Text);
    assert_eq!(items[0].media[0].content[0].content_type, "audio/mpeg");

    // 源级载体提示（源列表图标）：无声明时由音频反推；声明优先
    assert_eq!(
      feed_carrier(None, &items),
      Carrier::Audio,
      "有音频条目的源 → audio"
    );
    assert_eq!(
      feed_carrier(Some(Carrier::Video), &items),
      Carrier::Video,
      "生成器声明的载体优先"
    );

    // 无音频 enclosure 的源
    let text_xml = r#"<?xml version="1.0"?><rss version="2.0"><channel>
        <title>纯文字源</title><link>https://example.com</link><description>d</description>
        <item><title>a</title><link>https://example.com/a</link></item>
      </channel></rss>"#;
    let text_feed = parser::parse(text_xml.as_bytes()).expect("parse");
    let text_items: Vec<FetchedArticle> = text_feed
      .entries
      .iter()
      .map(|e| to_article(e, None))
      .collect();
    assert_eq!(feed_carrier(None, &text_items), Carrier::Text);
  }

  #[test]
  fn feed_carrier_hint_priority() {
    // 客户端声明 video/email 优先
    assert_eq!(feed_carrier(Some(Carrier::Video), &[]), Carrier::Video);
    assert_eq!(feed_carrier(Some(Carrier::Email), &[]), Carrier::Email);
    // 无声明时由条目音频反推
    let audio_entry = FetchedArticle {
      title: String::new(),
      link: String::new(),
      content_html: None,
      summary: None,
      author: None,
      published_at: String::new(),
      media: vec![MediaAttachment {
        title: None,
        description: None,
        content: vec![MediaContent {
          url: None,
          content_type: "audio/mpeg".into(),
          height: None,
          width: None,
          size: None,
        }],
        thumbnails: vec![],
        duration: None,
      }],
      carrier: Carrier::Audio,
    };
    assert_eq!(feed_carrier(None, &[audio_entry]), Carrier::Audio);
    assert_eq!(feed_carrier(None, &[]), Carrier::Text);
  }
}
