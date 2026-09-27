//! fetcher-core：订阅源抓取的公共契约。
//!
//! 这个 crate 是 fetcher 家族与主程序之间的唯一边界：
//!   - fetcher crates（rss/mail/bilibili/site）只依赖这里，把任意来源
//!     归一化成 [`FetchedArticle`]；
//!   - 主程序只依赖这里组装 registry、下发 [`FetchContext`]，
//!     入库（去重/健康状态/事件）全部留在主程序。
//!
//! 依赖方向是单向的：**fetcher crates 禁止依赖 diesel / tauri / actix**——
//! crate 图物理强制这一点，不靠 review。本 crate 自身也不感知
//! feed_rs/IMAP 等具体来源的实现细节，只定义「抓回来长什么样」。

use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};

/// 条目载体：怎么消费这条内容（能不能站内播 / 要不要外跳）。
/// 与主库 `articles.carrier` 列、前端 `mediaType.ts` 读同一套字符串。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum Carrier {
  #[default]
  Text,
  Audio,
  Video,
  Email,
}

impl Carrier {
  pub fn as_str(&self) -> &'static str {
    match self {
      Carrier::Text => "text",
      Carrier::Audio => "audio",
      Carrier::Video => "video",
      Carrier::Email => "email",
    }
  }

  pub fn from_str(s: &str) -> Option<Carrier> {
    match s {
      "audio" => Some(Carrier::Audio),
      "video" => Some(Carrier::Video),
      "email" => Some(Carrier::Email),
      "text" => Some(Carrier::Text),
      _ => None,
    }
  }
}

