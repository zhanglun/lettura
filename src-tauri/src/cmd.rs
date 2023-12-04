use serde::{Serialize};
use tauri::{command, Window};
use tokio::sync::{mpsc, Mutex};
use uuid::Uuid;

use crate::core::config;
use crate::feed;
use crate::feed::WrappedMediaObject;
use crate::models;

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
  println!("res{:?}", res);
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

    let media_object = entry.media.clone().into_iter().map(|m| WrappedMediaObject(m)).collect::<Vec<WrappedMediaObject>>();
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
      println!("feed {:?}", feed);
      let articles = create_article_models(&channel_uuid, &url, &res);

      feed::channel::add_feed(feed, articles)
    }
    Err(err) => (None, 0, err),
  }
}
#[command]
pub async fn import_channels(list: Vec<String>) -> usize {
  println!("{:?}", &list);
  for url in &list {
    add_feed(url.to_string()).await;
  }
  1
}

// the payload type must implement `Serialize` and `Clone`.
#[derive(Clone, serde::Serialize)]
struct Payload {
  message: String,
}

#[command]
pub fn init_process(window: Window) {
  println!("asdfasdf");
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
pub fn update_article_read_status(uuid: String, status: i32) -> usize {
  let res = feed::article::Article::update_article_read_status(uuid, status);

  res
}

#[command]
pub fn update_proxy(ip: String, port: String) -> usize {
  config::update_proxy(ip, port);
  1
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
pub fn get_folders() -> Vec<models::Folder> {
  feed::folder::get_folders()
}

#[command]
pub async fn update_icon(uuid: String, url: String) -> usize {
  let favicon = feed::channel::update_icon(&uuid, &url).await;

  favicon
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
    let url = "https://sspai.com/feed".to_string();

    println!("{:?}", url);

    let res = feed::parse_feed(&url).await;

    match res {
      Ok(res) => {
        let feed_uuid = Uuid::new_v4().hyphenated().to_string();
        let feed = create_feed_model(&feed_uuid, &url, &res).clone();

        println!("{:?}", (Some(feed), String::from("")));
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
