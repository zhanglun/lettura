//! 动态流响应（/x/polymer/web-dynamic/v1/feed/space）的类型与映射：
//! 只认三种值得读的 major——视频投稿 / 图文 / 纯文字，其余（文章、转发等）
//! 一律按纯文字兜底；置顶和无文本的项直接跳过。
//!
//! B站接口的类型契约很松：数字字段时而字符串、`desc`/`major` 时而 null、
//! 单条动态可能长出任何新形状。因此 items 按原始 JSON **逐条**解析——
//! 单条失败只跳过那一条，绝不废掉整条流；字段级全部走容错反序列化。

use chrono::DateTime;
use fetcher_core::{Carrier, FetchedArticle, MediaAttachment, MediaImage, MediaThumbnail};
use serde::Deserialize;

/// B站接口的数字字段类型不稳定（pub_ts/duration/宽高等时而字符串时而数字），
/// 统一按「数字或数字串」容错解析；null → None。
fn de_opt_i64_lenient<'de, D>(deserializer: D) -> Result<Option<i64>, D::Error>
where
  D: serde::Deserializer<'de>,
{
  struct V;
  impl serde::de::Visitor<'_> for V {
    type Value = Option<i64>;
    fn expecting(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
      f.write_str("null, integer or string-encoded integer")
    }
    fn visit_none<E: serde::de::Error>(self) -> Result<Option<i64>, E> {
      Ok(None)
    }
    fn visit_unit<E: serde::de::Error>(self) -> Result<Option<i64>, E> {
      Ok(None)
    }
    fn visit_i64<E: serde::de::Error>(self, v: i64) -> Result<Option<i64>, E> {
      Ok(Some(v))
    }
    fn visit_u64<E: serde::de::Error>(self, v: u64) -> Result<Option<i64>, E> {
      i64::try_from(v)
        .map(Some)
        .map_err(|_| E::custom("数值溢出 i64"))
    }
    fn visit_f64<E: serde::de::Error>(self, v: f64) -> Result<Option<i64>, E> {
      Ok(Some(v as i64))
    }
    fn visit_str<E: serde::de::Error>(self, v: &str) -> Result<Option<i64>, E> {
      v.trim()
        .parse::<i64>()
        .map(Some)
        .map_err(serde::de::Error::custom)
    }
  }
  deserializer.deserialize_any(V)
}

fn de_opt_u32_lenient<'de, D>(deserializer: D) -> Result<Option<u32>, D::Error>
where
  D: serde::Deserializer<'de>,
{
  Ok(de_opt_i64_lenient(deserializer)?.and_then(|v| u32::try_from(v).ok()))
}

fn de_i64_lenient<'de, D>(deserializer: D) -> Result<i64, D::Error>
where
  D: serde::Deserializer<'de>,
{
  Ok(de_opt_i64_lenient(deserializer)?.unwrap_or(0))
}

/// 字符串字段容错：null / 缺省 → 空串，数字 → 十进制串
fn de_string_lenient<'de, D>(deserializer: D) -> Result<String, D::Error>
where
  D: serde::Deserializer<'de>,
{
  struct V;
  impl serde::de::Visitor<'_> for V {
    type Value = String;
    fn expecting(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
      f.write_str("string, null or number")
    }
    fn visit_str<E: serde::de::Error>(self, v: &str) -> Result<String, E> {
      Ok(v.to_string())
    }
    fn visit_string<E: serde::de::Error>(self, v: String) -> Result<String, E> {
      Ok(v)
    }
    fn visit_unit<E: serde::de::Error>(self) -> Result<String, E> {
      Ok(String::new())
    }
    fn visit_none<E: serde::de::Error>(self) -> Result<String, E> {
      Ok(String::new())
    }
    fn visit_i64<E: serde::de::Error>(self, v: i64) -> Result<String, E> {
      Ok(v.to_string())
    }
    fn visit_u64<E: serde::de::Error>(self, v: u64) -> Result<String, E> {
      Ok(v.to_string())
    }
    fn visit_f64<E: serde::de::Error>(self, v: f64) -> Result<String, E> {
      Ok(v.to_string())
    }
  }
  deserializer.deserialize_any(V)
}