/// 媒体附件，JSON 形状与既有 `media_object` 列一致（前端 PodcastAdapter /
/// `pickThumbUrl` 直接读它），序列化字段名保持不变。
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct MediaText {
  pub content_type: String,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub src: Option<String>,
  pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct MediaContent {
  #[serde(skip_serializing_if = "Option::is_none")]
  pub url: Option<String>,
  pub content_type: String,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub height: Option<u32>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub width: Option<u32>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub size: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct MediaLink {
  pub href: String,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub rel: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub media_type: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub href_lang: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub title: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub length: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct MediaImage {
  #[serde(skip_serializing_if = "Option::is_none")]
  pub uri: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub title: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub link: Option<MediaLink>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub width: Option<u32>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub height: Option<u32>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct MediaThumbnail {
  pub image: MediaImage,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub time: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct MediaAttachment {
  #[serde(skip_serializing_if = "Option::is_none")]
  pub title: Option<MediaText>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub description: Option<MediaText>,
  pub content: Vec<MediaContent>,
  pub thumbnails: Vec<MediaThumbnail>,
  /// 单集时长（秒）。RSS 为 itunes:duration；播客列表页用。
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<u64>,
}

/// 归一化条目：所有 fetcher 的唯一产出物。
/// 主程序拿它转换入库，未读/收藏/过滤/渲染链路对来源零感知。
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct FetchedArticle {
  pub title: String,
  /// 全局唯一且稳定（rss=原文链接；mail=`urn:lettura:mail/{account}/{uid}`），
  /// 主库靠 UNIQUE(link, title) 去重。
  pub link: String,
  pub content_html: Option<String>,
  pub summary: Option<String>,
  pub author: Option<String>,
  /// `YYYY-MM-DD HH:MM:SS`（UTC）或空串；与主库 pub_date 列格式一致。
  pub published_at: String,
  pub media: Vec<MediaAttachment>,
  pub carrier: Carrier,
}

/// 源级草稿：detect 阶段 fetcher 对「这个源长什么样」的描述。
/// 主程序补 uuid/origin/sort 后落 feeds 表。
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct FeedDraft {
  pub title: String,
  pub link: String,
  pub logo: String,
  pub description: String,
  pub pub_date: String,
  pub updated: String,
  pub carrier: Carrier,
}

/// detect 的输入：用户粘贴的原始内容 + 客户端提示 + 统一 HTTP 客户端。
#[derive(Debug, Clone)]
pub struct DetectInput {
  pub raw: String,
  /// 明确指定 provider（前端订阅模式，如邮件模式 → "mail"）；
  /// 有 hint 时只用该 fetcher，不再逐个认领
  pub provider_hint: Option<String>,
  /// 载体提示（订阅模式/生成器声明，如 substack → email）；None = 让 fetcher 自判
  pub carrier_hint: Option<Carrier>,
  /// 需要账户的 fetcher（mail/bilibili）从这里拿凭据，由 app 解析好递入
  pub account: Option<AccountMaterial>,
  /// app 统一构造的客户端（UA/代理/超时策略单一出口），fetcher 不得自建
  pub http: Client,
}

/// detect 的输出：源草稿 + 生效地址 + 候选 + 预览条目。
#[derive(Debug, Clone)]
pub struct DetectOutput {
  /// 认领的 fetcher id——主库 feeds.provider 存这个
  pub provider: String,
  pub feed: FeedDraft,
  /// 真正生效的地址（粘贴网页时 != 输入）
  pub resolved_url: String,
  /// 探测过程中试过的候选地址（多个时界面列出来让用户换）
  pub candidates: Vec<String>,
  pub entries: Vec<FetchedArticle>,
  /// 每源配置（mail 的发件人列表、bilibili 的 mid 等），落 feeds.source_config
  pub source_config: serde_json::Value,
}

/// fetch 阶段的源视图：主库 feeds 行里 fetcher 需要的那部分。
#[derive(Debug, Clone)]
pub struct FeedView {
  pub uuid: String,
  pub feed_url: String,
  pub provider: String,
  pub origin: String,
  pub carrier: Carrier,
  /// 每源配置（发件人列表、B站 mid 等），JSON 自由形状
  pub source_config: serde_json::Value,
}

/// 账户凭据材料：主程序按 feed.account_uuid 解析好再递进来，
/// fetcher 自己不读 DB / 不读配置文件——密钥面收敛在 app 一处。
#[derive(Debug, Clone)]
pub struct AccountMaterial {
  pub uuid: String,
  pub provider: String,
  pub settings: serde_json::Value,
}

/// fetch 的上下文。
#[derive(Debug, Clone)]
pub struct FetchContext {
  pub feed: FeedView,
  pub account: Option<AccountMaterial>,
  pub http: Client,
}

/// 订阅源抓取器：一类来源一个实现（rss / mail / bilibili / site…）。
///
/// 实现必须无状态：feed 配置与凭据从 `ctx` 进，条目出；
/// 不碰数据库、不碰调度、不发事件。
#[async_trait]
pub trait Fetcher: Send + Sync {
  /// 主库 feeds.provider 存的标识
  fn id(&self) -> &'static str;

  /// 这类源的默认源级载体（rss=text、mail=email、bilibili=video）
  fn carrier_hint(&self) -> Carrier;

  /// 这份输入归不归我管（粘贴 URL/地址的快速认领）。
  /// rss 作为兜底恒真；探测分发按注册顺序试 claims 命中的 fetcher。
  fn claims(&self, raw: &str) -> bool {
    let _ = raw;
    false
  }

  /// 订阅时探测：把用户输入翻译成源草稿 + 预览条目。
  /// 对 rss 这是「任意地址 → feed」的发现层；对 mail 是校验收件账户。
  async fn detect(&self, input: &DetectInput) -> Result<DetectOutput, String>;

  /// 周期同步：拉新条目。
  async fn fetch(&self, ctx: &FetchContext) -> Result<Vec<FetchedArticle>, String>;
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn carrier_roundtrip() {
    for c in [
      Carrier::Text,
      Carrier::Audio,
      Carrier::Video,
      Carrier::Email,
    ] {
      assert_eq!(Carrier::from_str(c.as_str()), Some(c));
    }
    assert_eq!(Carrier::from_str("other"), None);
  }

  #[test]
  fn media_json_shape_matches_legacy_media_object() {
    // 前端 PodcastAdapter 读 media[0].content[0].url，pickThumbUrl 读 thumbnails[i].image.uri；
    // 序列化字段名必须与旧 Wrapped* 保持一致。
    let item = FetchedArticle {
      title: "t".into(),
      link: "https://example.com/a".into(),
      content_html: Some("<p>x</p>".into()),
      summary: None,
      author: Some("a".into()),
      published_at: String::new(),
      media: vec![MediaAttachment {
        title: None,
        description: None,
        content: vec![MediaContent {
          url: Some("https://example.com/e.mp3".into()),
          content_type: "audio/mpeg".into(),
          height: None,
          width: None,
          size: None,
        }],
        thumbnails: vec![MediaThumbnail {
          image: MediaImage {
            uri: Some("https://example.com/cover.jpg".into()),
            title: None,
            link: None,
            width: None,
            height: None,
            description: None,
          },
          time: None,
        }],
        duration: Some(3600),
      }],
      carrier: Carrier::Audio,
    };

    let json: serde_json::Value = serde_json::to_value(&item).unwrap();
    let content0 = &json["media"][0]["content"][0];
    assert_eq!(content0["url"], "https://example.com/e.mp3");
    assert_eq!(content0["content_type"], "audio/mpeg");
    assert_eq!(
      json["media"][0]["thumbnails"][0]["image"]["uri"],
      "https://example.com/cover.jpg"
    );
    assert_eq!(json["media"][0]["duration"], 3600);
    assert_eq!(json["carrier"], "audio");
  }
}
