use chrono::{DateTime, Utc};
use serde::Serialize;
use tauri::{command, Emitter, WebviewWindow};
use uuid::Uuid;

use crate::core::config;
use crate::feed::WrappedMediaObject;
use crate::models;
use crate::{feed, sources};

/// Normalize an optional publish/updated time into a UTC string formatted as
/// `YYYY-MM-DD HH:MM:SS`, matching SQLite's `CURRENT_TIMESTAMP` and the
/// `create_date`/`update_date` columns. This keeps `pub_date` comparable to
/// other timestamp columns by string ordering in SQLite. Returns an empty
/// string when the source provides no time; the query layer falls back to
/// `create_date` for such rows.
fn normalize_pub_date(t: Option<DateTime<Utc>>) -> String {
  match t {
    Some(dt) => dt.naive_utc().format("%Y-%m-%d %H:%M:%S").to_string(),
    None => String::new(),
  }
}

#[derive(Debug, Serialize)]
pub struct FeedFetchResponse {
  feed: models::NewFeed,
  message: String,
}

/// 预览用的一行条目（订阅前让用户看到"我会得到什么"）
#[derive(Debug, Clone, Serialize)]
pub struct PreviewEntry {
  pub title: String,
  pub link: String,
  pub pub_date: String,
  /// 播客单集时长（秒），来自 enclosure/itunes:duration
  pub duration: Option<i64>,
}

/// 添加订阅的探测结果：resolve_feed_input 负责"任意地址 → feed"
#[derive(Debug, Serialize)]
pub struct FeedPreview {
  pub feed: Option<models::NewFeed>,
  /// 真正生效的 feed 地址（粘贴网页时 != 输入）
  pub resolved_url: String,
  /// 探测过程中试过的候选地址（多个时界面列出来让用户换）
  pub candidates: Vec<String>,
  /// 最近条目（最多 6 条）
  pub entries: Vec<PreviewEntry>,
  pub message: String,
}

fn preview_entries(res: &feed_rs::model::Feed) -> Vec<PreviewEntry> {
  res
    .entries
    .iter()
    .take(6)
    .map(|entry| PreviewEntry {
      title: entry.title.as_ref().map(|t| t.content.clone()).unwrap_or_default(),
      link: entry.links.get(0).map(|l| l.href.clone()).unwrap_or_default(),
      pub_date: entry
        .published
        .map(|d| d.to_rfc3339_opts(chrono::SecondsFormat::Secs, true))
        .unwrap_or_default(),
      duration: entry
        .media
        .iter()
        .find_map(|m| m.duration.map(|d| d.as_secs() as i64)),
    })
    .collect()
}

/// 预览：先"发现"（HTML 里声明的 feed、常见路径），再回预览卡需要的一切
#[command]
pub async fn fetch_feed(
  url: String,
  origin: Option<String>,
  carrier: Option<String>,
) -> FeedPreview {
  let empty = |message: String, candidates: Vec<String>| FeedPreview {
    feed: None,
    resolved_url: String::new(),
    candidates,
    entries: vec![],
    message,
  };

  match feed::resolve_feed_input(&url).await {
    Ok((res, resolved_url, candidates)) => {
      let channel_uuid = Uuid::new_v4().hyphenated().to_string();
      let origin_value = resolve_origin(origin.as_deref(), &res);
      let carrier_hint = carrier.as_deref().unwrap_or("");
      let feed_carrier = feed_carrier_hint(carrier_hint, &res);
      let channel = create_feed_model(
        &channel_uuid,
        &resolved_url,
        &res,
        &origin_value,
        feed_carrier,
      );
      let entries = preview_entries(&res);

      FeedPreview {
        feed: Some(channel),
        resolved_url,
        candidates,
        entries,
        message: String::new(),
      }
    }
    Err(err) => empty(err, vec![]),
  }
}

