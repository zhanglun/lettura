//! 动态流响应（/x/polymer/web-dynamic/v1/feed/space）的类型与映射：
//! 只认三种值得读的 major——视频投稿 / 图文 / 纯文字，其余（文章、转发等）
//! 一律按纯文字兜底；置顶和无文本的项直接跳过。

use chrono::DateTime;
use fetcher_core::{Carrier, FetchedArticle, MediaAttachment, MediaImage, MediaThumbnail};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct DynamicResp {
  pub code: i64,
  #[serde(default)]
  pub message: String,
  #[serde(default)]
  pub data: DynamicData,
}

#[derive(Deserialize, Default)]
pub struct DynamicData {
  #[serde(default)]
  pub items: Vec<DynamicItem>,
}

#[derive(Deserialize, Default)]
pub struct DynamicItem {
  #[serde(default)]
  pub id_str: String,
  #[serde(default)]
  pub modules: Modules,
}

#[derive(Deserialize, Default)]
#[serde(default)]
pub struct Modules {
  pub module_tag: ModuleTag,
  pub module_author: ModuleAuthor,
  pub module_dynamic: ModuleDynamic,
}

#[derive(Deserialize, Default)]
pub struct ModuleTag {
  pub text: String,
}

#[derive(Deserialize, Default)]
#[serde(default)]
pub struct ModuleAuthor {
  pub name: String,
  /// 发布时刻（unix 秒）
  pub pub_ts: Option<i64>,
}

#[derive(Deserialize, Default)]
pub struct ModuleDynamic {
  pub desc: Desc,
  /// 转发等场景下 major 可为 null
  pub major: Option<Major>,
}

#[derive(Deserialize, Default)]
#[serde(default)]
pub struct Desc {
  pub text: String,
}

#[derive(Deserialize, Default)]
pub struct Major {
  /// MAJOR_TYPE_ARCHIVE / MAJOR_TYPE_DRAW / MAJOR_TYPE_NONE / …
  #[serde(rename = "type")]
  pub kind: String,
  pub archive: Option<Archive>,
  pub draw: Option<Draw>,
}

#[derive(Deserialize, Default)]
#[serde(default)]
pub struct Archive {
  pub title: String,
  pub bvid: String,
  pub cover: String,
}

#[derive(Deserialize, Default)]
pub struct Draw {
  pub items: Vec<DrawItem>,
}

#[derive(Deserialize, Default)]
pub struct DrawItem {
  /// 个别异常图会是 null
  pub img_src: Option<String>,
  pub width: Option<u32>,
  pub height: Option<u32>,
}

/// 整流映射：保持原顺序，置顶/空文本的项被跳过
pub fn to_articles(items: &[DynamicItem]) -> Vec<FetchedArticle> {
  items.iter().filter_map(to_article).collect()
}

fn to_article(item: &DynamicItem) -> Option<FetchedArticle> {
  // 置顶是运营位不是更新
  if item.modules.module_tag.text == "置顶" {
    return None;
  }

  let author = non_empty(item.modules.module_author.name.clone());
  let published = fmt_pub_ts(item.modules.module_author.pub_ts);
  let desc_text = item.modules.module_dynamic.desc.text.trim().to_string();
  let major = item.modules.module_dynamic.major.as_ref();

  match major.map(|m| m.kind.as_str()) {
    // 视频投稿：简介可空，封面进缩略图，点开外跳观看
    Some("MAJOR_TYPE_ARCHIVE") => {
      let archive = major.and_then(|m| m.archive.as_ref())?;
      Some(FetchedArticle {
        title: archive.title.clone(),
        link: format!("https://www.bilibili.com/video/{}", archive.bvid),
        content_html: paragraphs_html(&desc_text),
        summary: None,
        author,
        published_at: published,
        media: if archive.cover.is_empty() {
          vec![]
        } else {
          vec![image_attachment(&archive.cover, None, None)]
        },
        carrier: Carrier::Video,
      })
    }
    // 图文动态：每张图一条附件
    Some("MAJOR_TYPE_DRAW") => {
      let pictures = major
        .and_then(|m| m.draw.as_ref())
        .map(|d| d.items.as_slice())
        .unwrap_or(&[]);
      if desc_text.is_empty() && pictures.is_empty() {
        return None;
      }
      let media = pictures
        .iter()
        .filter_map(|p| {
          p.img_src
            .as_ref()
            .map(|src| image_attachment(src, p.width, p.height))
        })
        .collect();
      Some(FetchedArticle {
        title: first_line(&desc_text).unwrap_or_else(|| "图文动态".into()),
        link: format!("https://t.bilibili.com/{}", item.id_str),
        content_html: paragraphs_html(&desc_text),
        summary: None,
        author,
        published_at: published,
        media,
        carrier: Carrier::Text,
      })
    }
    // 纯文字与文章/转发等：一律按文本读；没文本就没得读
    _ => {
      if desc_text.is_empty() {
        return None;
      }
      Some(FetchedArticle {
        title: first_line(&desc_text).unwrap_or_default(),
        link: format!("https://t.bilibili.com/{}", item.id_str),
        content_html: paragraphs_html(&desc_text),
        summary: None,
        author,
        published_at: published,
        media: vec![],
        carrier: Carrier::Text,
      })
    }
  }
}

