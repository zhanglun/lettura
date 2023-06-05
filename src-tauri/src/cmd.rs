use std::collections::HashMap;

use feed_rs::parser;
use reqwest;
use serde::Serialize;
use tauri::{command, Window};
use uuid::Uuid;

use crate::core;
use crate::core::config;
use crate::db;
use crate::feed;
use crate::models;

pub fn create_client() -> reqwest::Client {
  let user_config = config::get_user_config();
  let client = match user_config {
    Some(user_config) => match user_config.local_proxy {
      Some(proxy) => {
        let mut scheme = String::from("socks5h://");

        scheme.push_str(&proxy.ip.to_string());
        scheme.push_str(":");
        scheme.push_str(&proxy.port.to_string());

        reqwest::Client::builder()
          .proxy(reqwest::Proxy::all(scheme).unwrap())
          .build()
          .unwrap()
      }
      None => reqwest::Client::builder().build().unwrap(),
    },
    None => reqwest::Client::builder().build().unwrap(),
  };

  client
}

/// request feed, parse Feeds
///
/// # Examples
/// ```
/// let url = "https://sspai.com/feed".to_string();
/// let res = parse_feed(&url).await;
/// ```
pub async fn parse_feed(url: &str) -> Result<feed_rs::model::Feed, String> {
  let client = create_client();
  let result = client.get(url).send().await;

  let a = match result {
    Ok(response) => match response.status() {
      reqwest::StatusCode::OK => {
        let content = response.text().await;

        match content {
          Ok(content) => {
            let res = parser::parse(content.as_bytes());

            match res {
              Ok(res) => Ok(res),
              Err(error) => {
                println!("content parse error{:?}", error);
                Err(error.to_string())
              }
            }
          }
          Err(error) => {
            println!("response not OK {:?}", error);
            Err(error.to_string())
          }
        }
      }
      reqwest::StatusCode::NOT_FOUND => Err(String::from("Could not find a feed at the location.")),
      _ => {
        println!("o {:?}", response);
        Err("Not 200 OK".to_string())
      }
    },
    Err(error) => {
      println!("ERROR: {:?}", error);
      println!("URL: {:?}", url);

      Err(error.to_string())
    }
  };

  a
}

#[derive(Debug, Serialize)]
pub struct FeedFetchResponse {
  feed: models::NewFeed,
  message: String,
}

#[command]
pub async fn fetch_feed(url: String) -> (Option<models::NewFeed>, String) {
  let res = parse_feed(&url).await;

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
pub async fn get_feeds() -> Vec<feed::channel::FeedItem> {
  let results = feed::channel::get_feeds();

  return results;
}

#[command]
pub async fn get_channels() -> feed::channel::ChannelQueryResult {
  let results = feed::channel::get_channels();

  return results;
}

#[command]
pub async fn update_feed_sort(sorts: Vec<feed::channel::FeedSort>) -> usize {
  println!("update feed sort");
  feed::channel::update_feed_sort(sorts);
  1
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
      parent_uuid: folder_uuid,
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
  let feed_type = res.feed_type.clone();

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

    let s = models::NewArticle {
      uuid: article_uuid,
      channel_uuid: channel_uuid.to_string(),
      title: title.to_string(),
      link,
      content,
      feed_url: feed_url.to_string(),
      description,
      author: author,
      pub_date: pub_date,
    };

    articles.push(s);
  }

  articles
}

#[command]
pub async fn add_feed(url: String) -> (usize, String) {
  println!("request channel {}", &url);

  let res = parse_feed(&url).await;

  match res {
    Ok(res) => {
      let channel_uuid = Uuid::new_v4().hyphenated().to_string();
      let feed = create_feed_model(&channel_uuid, &url, &res);
      println!("feed {:?}", feed);
      let articles = create_article_models(&channel_uuid, &url, &res);

      feed::channel::add_feed(feed, articles)
    }
    Err(err) => (0, err),
  }
}

#[command]
pub fn get_articles(
  uuid: String,
  filter: feed::article::ArticleFilter,
) -> feed::article::ArticleQueryResult {
  println!("get articles from rust");
  use std::time::Instant;

  let before = Instant::now();
  let res = feed::article::Article::get_article(feed::article::ArticleFilter {
    channel_uuid: Some(uuid),
    read_status: filter.read_status,
    cursor: filter.cursor,
    limit: filter.limit,
  });

  println!("Elapsed time: {:.2?}", before.elapsed());
  res
}