/// 来源判定（订阅时一次，之后不再猜）：`native` | `generator:<route>`
/// 客户端已知的生成器路由优先（用户粘贴平台主页时我们生成的）；否则 native。
pub fn resolve_origin(client_origin: Option<&str>, _res: &feed_rs::model::Feed) -> String {
  match client_origin {
    Some(origin) if !origin.is_empty() => origin.to_string(),
    _ => String::from("native"),
  }
}

/// 条目级类型判定：这条能不能站内播（audio enclosure）——与源类型无关的独立轴。
fn entry_has_audio(media: &[feed_rs::model::MediaObject]) -> bool {
  media.iter().any(|m| {
    m.content.iter().any(|c| {
      c.content_type
        .as_ref()
        .map(|ct| ct.to_string().starts_with("audio"))
        .unwrap_or(false)
    })
  })
}

/// 条目载体（与前端读同一列，不再各自实现判定）
/// audio enclosure → audio（能不能站内播）；否则用来源声明的载体提示（video/email）；兜底 text。
pub fn classify_entry(carrier_hint: &str, media: &[feed_rs::model::MediaObject]) -> &'static str {
  if entry_has_audio(media) {
    return "audio";
  }
  match carrier_hint {
    "video" => "video",
    "email" => "email",
    _ => "text",
  }
}

/// 源级载体提示：客户端按生成器路由声明（video/email），或由条目音频反推
pub fn feed_carrier_hint(
  carrier_hint: &str,
  res: &feed_rs::model::Feed,
) -> &'static str {
  if carrier_hint == "video" || carrier_hint == "email" {
    return match carrier_hint {
      "video" => "video",
      _ => "email",
    };
  }
  if res.entries.iter().any(|entry| entry_has_audio(&entry.media)) {
    return "audio";
  }
  "text"
}

#[command]
pub async fn move_channel_into_folder(
  channel_uuid: String,
  folder_uuid: String,
  sort: i32,
) -> usize {
  let result = feed::channel::update_feed_meta(
    channel_uuid,
    feed::channel::FeedMetaUpdateRequest {
      folder_uuid: folder_uuid,
      sort,
    },
  );

  result
}

pub fn create_feed_model(
  uuid: &String,
  url: &String,
  res: &feed_rs::model::Feed,
  origin: &str,
  carrier: &str,
) -> models::NewFeed {
  let title = match &res.title {
    Some(link) => link.content.to_string(),
    None => String::from(""),
  };

  let link = match res.links.get(0) {
    Some(link) => link.href.to_string(),
    None => String::from(""),
  };

  let description = match &res.description {
    Some(title) => title.content.clone(),
    None => String::from(""),
  };

  let logo = match &res.logo {
    Some(t) => t.uri.clone(),
    None => String::from(""),
  };

  let pub_date = normalize_pub_date(res.published);
  let updated = normalize_pub_date(res.updated);

  return models::NewFeed {
    uuid: uuid.to_string(),
    origin: origin.to_string(),
    title: title,
    link: link,
    logo: logo,
    feed_url: url.to_string(),
    description,
    pub_date: pub_date,
    updated: updated,
    sort: 0,
    carrier: carrier.to_string(),
  };
}