#[derive(Deserialize)]
pub struct DynamicResp {
  #[serde(deserialize_with = "de_i64_lenient")]
  pub code: i64,
  #[serde(default)]
  pub message: String,
  #[serde(default)]
  pub data: DynamicData,
}

#[derive(Deserialize, Default)]
pub struct DynamicData {
  /// 保持原始 JSON：单条动态形状不可信，逐条独立解析
  #[serde(default)]
  pub items: Vec<serde_json::Value>,
}

#[derive(Deserialize, Default)]
pub struct DynamicItem {
  #[serde(default, deserialize_with = "de_string_lenient")]
  pub id_str: String,
  #[serde(default)]
  pub modules: Modules,
}

#[derive(Deserialize, Default)]
#[serde(default)]
pub struct Modules {
  pub module_tag: Option<ModuleTag>,
  pub module_author: Option<ModuleAuthor>,
  pub module_dynamic: Option<ModuleDynamic>,
}

#[derive(Deserialize, Default)]
pub struct ModuleTag {
  #[serde(default, deserialize_with = "de_string_lenient")]
  pub text: String,
}

#[derive(Deserialize, Default)]
pub struct ModuleAuthor {
  #[serde(default, deserialize_with = "de_string_lenient")]
  pub name: String,
  /// 发布时刻（unix 秒）；B站时而数字时而字符串
  #[serde(default, deserialize_with = "de_opt_i64_lenient")]
  pub pub_ts: Option<i64>,
}

#[derive(Deserialize, Default)]
pub struct ModuleDynamic {
  /// 视频投稿等场景下 desc 为 null（文本在 archive.desc 里）
  pub desc: Option<Desc>,
  /// 转发等场景下 major 可为 null
  pub major: Option<Major>,
}

#[derive(Deserialize, Default)]
#[serde(default)]
pub struct Desc {
  #[serde(default, deserialize_with = "de_string_lenient")]
  pub text: String,
}

#[derive(Deserialize, Default)]
pub struct Major {
  /// MAJOR_TYPE_ARCHIVE / MAJOR_TYPE_DRAW / MAJOR_TYPE_NONE / …
  #[serde(rename = "type", default, deserialize_with = "de_string_lenient")]
  pub kind: String,
  pub archive: Option<Archive>,
  pub draw: Option<Draw>,
}

#[derive(Deserialize, Default)]
#[serde(default)]
pub struct Archive {
  #[serde(default, deserialize_with = "de_string_lenient")]
  pub title: String,
  #[serde(default, deserialize_with = "de_string_lenient")]
  pub bvid: String,
  #[serde(default, deserialize_with = "de_string_lenient")]
  pub cover: String,
  /// 视频时长（秒）；B站时而数字时而字符串
  #[serde(default, deserialize_with = "de_opt_i64_lenient")]
  pub duration: Option<i64>,
}

#[derive(Deserialize, Default)]
pub struct Draw {
  pub items: Vec<DrawItem>,
}

#[derive(Deserialize, Default)]
pub struct DrawItem {
  /// 个别异常图会是 null
  pub img_src: Option<String>,
  #[serde(default, deserialize_with = "de_opt_u32_lenient")]
  pub width: Option<u32>,
  #[serde(default, deserialize_with = "de_opt_u32_lenient")]
  pub height: Option<u32>,
}

/// 整流映射：保持原顺序；单条解析失败（新形状/异常项）只跳过那一条；
/// 置顶和无文本的项被跳过
pub fn to_articles(items: &[serde_json::Value]) -> Vec<FetchedArticle> {
  items
    .iter()
    .filter_map(|raw| match serde_json::from_value::<DynamicItem>(raw.clone()) {
      Ok(item) => to_article(&item),
      // 单条形状不认识就跳过——一条废数据不该让整个源同步失败
      Err(_) => None,
    })
    .collect()
}