/// 首行做标题；输入已整体 trim，非空时首行必非空
fn first_line(text: &str) -> Option<String> {
  text
    .lines()
    .next()
    .map(str::trim)
    .filter(|l| !l.is_empty())
    .map(String::from)
}

fn non_empty(s: String) -> Option<String> {
  let t = s.trim();
  if t.is_empty() {
    None
  } else {
    Some(t.to_string())
  }
}

/// unix 秒 → "YYYY-MM-DD HH:MM:SS"（UTC）；缺时刻给空串
fn fmt_pub_ts(ts: Option<i64>) -> String {
  ts.and_then(|t| DateTime::from_timestamp(t, 0))
    .map(|dt| dt.format("%Y-%m-%d %H:%M:%S").to_string())
    .unwrap_or_default()
}

/// 文本按行转 <p>（转义、丢空行）；整段为空则 None
fn paragraphs_html(text: &str) -> Option<String> {
  let parts: Vec<String> = text
    .lines()
    .map(str::trim)
    .filter(|l| !l.is_empty())
    .map(|l| format!("<p>{}</p>", escape_html(l)))
    .collect();
  if parts.is_empty() {
    None
  } else {
    Some(parts.join(""))
  }
}

fn escape_html(s: &str) -> String {
  // & 必须先替换，避免把后面生成的实体再编码一遍
  s.replace('&', "&amp;")
    .replace('<', "&lt;")
    .replace('>', "&gt;")
}