pub fn create_article_models(
  channel_uuid: &String,
  feed_url: &String,
  res: &feed_rs::model::Feed,
  _origin: &str,
  carrier_hint: &str,
) -> Vec<models::NewArticle> {
  let mut articles: Vec<models::NewArticle> = Vec::new();

  for entry in &res.entries {
    let article_uuid = Uuid::new_v4().hyphenated().to_string();

    let title = match &entry.title {
      Some(link) => link.content.to_string(),
      None => String::from(""),
    };

    let link = match entry.links.get(0) {
      Some(link) => link.href.to_string(),
      None => String::from(""),
    };

    // A short summary of the item
    let description = match &entry.summary {
      Some(summary) => summary.content.clone(),
      None => String::from(""),
    };

    // The content of the item
    let content = match &entry.content {
      Some(content) => content.body.clone().unwrap_or(String::from("")),
      None => String::from(""),
    };

    // Time at which this item was first published
    let pub_date: String = normalize_pub_date(entry.published);

    // Authors of this item
    let author = match entry.authors.get(0) {
      Some(person) => {
        if person.name == "author" {
          person.email.as_ref().unwrap_or(&person.name).to_string()
        } else {
          person.name.to_string()
        }
      }
      None => String::from(""),
    };

    let media_object = entry
      .media
      .clone()
      .into_iter()
      .map(|m| WrappedMediaObject(m))
      .collect::<Vec<WrappedMediaObject>>();
    let json = serde_json::to_string(&media_object).unwrap();

    let kind = classify_entry(carrier_hint, &entry.media).to_string();

    let s = models::NewArticle {
      uuid: article_uuid,
      feed_uuid: channel_uuid.to_string(),
      title: title.to_string(),
      link,
      content,
      feed_url: feed_url.to_string(),
      description,
      author: author,
      pub_date: pub_date,
      media_object: json,
      carrier: kind,
    };

    articles.push(s);
  }

  articles
}

#[command]
pub async fn add_feed(
  url: String,
  origin: Option<String>,
  carrier: Option<String>,
) -> (Option<models::Feed>, usize, String) {
  println!("request channel {}", &url);

  // 预览阶段刚抓过 → 命中缓存，不再二次网络往返
  let res = feed::parse_feed_cached(&url).await;

  match res {
    Ok((res, effective_url)) => {
      let channel_uuid = Uuid::new_v4().hyphenated().to_string();
      let origin_value = resolve_origin(origin.as_deref(), &res);
      let carrier_hint = carrier.as_deref().unwrap_or("");
      let feed_carrier = feed_carrier_hint(carrier_hint, &res);
      let feed = create_feed_model(
        &channel_uuid,
        &effective_url,
        &res,
        &origin_value,
        feed_carrier,
      );
      let articles = create_article_models(
        &channel_uuid,
        &effective_url,
        &res,
        &origin_value,
        carrier_hint,
      );

      feed::channel::add_feed(feed, articles)
    }
    Err(err) => (None, 0, err),
  }
}

// the payload type must implement `Serialize` and `Clone`.
#[derive(Clone, serde::Serialize)]
struct Payload {
  message: String,
}

#[command]
pub fn init_process(window: WebviewWindow) {
  std::thread::spawn(move || loop {
    window
      .emit(
        "event-name",
        Payload {
          message: "Tauri is awesome!".into(),
        },
      )
      .unwrap();
  });
}

#[command]
pub fn update_threads(threads: i32) -> usize {
  config::update_threads(threads);
  1
}


#[command]
pub fn update_user_config(user_cfg: config::UserConfig) -> usize {
  println!("user_cfg {:?}", user_cfg);

  config::update_user_config(user_cfg);

  1
}

#[command]
pub fn create_folder(name: String) -> (usize, String) {
  feed::folder::create_folder(name)
}

#[command]
pub fn delete_folder(uuid: String) -> (usize, usize) {
  feed::folder::delete_folder(uuid)
}

#[command]
pub fn update_folder(uuid: String, name: String) -> (usize, String) {
  feed::folder::update_folder(uuid, name)
}

#[command]
pub async fn update_icon(uuid: String, url: String) -> usize {
  let favicon = feed::channel::update_icon(&uuid, &url).await;

  favicon
}

#[command]
pub async fn get_server_port() -> u16 {
  let cfg = config::get_user_config();
  return cfg.port;
}

#[command]
pub fn export_opml() -> Result<String, String> {
  feed::opml::export_opml()
}

#[command]
pub fn import_opml(opml_content: String) -> Result<feed::opml::OpmlImportResult, String> {
  feed::opml::import_opml(&opml_content)
}

