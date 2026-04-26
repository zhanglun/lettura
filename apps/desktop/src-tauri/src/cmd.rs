use actix_web::web;
use serde::Serialize;
use tauri::{command, Emitter, State, WebviewWindow};
use uuid::Uuid;

use crate::ai::embedding::EmbeddingProvider;
use crate::core::config;
use crate::feed::WrappedMediaObject;
use crate::models;
use crate::server::stop_server;
use crate::{feed, server, AppState, sources};

#[derive(Debug, Serialize)]
pub struct FeedFetchResponse {
  feed: models::NewFeed,
  message: String,
}

#[command]
pub async fn fetch_feed(url: String) -> (Option<models::NewFeed>, String) {
  let res = feed::parse_feed(&url).await;

  match res {
    Ok(res) => {
      let channel_uuid = Uuid::new_v4().hyphenated().to_string();
      let channel = create_feed_model(&channel_uuid, &url, &res).clone();
      (Some(channel), String::from(""))
    }
    Err(err) => (None, err),
  }
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

  let pub_date = match res.published {
    Some(t) => t.to_rfc3339(),
    None => String::from(""),
  };

  let updated = match res.updated {
    Some(t) => t.to_rfc3339(),
    None => String::from(""),
  };

  return models::NewFeed {
    uuid: uuid.to_string(),
    feed_type: "".to_string(),
    title: title,
    link: link,
    logo: logo,
    feed_url: url.to_string(),
    description,
    pub_date: pub_date,
    updated: updated,
    sort: 0,
  };
}

pub fn create_article_models(
  channel_uuid: &String,
  feed_url: &String,
  res: &feed_rs::model::Feed,
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
    let pub_date: String = match entry.published {
      Some(t) => t.to_rfc3339(),
      None => String::from(""),
    };

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
    };

    articles.push(s);
  }

  articles
}

#[command]
pub async fn add_feed(url: String) -> (Option<models::Feed>, usize, String) {
  println!("request channel {}", &url);

  let res = feed::parse_feed(&url).await;

  match res {
    Ok(res) => {
      let channel_uuid = Uuid::new_v4().hyphenated().to_string();
      let feed = create_feed_model(&channel_uuid, &url, &res);
      let articles = create_article_models(&channel_uuid, &url, &res);

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
pub fn update_theme(theme: String) -> usize {
  config::update_theme(theme);
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
  Ok(sources::models::PackPreviewResponse {
    id: pack.id,
    name: pack.name,
    description: pack.description,
    icon: pack.icon,
    language: pack.language,
    tags: pack.tags,
    sources: pack.sources,
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

        crate::ai::pipeline::spawn_pipeline_if_configured(Some(app_handle));
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

#[command]
pub fn get_today_signals(limit: Option<i32>) -> Result<Vec<crate::ai::pipeline::Signal>, String> {
  let conn = &mut crate::db::establish_connection();
  let limit = limit.unwrap_or(5);
  crate::ai::pipeline::get_today_signals(conn, limit)
}

#[command]
pub fn get_ai_config() -> Result<crate::ai::config::AiConfigPublic, String> {
  let user_config = config::get_user_config();
  let ai_config = user_config.ai.unwrap_or_default();
  Ok(crate::ai::config::AiConfigPublic::from(&ai_config))
}

#[command]
pub fn save_ai_config(
  api_key: String,
  model: String,
  embedding_model: String,
  base_url: String,
  pipeline_interval_hours: Option<u64>,
) -> Result<(), String> {
  let mut user_config = config::get_user_config();
  let hours = pipeline_interval_hours.unwrap_or(1);
  user_config.ai = Some(crate::ai::config::AiConfig {
    api_key,
    model,
    embedding_model,
    base_url,
    pipeline_interval_hours: hours,
  });

  let config_path = config::get_user_config_path();
  let content = toml::to_string_pretty(&user_config).map_err(|e| e.to_string())?;
  std::fs::write(&config_path, content).map_err(|e| e.to_string())?;

  Ok(())
}

#[derive(Debug, serde::Serialize)]
pub struct ValidateAiConfigResult {
  pub valid: bool,
  pub message: String,
}

#[command]
pub async fn validate_ai_config() -> Result<ValidateAiConfigResult, String> {
  let user_config = config::get_user_config();
  let ai_config = match user_config.ai {
    Some(ref c) if c.has_api_key() => c.clone(),
    _ => {
      return Ok(ValidateAiConfigResult {
        valid: false,
        message: "API key not configured".to_string(),
      })
    }
  };

  let embedding = crate::ai::embedding::OpenAIEmbedding::new(
    &ai_config.api_key,
    &ai_config.base_url,
    ai_config.embedding_model.clone(),
  );

  match embedding.embed(vec!["test"]).await {
    Ok(_) => Ok(ValidateAiConfigResult {
      valid: true,
      message: "API key is valid".to_string(),
    }),
    Err(e) => Ok(ValidateAiConfigResult {
      valid: false,
      message: format!("API key validation failed: {}", e),
    }),
  }
}

#[command]
pub async fn trigger_pipeline(
  app: tauri::AppHandle,
  run_type: Option<String>,
) -> Result<crate::ai::pipeline::PipelineResult, String> {
  let user_config = config::get_user_config();
  let ai_config = match user_config.ai {
    Some(ref c) if c.has_api_key() => c.clone(),
    None => return Err("API key not configured".to_string()),
    Some(_) => return Err("API key is empty".to_string()),
  };

  let embedding = crate::ai::embedding::OpenAIEmbedding::new(
    &ai_config.api_key,
    &ai_config.base_url,
    ai_config.embedding_model.clone(),
  );
  let llm = crate::ai::llm::OpenAILLM::new(
    &ai_config.api_key,
    &ai_config.base_url,
    ai_config.model.clone(),
  );

  let rt = run_type.unwrap_or_else(|| "manual".to_string());
  crate::ai::pipeline::run_pipeline(&ai_config, &embedding, &llm, &rt, Some(&app))
    .await
    .map_err(|e| e.to_string())
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
        let feed = create_feed_model(&feed_uuid, &url, &res).clone();

        println!("====>S{:?}", (Some(feed), String::from("")));
        let articles = create_article_models(&feed_uuid, &url, &res);
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
    let result = add_feed(url).await;

    println!("result: {:?}", result);
  }
}