/// 一张图 → 一个 MediaAttachment（缩略图形态，前端 pickThumbUrl 直接读 image.uri）
fn image_attachment(uri: &str, width: Option<u32>, height: Option<u32>) -> MediaAttachment {
  MediaAttachment {
    title: None,
    description: None,
    content: vec![],
    thumbnails: vec![MediaThumbnail {
      image: MediaImage {
        uri: Some(uri.to_string()),
        title: None,
        link: None,
        width,
        height,
        description: None,
      },
      time: None,
    }],
    duration: None,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  /// 真实形状的响应切片：置顶视频 / 视频 / 图文 / 纯文字 / 空文本转发
  const FIXTURE: &str = r#"{
    "code": 0,
    "message": "0",
    "ttl": 1,
    "data": {
      "has_more": true,
      "items": [
        {
          "id_str": "1001",
          "modules": {
            "module_tag": { "text": "置顶" },
            "module_author": { "name": "测试UP主", "pub_ts": 1714564800 },
            "module_dynamic": {
              "desc": { "text": "置顶公告" },
              "major": {
                "type": "MAJOR_TYPE_ARCHIVE",
                "archive": { "title": "置顶视频", "bvid": "BVpin0000", "cover": "https://i0.hdslb.com/bfs/archive/pin.jpg" }
              }
            }
          }
        },
        {
          "id_str": "1002",
          "modules": {
            "module_author": { "name": "测试UP主", "pub_ts": 1714564800 },
            "module_dynamic": {
              "desc": { "text": "这期视频讲得很清楚" },
              "major": {
                "type": "MAJOR_TYPE_ARCHIVE",
                "archive": { "title": "【实测】新功能全解析", "desc": "简介文本", "bvid": "BV1xx411c7mD", "cover": "https://i0.hdslb.com/bfs/archive/cover.jpg" }
              }
            }
          }
        },
        {
          "id_str": "900000000000001",
          "modules": {
            "module_author": { "name": "测试UP主", "pub_ts": 1714478400 },
            "module_dynamic": {
              "desc": { "text": "画了一张图\n配色参考了黄昏" },
              "major": {
                "type": "MAJOR_TYPE_DRAW",
                "draw": { "items": [
                  { "img_src": "https://i0.hdslb.com/bfs/new_dyn/1.jpg", "width": 1920, "height": 1080 },
                  { "img_src": "https://i0.hdslb.com/bfs/new_dyn/2.jpg", "width": 1920, "height": 1080 }
                ] }
              }
            }
          }
        },
        {
          "id_str": "900000000000002",
          "modules": {
            "module_author": { "name": "测试UP主", "pub_ts": 1714392000 },
            "module_dynamic": {
              "desc": { "text": "今天更新了吗\n没有" },
              "major": { "type": "MAJOR_TYPE_NONE" }
            }
          }
        },
        {
          "id_str": "900000000000003",
          "modules": {
            "module_author": { "name": "测试UP主", "pub_ts": 1714305600 },
            "module_dynamic": { "desc": { "text": "" } }
          }
        },
        {
          "id_str": "900000000000004",
          "modules": {
            "module_author": { "name": "测试UP主", "pub_ts": 1714219200 },
            "module_dynamic": {
              "desc": { "text": "专栏文章标题" },
              "major": { "type": "MAJOR_TYPE_ARTICLE" }
            }
          }
        }
      ]
    }
  }"#;

  #[test]
  fn maps_real_shape_feed() {
    let resp: DynamicResp = serde_json::from_str(FIXTURE).expect("fixture 可解析");
    assert_eq!(resp.code, 0);
    let articles = to_articles(&resp.data.items);

    // 置顶与空文本转发被跳过，剩 4 条
    assert_eq!(articles.len(), 4);

    // 视频：标题/链接/载体/作者/时刻/封面缩略图
    let video = &articles[0];
    assert_eq!(video.title, "【实测】新功能全解析");
    assert_eq!(video.link, "https://www.bilibili.com/video/BV1xx411c7mD");
    assert_eq!(video.carrier, Carrier::Video);
    assert_eq!(video.author.as_deref(), Some("测试UP主"));
    assert_eq!(video.published_at, "2024-05-01 12:00:00");
    assert_eq!(
      video.media[0].thumbnails[0].image.uri.as_deref(),
      Some("https://i0.hdslb.com/bfs/archive/cover.jpg")
    );
    assert!(video.media[0].content.is_empty());
    assert_eq!(
      video.content_html.as_deref(),
      Some("<p>这期视频讲得很清楚</p>")
    );

    // 图文：首行做标题，逐张图进 media，正文转 <p>
    let draw = &articles[1];
    assert_eq!(draw.title, "画了一张图");
    assert_eq!(draw.link, "https://t.bilibili.com/900000000000001");
    assert_eq!(draw.carrier, Carrier::Text);
    assert_eq!(draw.media.len(), 2);
    assert_eq!(
      draw.media[1].thumbnails[0].image.uri.as_deref(),
      Some("https://i0.hdslb.com/bfs/new_dyn/2.jpg")
    );
    assert_eq!(
      draw.content_html.as_deref(),
      Some("<p>画了一张图</p><p>配色参考了黄昏</p>")
    );
    assert_eq!(draw.published_at, "2024-04-30 12:00:00");

    // 纯文字：首行做标题，无 media
    let text = &articles[2];
    assert_eq!(text.title, "今天更新了吗");
    assert_eq!(text.link, "https://t.bilibili.com/900000000000002");
    assert_eq!(text.carrier, Carrier::Text);
    assert!(text.media.is_empty());
    assert_eq!(
      text.content_html.as_deref(),
      Some("<p>今天更新了吗</p><p>没有</p>")
    );

    // 未知 major 类型（专栏等）按纯文字兜底
    let fallback = &articles[3];
    assert_eq!(fallback.title, "专栏文章标题");
    assert_eq!(fallback.link, "https://t.bilibili.com/900000000000004");
    assert_eq!(fallback.carrier, Carrier::Text);
  }

  #[test]
  fn draw_without_text_falls_back_to_generic_title() {
    let resp: DynamicResp = serde_json::from_str(
      r#"{"code":0,"data":{"items":[{"id_str":"777",
        "modules":{"module_author":{"pub_ts":1714564800},
        "module_dynamic":{"desc":{"text":""},
        "major":{"type":"MAJOR_TYPE_DRAW","draw":{"items":[{"img_src":"https://i0.hdslb.com/bfs/a.jpg"}]}}}}}]}}"#,
    )
    .unwrap();
    let articles = to_articles(&resp.data.items);
    assert_eq!(articles.len(), 1);
    assert_eq!(articles[0].title, "图文动态");
    assert_eq!(articles[0].content_html, None);
    assert_eq!(articles[0].media.len(), 1);
  }

  #[test]
  fn html_is_escaped_in_paragraphs() {
    assert_eq!(
      paragraphs_html("a<b & c\nd"),
      Some("<p>a&lt;b &amp; c</p><p>d</p>".to_string())
    );
    assert_eq!(paragraphs_html("  \n  "), None);
  }
}
