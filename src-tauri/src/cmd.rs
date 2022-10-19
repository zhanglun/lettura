use reqwest;
use serde::{Deserialize, Serialize};
use std::error::Error;
use tauri::command;
use uuid::Uuid;

use crate::db;
use crate::models;

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandResponse<T> {
  status: i32,
  data: T,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FeedRes {
  channel: rss::Channel,
  items: Vec<rss::Item>,
}

pub async fn fetch_rss_item(url: &str) -> Option<rss::Channel> {
  let response = reqwest::get(url).await.unwrap();

  println!("{}", &response.status());

  match response.status() {
    reqwest::StatusCode::OK => {
      let content = response.bytes().await.unwrap();
      let channel = rss::Channel::read_from(&content[..]).unwrap();

      Some(channel)
    }
    _ => {
      println!("ddddd");
      None
    }
  }
}

#[command]
pub async fn fetch_feed(url: String) -> Option<rss::Channel> {
  let res = fetch_rss_item(&url).await;

  res
}

#[command]
pub async fn get_channels() -> Vec<models::Channel> {
  let results = db::get_channels();

  return results;
}

#[command]
pub async fn add_channel(url: String) -> usize {
  let res = fetch_rss_item(&url).await.unwrap();

  let image = match &res.image {
    Some(t) => String::from(&t.url),
    None => String::from(""),
  };
  let date = match &res.pub_date {
    Some(t) => String::from(t),
    None => String::from(""),
  };
  let channel_uuid = Uuid::new_v4().hyphenated().to_string();
  let channel = models::NewChannel {
    uuid: &channel_uuid,
    title: &res.title,
    link: &res.link,
    image: &image,
    feed_url: &url,
    description: &res.description,
    pub_date: &date,
  };
  let mut articles: Vec<models::NewArticle> = Vec::new();

  for item in res.items() {
    let article_uuid = Uuid::new_v4().hyphenated().to_string();
    let title = item.title.clone().unwrap_or(String::from("no title"));
    let link = item.link.clone().unwrap_or(String::from("no link"));
    let content = item.content.clone().unwrap_or(String::from("no content"));
    let description = item
      .description
      .clone()
      .unwrap_or(String::from("no description"));
    let date = String::from(item.pub_date().clone().unwrap());

    let s = models::NewArticle {
      uuid: article_uuid,
      channel_uuid: channel_uuid.to_string(),
      title,
      link,
      content,
      feed_url: url.to_string(),
      description,
      pub_date: date,
    };

    articles.push(s);
  }

  let res = db::add_channel(&channel, articles);

  res
}

#[command]
pub fn get_articles(uuid: String) -> db::ArticleQueryResult {
  println!("get articles from rust");
  let res = db::get_article(db::ArticleFilter {
    channel_uuid: Some(uuid),
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
  let channel = db::get_channel_by_uuid(uuid);
  match channel {
    Some(channel) => {
      let res = fetch_rss_item(&channel.feed_url).await.unwrap();

      let mut articles: Vec<models::NewArticle> = Vec::new();

      for item in res.items() {
        let article_uuid = Uuid::new_v4().hyphenated().to_string();
        let title = item.title.clone().unwrap_or(String::from("no title"));
        let link = item.link.clone().unwrap_or(String::from("no link"));
        let content = item.content.clone().unwrap_or(String::from("no content"));
        let description = item
          .description
          .clone()
          .unwrap_or(String::from("no description"));
        let date = String::from(item.pub_date().clone().unwrap());

        let s = models::NewArticle {
          uuid: article_uuid,
          channel_uuid: String::from(&channel.uuid),
          title,
          link,
          content,
          feed_url: String::from(&channel.feed_url),
          description,
          pub_date: date,
        };

        articles.push(s);
      }

      let result = db::add_articles(String::from(&channel.uuid), articles);

      result
    }
    None => 0,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_get_articles() {
    let uuid = String::from("9a6ca3f0-41f2-4486-a50a-1a41f1e80b56");
    get_articles(uuid);
  }

  #[test]
  fn test_delete_channel() {
    let url = "9a6ca3f0-41f2-4486-a50a-1a41f1e80b56";
    delete_channel(String::from(url));
  }
}
