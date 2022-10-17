use std::error::Error;
use reqwest;
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use tauri::{command};

use crate::db;
use crate::models;

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandResponse<T> {
  status: i32,
  data: T
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
    },
    _ => {
      println!("ddddd");
      None
    },
  }

}

#[command]
pub async fn fetch_feed(url: String) -> rss::Channel {
  let res = fetch_rss_item(&url).await;

 res.unwrap()
}

#[command]
pub async fn get_channels() -> Vec<models::Channel> {
  let results = db::get_channels();

  return results;
}


#[command]
pub async fn add_channel(url: String) -> String {
  let connection = db::establish_connection();
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
  let channel = models::NewFeed {
    uuid: &channel_uuid,
    title: &res.title,
    link: &res.link,
    image: &image,
    feed_url: &url,
    description: &res.description,
    pub_date: &date,
  };
  let mut articles:Vec<models::NewArticle>= Vec::new();

  for item in res.items() {
    let article_uuid = Uuid::new_v4().hyphenated().to_string();
    let title = item.title.clone().unwrap_or(String::from("no title"));
    let link = item.link.clone().unwrap_or(String::from("no link"));
    let content = item.content.clone().unwrap_or(String::from("no content"));
    let description = item.description.clone().unwrap_or(String::from("no description"));
    let date = String::from(item.pub_date().clone().unwrap());

    let s = models::NewArticle {
      uuid: article_uuid,
      channel_uuid: channel_uuid.to_string(),
      title: title,
      link: link,
      content: content,
      feed_url: url.to_string(),
      description: description,
      pub_date: date,
    };

    articles.push(s);
  }

  // println!("{:?}", channel);

  let res = db::add_channel(&connection, &channel, articles);

  return "gg".to_string();
}