fn to_article(item: &DynamicItem) -> Option<FetchedArticle> {
  let modules = &item.modules;
  // 置顶是运营位不是更新
  if modules.module_tag.as_ref().map(|t| t.text.trim()) == Some("置顶") {
    return None;
  }

  let author = modules
    .module_author
    .as_ref()
    .and_then(|a| non_empty(a.name.clone()));
  let published = modules
    .module_author
    .as_ref()
    .and_then(|a| a.pub_ts)
    .and_then(fmt_pub_ts)
    .unwrap_or_default();
  let md = modules.module_dynamic.as_ref();
  let desc_text = md
    .and_then(|m| m.desc.as_ref())
    .map(|d| d.text.trim().to_string())
    .unwrap_or_default();
  let major = md.and_then(|m| m.major.as_ref());

  match major.map(|m| m.kind.as_str()) {
    // 视频投稿：简介可空，封面进缩略图，时长进媒体附件，点开外跳观看
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
          vec![image_attachment(&archive.cover, None, None, archive.duration)]
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
            .map(|src| image_attachment(src, p.width, p.height, None))
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
fn fmt_pub_ts(ts: i64) -> Option<String> {
  DateTime::from_timestamp(ts, 0).map(|dt| dt.format("%Y-%m-%d %H:%M:%S").to_string())
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
fn image_attachment(
  uri: &str,
  width: Option<u32>,
  height: Option<u32>,
  duration: Option<i64>,
) -> MediaAttachment {
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
    duration: duration.and_then(|d| u64::try_from(d).ok()),
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  /// 真实形状的响应切片：置顶视频 / 视频（字符串 pub_ts + null desc + 字符串
  /// duration）/ 图文（字符串宽高）/ 纯文字 / 空文本转发 / 专栏
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
            "module_author": { "name": "测试UP主", "pub_ts": "1714564800" },
            "module_dynamic": {
              "desc": null,
              "major": {
                "type": "MAJOR_TYPE_ARCHIVE",
                "archive": { "title": "【实测】新功能全解析", "bvid": "BV1xx411c7mD", "cover": "https://i0.hdslb.com/bfs/archive/cover.jpg", "duration": "595" }
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
                  { "img_src": "https://i0.hdslb.com/bfs/new_dyn/1.jpg", "width": "1920", "height": "1080" },
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

    // 视频：字符串 pub_ts、null desc、字符串 duration 都要容住
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
    assert_eq!(video.media[0].duration, Some(595));
    assert_eq!(video.content_html, None);

    // 图文：首行做标题，逐张图进 media，正文转 <p>（字符串宽高要容住）
    let draw = &articles[1];
    assert_eq!(draw.title, "画了一张图");
    assert_eq!(draw.link, "https://t.bilibili.com/900000000000001");
    assert_eq!(draw.carrier, Carrier::Text);
    assert_eq!(draw.media.len(), 2);
    assert_eq!(draw.media[0].thumbnails[0].image.width, Some(1920));
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
  fn poison_item_is_skipped_not_fatal() {
    // 一条形状不认识的动态（module_dynamic 是字符串）不该废掉整条流
    let resp: DynamicResp = serde_json::from_str(
      r#"{"code":0,"data":{"items":[
        {"id_str":"1","modules":"not-a-struct"},
        {"id_str":"2","modules":{"module_author":{"name":"UP","pub_ts":1714564800},
         "module_dynamic":{"desc":{"text":"还能读到这条"}}}}
      ]}}"#,
    )
    .unwrap();
    let articles = to_articles(&resp.data.items);
    assert_eq!(articles.len(), 1);
    assert_eq!(articles[0].title, "还能读到这条");
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