#[command]
pub fn delete_feed(uuid: String) -> usize {
  let result = feed::channel::delete_feed(uuid);

  result
}

pub async fn sync_articles(uuid: String) -> (usize, String) {
  let channel = feed::channel::get_feed_by_uuid(String::from(&uuid));

  match channel {
    Some(channel) => {
      let res = parse_feed(&channel.feed_url).await;
      match res {
        Ok(res) => {
          let articles = create_article_models(&channel.uuid, &channel.feed_url, &res);

          println!("{:?}", &articles.len());

          let result = feed::article::Article::add_articles(String::from(&channel.uuid), articles);

          (result, String::from(""))
        }
        Err(err) => (0, err),
      }
    }
    None => (0, String::from("feed not found")),
  }
}

pub async fn sync_article_in_folder(uuid: String) -> usize {
  let connection = db::establish_connection();
  let channels = feed::folder::get_channels_in_folders(connection, vec![uuid]);

  println!("{:?}", channels);

  for channel in channels {
    sync_articles(channel.child_uuid).await;
  }

  1
}

#[command]
pub async fn sync_articles_with_channel_uuid(feed_type: String, uuid: String) -> (usize, String) {
  println!("{:?}", feed_type);

  if feed_type == "folder" {
    let res = sync_article_in_folder(uuid).await;
    println!("{:?}", res);
    (res, String::from(""))
  } else {
    let res = sync_articles(uuid).await;
    println!("{:?}", res);
    res
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
pub fn get_unread_total() -> HashMap<String, i32> {
  let result = feed::channel::get_unread_total();

  result
}

#[command]
pub fn update_article_read_status(uuid: String, status: i32) -> usize {
  let res = feed::article::Article::update_article_read_status(uuid, status);

  res
}

#[command]
pub fn mark_all_read(channel_uuid: String) -> usize {
  let res = feed::article::Article::update_articles_read_status_channel(channel_uuid);

  res
}

#[command]
pub fn get_user_config() -> Option<config::UserConfig> {
  let user_config = config::load_or_initial();

  user_config
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
pub fn create_folder(name: String) -> usize {
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
pub async fn get_article_detail(uuid: String) -> Option<models::Article> {
  let res: Option<models::Article> = feed::article::Article::get_article_with_uuid(uuid);
  res
}

#[command]
pub async fn update_icon(uuid: String, url: String) -> usize {
  let favicon = feed::channel::update_icon(&uuid, &url).await;

  favicon
}

#[command]
pub async fn get_web_best_image(url: String) -> Option<String> {
  let res = core::scraper::PageScraper::get_first_image_or_og_image(&url).await.unwrap_or("".to_string());

  Some(res)
}

#[command]
pub async fn get_web_source(url: String) -> Option<String> {
  let res = core::scraper::PageScraper::fetch_page(&url).await;
  res
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_delete_feed() {
    let url = "ee323999-8302-41de-afb4-e0929cebf5a6";
    delete_feed(String::from(url));
  }

  #[test]
  fn test_get_unread_total() {
    get_unread_total();
  }

  #[test]
  fn test_update_proxy() {
    let ip = "111.111.11.11".to_string();
    let port = "1111".to_string();

    update_proxy(ip, port);
    config::get_user_config();
  }

  #[tokio::test]
  async fn test_parse_feed() {
    // let url = "https://www.ximalaya.com/album/70501228.xml".to_string();
    let url = "http://www.youtube.com/feeds/videos.xml?channel_id=UCpVm7bg6pXKo1Pr6k5kxG9A".to_string();
    // let url = "https://medium.com/feed/google-design".to_string();
    // let url = "https://www.ximalaya.com/album/70501228.xml".to_string();
    // let url = "https://sspai.com/feed".to_string();

    println!("{:?}", url);

    let res = parse_feed(&url).await;

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
  #[tokio::test]
  async fn test_sync_() {
    sync_article_in_folder(String::from("52f4b910-2551-4bce-84cb-5ceae1f3773c")).await;
  }
}
