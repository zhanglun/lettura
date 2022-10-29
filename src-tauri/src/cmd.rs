use std::collections::HashMap;
use std::fmt;

use reqwest;
use serde::{ser::Serializer, Deserialize, Serialize};
use tauri::command;
use uuid::Uuid;

use crate::config;
use crate::db;
use crate::models;

use std::str::FromStr;

#[derive(Debug, Clone, Serialize)]
pub enum Feed {
  Atom(atom_syndication::Feed),
  RSS(rss::Channel),
}

impl FromStr for Feed {
  type Err = &'static str;

  fn from_str(s: &str) -> Result<Self, Self::Err> {
    match atom_syndication::Feed::from_str(s) {
      Ok(feed) => Ok(Feed::Atom(feed)),
      _ => match rss::Channel::from_str(s) {
        Ok(feed) => Ok(Feed::RSS(feed)),
        _ => Err("Could not parse XML as Atom or RSS from input"),
      },
    }
  }
}

impl ToString for Feed {
  fn to_string(&self) -> String {
    match self {
      &Feed::Atom(ref atom_feed) => atom_feed.to_string(),
      &Feed::RSS(ref rss_channel) => rss_channel.to_string(),
    }
  }
}

pub fn create_client() -> reqwest::Client {
  let user_config = config::get_user_config();
  let client = match user_config {
    Some(user_config) => match user_config.local_proxy {
      Some(proxy) => {
        let mut scheme = String::from("socks5h://");

        scheme.push_str(&proxy.ip.to_string());
        scheme.push_str(":");
        scheme.push_str(&proxy.port.to_string());

        println!("{:?}", scheme);

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

pub async fn fetch_feed_item(url: &str) -> Option<Feed> {
  let client = create_client();
  let response = client.get(url).send().await;

  match response {
    Ok(response) => match response.status() {
      reqwest::StatusCode::OK => {
        let content = response.text().await.unwrap();
        let res = content[..].parse::<Feed>();

        match res {
          Ok(res) => Some(res),
          Err(_) => None,
        }
      }
      _ => {
        println!("{}", &response.status());
        None
      }
    },
    Err(_) => None,
  }
}

#[command]
pub async fn fetch_feed(url: String) -> Option<Feed> {
  let res = fetch_feed_item(&url).await;

  res
}

#[command]
pub async fn get_channels() -> Vec<models::Channel> {
  let results = db::get_channels();

  return results;
}

pub fn create_channel_model(
  uuid: &String,
  url: &String,
  res: &Feed,
) -> usize {
  // match res {
  //   Feed::Atom(a) => {
  //     println!("Atom {:?}", a);
  //   },
  //   Feed::RSS(b) => {
  //     println!("RSS {:?}", b);
  //   }
  // };

  println!("{:?}", res);

  1
  // let image = match &res.image {
  //   Some(t) => String::from(&t.url),
  //   None => String::from(""),
  // };
  // let date = match &res.pub_date {
  //   Some(t) => String::from(t),
  //   None => String::from(""),
  // };
  // let channel = models::NewChannel {
  //   uuid: uuid.to_string(),
  //   title: res.title.to_string(),
  //   link: res.link.to_string(),
  //   image: image.to_string(),
  //   feed_url: url.to_string(),
  //   description: res.description.to_string(),
  //   pub_date: date,
  // };

  // return channel;
}

pub fn create_article_models(
  channel_uuid: &String,
  feed_url: &String,
  res: &Feed,
) -> Vec<models::NewArticle> {
  let mut articles: Vec<models::NewArticle> = Vec::new();

  let res = match res {
    Feed::Atom(_) => println!("Atom"),
    Feed::RSS(_) => println!("RSS"),
  };

  println!("{:?}", res);

  // for item in res.entries {
  //   let article_uuid = Uuid::new_v4().hyphenated().to_string();
  //   let title = item.title.clone().unwrap_or(String::from(""));
  //   let link = item.link.clone().unwrap_or(String::from(""));
  //   let content = item.content.clone().unwrap_or(String::from(""));
  //   let description = item
  //     .description
  //     .clone()
  //     .unwrap_or(String::from("no description"));
  //   let date = String::from(item.pub_date().clone().unwrap_or(""));

  //   let s = models::NewArticle {
  //     uuid: article_uuid,
  //     channel_uuid: channel_uuid.to_string(),
  //     title,
  //     link,
  //     content,
  //     feed_url: feed_url.to_string(),
  //     description,
  //     pub_date: date,
  //   };

  //   articles.push(s);
  // }

  articles
}

#[command]
pub async fn add_channel(url: String) -> usize {
  println!("request channel {}", &url);

  let res = fetch_feed_item(&url).await;

  match res {
    Some(res) => {
      let channel_uuid = Uuid::new_v4().hyphenated().to_string();
      let channel = create_channel_model(&channel_uuid, &url, &res);
      // let articles = create_article_models(&channel_uuid, &url, &res);
      // let res = db::add_channel(channel, articles);

      // res
      1
    }
    None => 0,
  };
  1
}

#[command]
pub fn get_articles(uuid: String, filter: db::ArticleFilter) -> db::ArticleQueryResult {
  println!("get articles from rust");
  let res = db::get_article(db::ArticleFilter {
    channel_uuid: Some(uuid),
    read_status: filter.read_status,
  });

  res
}

#[command]
pub fn delete_channel(uuid: String) -> usize {
  let result = db::delete_channel(uuid);

  result
}

#[command]
pub async fn sync_articles_with_channel_uuid(uuid: String) -> usize {
  // let channel = db::get_channel_by_uuid(uuid);

  // match channel {
  //   Some(channel) => {
  //     let res = fetch_feed_item(&channel.feed_url).await.unwrap();
  //     let articles = create_article_models(&channel.uuid, &channel.feed_url, &res);

  //     println!("{:?}", &articles.len());

  //     let result = db::add_articles(String::from(&channel.uuid), articles);

  //     result
  //   }
  //   None => 0,
  // }

  1
}

#[command]
pub async fn import_channels(list: Vec<String>) -> usize {
  println!("{:?}", &list);
  for url in &list {
    add_channel(url.to_string()).await;
  }
  1
}

#[command]
pub fn get_unread_total() -> HashMap<String, i32> {
  let record = db::get_unread_total();
  let result = record
    .into_iter()
    .map(|r| (r.channel_uuid.clone(), r.unread_count.clone()))
    .collect::<HashMap<String, i32>>();

  result
}

#[command]
pub fn update_article_read_status(uuid: String, status: i32) -> usize {
  let res = db::update_article_read_status(uuid, status);

  res
}

#[command]
pub fn mark_all_read(channel_uuid: String) -> usize {
  let res = db::update_articles_read_status_channel(channel_uuid);

  res
}

#[command]
pub fn get_user_config() -> Option<config::UserConfig> {
  let user_config = config::get_user_config();

  user_config
}

#[command]
pub fn update_user_config(key: String) -> usize {
  1
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_delete_channel() {
    let url = "9a6ca3f0-41f2-4486-a50a-1a41f1e80b56";
    delete_channel(String::from(url));
  }

  #[test]
  fn test_get_unread_total() {
    get_unread_total();
  }
}