#[command]
pub fn get_starter_packs() -> Result<Vec<sources::models::StarterPackSummary>, String> {
  sources::starter_pack::get_all_packs()
}

#[command]
pub fn preview_pack(pack_id: String) -> Result<sources::models::PackPreviewResponse, String> {
  let pack = sources::starter_pack::load_pack(&pack_id)?;
  // 空状态的 starter pack 卡片是逐条 subscribeFeed（不走 install_pack），
  // 所以实例改写要在这里做一次：包里的 rsshub.app 源按设置实例改写
  let sources = pack
    .sources
    .into_iter()
    .map(|mut source| {
      source.feed_url = sources::starter_pack::rewrite_rsshub_instance(&source.feed_url);
      source
    })
    .collect();

  Ok(sources::models::PackPreviewResponse {
    id: pack.id,
    name: pack.name,
    description: pack.description,
    icon: pack.icon,
    language: pack.language,
    tags: pack.tags,
    sources,
  })
}

#[command]
pub async fn install_pack(
  app: tauri::AppHandle,
  pack_ids: Vec<String>,
) -> Result<sources::models::InstallResult, String> {
  let stats = sources::starter_pack::install_packs_core(&pack_ids)?;

  let sync_started = !stats.new_feed_uuids.is_empty();

  if sync_started {
    let app_handle = app.clone();
    let uuids = stats.new_feed_uuids.clone();
    tokio::spawn(async move {
      for uuid in uuids {
        let result = feed::channel::sync_articles(uuid.clone()).await;
        let status = match result.get(&uuid) {
          Some((title, count, err)) => {
            if err.is_empty() {
              "completed"
            } else {
              "failed"
            }
          }
          None => "failed",
        };
        let _ = app_handle.emit(
          "feed:sync_progress",
          serde_json::json!({
            "feed_uuid": uuid,
            "status": status,
          }),
        );
      }
      let _ = app_handle.emit("feed:sync_complete", serde_json::json!({}));
    });
  }

  Ok(sources::models::InstallResult {
    installed_feeds: stats.installed_feeds,
    installed_sources: stats.installed_sources,
    sync_started,
  })
}

#[command]
pub fn import_opml_as_source(
  opml_content: String,
) -> Result<sources::source_service::OpmlImportAsSourceResult, String> {
  sources::source_service::import_opml_as_source(&opml_content)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_parse_feed() {
    // let url = "https://www.ximalaya.com/album/70501228.xml".to_string();
    // let url =
    // "http://www.youtube.com/feeds/videos.xml?channel_id=UCpVm7bg6pXKo1Pr6k5kxG9A".to_string();
    // let url = "https://medium.com/feed/google-design".to_string();
    // let url = "https://www.ximalaya.com/album/70501228.xml".to_string();
    // let url = "http://www.ximalaya.com/album/3558668.xml".to_string();
    let url = "https://gapis.money/rss.xml".to_string();

    println!("{:?}", url);

    let res = feed::parse_feed(&url).await;

    match res {
      Ok(res) => {
        let feed_uuid = Uuid::new_v4().hyphenated().to_string();
        let origin = resolve_origin(None, &res);
        let carrier = feed_carrier_hint("", &res);
        let feed = create_feed_model(&feed_uuid, &url, &res, &origin, carrier).clone();

        println!("====>S{:?}", (Some(feed), String::from("")));
        let articles = create_article_models(&feed_uuid, &url, &res, &origin, carrier);
        println!("{:?}", articles);
      }
      Err(err) => {
        println!("err {:?}", (None::<models::NewFeed>, err));
      }
    }

    ()
  }

  #[tokio::test]
  async fn test_add_feed() {
    let url = "http://www.ximalaya.com/album/39643321.xml".to_string();
    // let url = "http://www.smashingmagazine.com/feed/".to_string();
    let result = add_feed(url, None, None).await;

    println!("result: {:?}", result);
  }
}
