//! t.me 公开频道页（`https://t.me/s/{name}`）——硬编码站点。
//!
//! 为什么不走 TOML 规则：要从背景图 `style` 里抠图片地址、跳过服务气泡、
//! 标题要从正文截取——这些编排用选择器规则表达不了。
//! 页面结构变化时只改这一个文件。

use std::collections::HashMap;

use fetcher_core::{
  Carrier, FetchedArticle, MediaAttachment, MediaImage, MediaThumbnail,
};
use once_cell::sync::Lazy;
use regex::Regex;
use scraper::{Html, Selector};

static TME_PATTERN: Lazy<Regex> =
  Lazy::new(|| Regex::new(r"(?:https?://)?t\.me/s/([\w-]+)").unwrap());

static STYLE_URL_RE: Lazy<Regex> =
  Lazy::new(|| Regex::new(r#"url\(['"]([^'"]+)['"]\)"#).unwrap());

/// 认领 t.me/s/xxx（可无 scheme）
pub fn claims(raw: &str) -> bool {
  TME_PATTERN.is_match(raw.trim())
}

/// 输入 → (参数, 频道页 URL)
pub fn parse(raw: &str) -> Option<(HashMap<String, String>, String)> {
  let caps = TME_PATTERN.captures(raw.trim())?;
  let name = caps[1].to_string();
  let mut params = HashMap::new();
  params.insert("name".to_string(), name);
  let url = format!("https://t.me/s/{}", params["name"]);
  Some((params, url))
}

/// 从 source_config.params 还原频道页 URL
pub fn url_from_params(params: &HashMap<String, String>) -> Result<String, String> {
  let name = params
    .get("name")
    .ok_or_else(|| "source_config 缺少 name 参数".to_string())?;
  Ok(format!("https://t.me/s/{name}"))
}

fn selector(s: &str) -> Selector {
  Selector::parse(s).expect("tme selector broken")
}

/// 抓频道页并映射条目。返回 (频道标题, 条目)
pub async fn fetch(
  url: &str,
  http: &reqwest::Client,
) -> Result<(String, Vec<FetchedArticle>), String> {
  let response = http
    .get(url)
    .send()
    .await
    .map_err(|e| format!("频道页请求失败: {e}"))?;
  if !response.status().is_success() {
    return Err(format!("频道页请求 HTTP {}", response.status()));
  }
  let body = response.text().await.map_err(|e| e.to_string())?;
  let document = Html::parse_document(&body);

  let title = document
    .select(&selector(r#"meta[property="og:title"]"#))
    .next()
    .and_then(|el| el.value().attr("content"))
    .filter(|s| !s.is_empty())
    .unwrap_or("Telegram 频道")
    .to_string();

  let wrap_sel = selector(".tgme_widget_message_wrap");
  let service_sel = selector(".tgme_widget_service_message");
  let text_sel = selector(".tgme_widget_message_text");
  let date_link_sel = selector("a.tgme_widget_message_date");
  let time_sel = selector("time");
  let photo_sel = selector(".tgme_widget_message_photo_wrap");

  let mut entries = Vec::new();
  for wrap in document.select(&wrap_sel) {
    // 服务气泡（频道简介/进群提示）不是内容
    if wrap.select(&service_sel).next().is_some() {
      continue;
    }

    let content_html = wrap
      .select(&text_sel)
      .next()
      .map(|el| el.inner_html());
    let link = wrap
      .select(&date_link_sel)
      .next()
      .and_then(|el| el.value().attr("href"))
      .map(str::to_string);
    let published_at = wrap
      .select(&time_sel)
      .next()
      .and_then(|el| el.value().attr("datetime"))
      .map(str::to_string);

    let mut media = Vec::new();
    for photo in wrap.select(&photo_sel) {
      let Some(style) = photo.value().attr("style") else {
        continue;
      };
      if let Some(caps) = STYLE_URL_RE.captures(style) {
        media.push(MediaAttachment {
          title: None,
          description: None,
          content: vec![],
          thumbnails: vec![MediaThumbnail {
            image: MediaImage {
              uri: Some(caps[1].to_string()),
              ..Default::default()
            },
            time: None,
          }],
          duration: None,
        });
      }
    }

    // 纯转贴/占位气泡没有内容
    if content_html.is_none() && media.is_empty() {
      continue;
    }

    let plain = content_html
      .as_deref()
      .map(|html| {
        Html::parse_fragment(html)
          .root_element()
          .text()
          .collect::<String>()
      })
      .unwrap_or_default();
    let title = if plain.is_empty() {
      "媒体动态".to_string()
    } else {
      let first_line = plain.lines().next().unwrap_or_default().trim();
      first_line.chars().take(80).collect()
    };

    entries.push(FetchedArticle {
      title,
      link: link.unwrap_or_else(|| url.to_string()),
      content_html,
      summary: if plain.is_empty() {
        None
      } else {
        Some(plain.chars().take(200).collect())
      },
      author: None,
      published_at: published_at
        .and_then(|s| chrono::DateTime::parse_from_rfc3339(&s).ok())
        .map(|dt| {
          dt.with_timezone(&chrono::Utc)
            .naive_utc()
            .format("%Y-%m-%d %H:%M:%S")
            .to_string()
        })
        .unwrap_or_default(),
      media,
      carrier: Carrier::Text,
    });
  }

  Ok((title, entries))
}

#[cfg(test)]
mod tests {
  use super::*;

  const FIXTURE: &str = r#"
  <html><head><meta property="og:title" content="Durov's Channel"></head><body>
  <div class="tgme_widget_message_wrap">
    <div class="tgme_widget_message">
      <a class="tgme_widget_message_date" href="https://t.me/durov/200"><time datetime="2026-09-26T10:00:00+00:00"></time></a>
      <div class="tgme_widget_message_text">第一条<b>公告</b><br/>第二行</div>
      <div class="tgme_widget_message_photo_wrap" style="width:300px;background-image:url('https://cdn4.telesco.pe/file/pic.jpg')"></div>
    </div>
  </div>
  <div class="tgme_widget_message_wrap">
    <div class="tgme_widget_service_message">频道简介，不是内容</div>
  </div>
  <div class="tgme_widget_message_wrap">
    <div class="tgme_widget_message">
      <a class="tgme_widget_message_date" href="https://t.me/durov/201"><time datetime="2026-09-27T08:30:00+00:00"></time></a>
      <div class="tgme_widget_message_text">纯文字动态</div>
    </div>
  </div>
  </body></html>"#;

  #[test]
  fn test_parse() {
    let (params, url) = parse("https://t.me/s/durov").unwrap();
    assert_eq!(params["name"], "durov");
    assert_eq!(url, "https://t.me/s/durov");
    let (_, url) = parse("t.me/s/some_channel").unwrap();
    assert_eq!(url, "https://t.me/s/some_channel");
    assert!(!claims("https://example.com/s/durov"));
  }

  #[tokio::test]
  async fn test_fetch_fixture() {
    // 不走网络：直接喂 fixture HTML 的解析段（fetch 的解析部分与抓取分离的收益）
    let body = FIXTURE.to_string();
    let document = Html::parse_document(&body);

    let title = document
      .select(&selector(r#"meta[property="og:title"]"#))
      .next()
      .and_then(|el| el.value().attr("content"))
      .unwrap()
      .to_string();
    assert_eq!(title, "Durov's Channel");

    let wrap_sel = selector(".tgme_widget_message_wrap");
    let service_sel = selector(".tgme_widget_service_message");
    let text_sel = selector(".tgme_widget_message_text");
    let date_link_sel = selector("a.tgme_widget_message_date");
    let time_sel = selector("time");
    let photo_sel = selector(".tgme_widget_message_photo_wrap");

    let mut count = 0;
    for wrap in document.select(&wrap_sel) {
      if wrap.select(&service_sel).next().is_some() {
        continue;
      }
      count += 1;
      let link = wrap
        .select(&date_link_sel)
        .next()
        .and_then(|el| el.value().attr("href"))
        .unwrap();
      let published_at = wrap
        .select(&time_sel)
        .next()
        .and_then(|el| el.value().attr("datetime"))
        .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
        .map(|dt| {
          dt.with_timezone(&chrono::Utc)
            .naive_utc()
            .format("%Y-%m-%d %H:%M:%S")
            .to_string()
        })
        .unwrap();
      let content_html = wrap.select(&text_sel).next().map(|el| el.inner_html());
      let mut media = Vec::new();
      for photo in wrap.select(&photo_sel) {
        let style = photo.value().attr("style").unwrap();
        if let Some(caps) = STYLE_URL_RE.captures(style) {
          media.push(caps[1].to_string());
        }
      }

      if link.ends_with("/200") {
        assert_eq!(published_at, "2026-09-26 10:00:00");
        assert!(content_html.unwrap().contains("<b>公告</b>"));
        assert_eq!(media, vec!["https://cdn4.telesco.pe/file/pic.jpg".to_string()]);
      } else {
        assert_eq!(published_at, "2026-09-27 08:30:00");
        assert!(media.is_empty());
      }
    }
    assert_eq!(count, 2, "服务气泡应被跳过");
  }
}
