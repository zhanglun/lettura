//! feed_rs 模型 → fetcher-core 归一化类型的映射。
//! media JSON 的字段名与旧 `Wrapped*` 序列化保持一致（前端直接消费）。

use chrono::{DateTime, Utc};
use feed_rs::model::{Entry, Link, MediaObject, Person};
use fetcher_core::{
  Carrier, FetchedArticle, MediaAttachment, MediaContent, MediaImage, MediaLink, MediaText,
  MediaThumbnail,
};

/// Normalize an optional publish/updated time into a UTC string formatted as
/// `YYYY-MM-DD HH:MM:SS`, matching SQLite's `CURRENT_TIMESTAMP` and the
/// `create_date`/`update_date` columns. Returns an empty string when the
/// source provides no time; the query layer falls back to `create_date`.
pub fn normalize_pub_date(t: Option<DateTime<Utc>>) -> String {
  match t {
    Some(dt) => dt.naive_utc().format("%Y-%m-%d %H:%M:%S").to_string(),
    None => String::new(),
  }
}

/// 条目级类型判定：这条能不能站内播（audio enclosure）——与源类型无关的独立轴。
/// audio enclosure → audio；否则用来源声明的载体提示（video/email）；兜底 text。
pub fn classify_item(carrier_hint: Option<Carrier>, media: &[MediaObject]) -> Carrier {
  if has_audio(media) {
    return Carrier::Audio;
  }
  match carrier_hint {
    Some(Carrier::Video) | Some(Carrier::Email) => carrier_hint.unwrap(),
    _ => Carrier::Text,
  }
}

fn has_audio(media: &[MediaObject]) -> bool {
  media.iter().any(|m| {
    m.content.iter().any(|c| {
      c.content_type
        .as_ref()
        .map(|ct| ct.to_string().starts_with("audio"))
        .unwrap_or(false)
    })
  })
}

fn to_media_text(text: &feed_rs::model::Text) -> MediaText {
  MediaText {
    content_type: text.content_type.to_string(),
    src: text.src.clone(),
    content: text.content.clone(),
  }
}

fn to_media_link(link: &Link) -> MediaLink {
  MediaLink {
    href: link.href.clone(),
    rel: link.rel.clone(),
    media_type: link.media_type.clone(),
    href_lang: link.href_lang.clone(),
    title: link.title.clone(),
    length: link.length.map(|l| l as i64),
  }
}

fn to_media_image(image: &feed_rs::model::Image) -> MediaImage {
  MediaImage {
    uri: Some(image.uri.clone()),
    title: image.title.clone(),
    link: image.link.as_ref().map(to_media_link),
    width: image.width,
    height: image.height,
    description: image.description.clone(),
  }
}

pub fn to_media_object(m: &MediaObject) -> MediaAttachment {
  MediaAttachment {
    title: m.title.as_ref().map(to_media_text),
    description: m.description.as_ref().map(to_media_text),
    content: m
      .content
      .iter()
      .map(|c| MediaContent {
        url: c.url.as_ref().map(|u| u.to_string()),
        content_type: c
          .content_type
          .as_ref()
          .map(|ct| ct.to_string())
          .unwrap_or_else(|| String::from("unknown")),
        height: c.height,
        width: c.width,
        size: c.size,
      })
      .collect(),
    thumbnails: m
      .thumbnails
      .iter()
      .map(|t| MediaThumbnail {
        image: to_media_image(&t.image),
        // feed-rs 的 time 是精灵图裁剪时刻（Duration）；前端不消费，存秒数字符串即可
        time: t.time.map(|d| d.as_secs().to_string()),
      })
      .collect(),
    duration: m.duration.map(|d| d.as_secs()),
  }
}

/// feed_rs 作者字段有个坑：占位名 "author" 时真名在 email 里
fn to_author(person: &Person) -> String {
  if person.name == "author" {
    person.email.clone().unwrap_or_else(|| person.name.clone())
  } else {
    person.name.clone()
  }
}

pub fn to_article(entry: &Entry, carrier_hint: Option<Carrier>) -> FetchedArticle {
  FetchedArticle {
    title: entry
      .title
      .as_ref()
      .map(|t| t.content.clone())
      .unwrap_or_default(),
    link: entry
      .links
      .first()
      .map(|l| l.href.clone())
      .unwrap_or_default(),
    content_html: entry.content.as_ref().and_then(|c| c.body.clone()),
    summary: entry.summary.as_ref().map(|s| s.content.clone()),
    author: entry.authors.first().map(to_author),
    published_at: normalize_pub_date(entry.published),
    media: entry.media.iter().map(to_media_object).collect(),
    carrier: classify_item(carrier_hint, &entry.media),
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_normalize_pub_date() {
    let dt = DateTime::parse_from_rfc3339("2026-09-27T08:30:00Z")
      .unwrap()
      .with_timezone(&Utc);
    assert_eq!(normalize_pub_date(Some(dt)), "2026-09-27 08:30:00");
    assert_eq!(normalize_pub_date(None), "");
  }

  #[test]
  fn test_classify_item() {
    let empty: Vec<MediaObject> = vec![];
    // 无音频 + 无提示 → text
    assert_eq!(classify_item(None, &empty), Carrier::Text);
    // 提示 video/email 生效，audio 提示不生效（音频只能由 enclosure 反推）
    assert_eq!(classify_item(Some(Carrier::Video), &empty), Carrier::Video);
    assert_eq!(classify_item(Some(Carrier::Email), &empty), Carrier::Email);
    assert_eq!(classify_item(Some(Carrier::Audio), &empty), Carrier::Text);
  }
}
