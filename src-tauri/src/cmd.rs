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

pub async fn fetch_rss_item(url: &str) -> Result<rss::Channel, Box<dyn Error>> {
  let response = reqwest::get(url).await?;

  println!("{}", &response.status());

  let content = response.bytes().await?;
  let channel = rss::Channel::read_from(&content[..])?;

  Ok(channel)
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
  let items = res.items();
  let mut articles:Vec<models::NewArticle>= Vec::new();

  for item in items {
    let article_uuid = Uuid::new_v4().hyphenated().to_string();
    let title = item.title.clone().unwrap_or(String::from("no title"));
    let link = item.link.clone().unwrap_or(String::from("no link"));
    let content = item.content.clone().unwrap_or(String::from("no content"));
    let date = String::from(item.pub_date().clone().unwrap());

    let s = models::NewArticle {
      uuid: &article_uuid,
      channel_uuid: &channel_uuid,
      title: &title,
      link: &link,
      content: &String::from(content),
      feed_url: &url,
      description: &res.description,
      pub_date: &date,
    };

    articles.push(s);
  }

  // println!("{:?}", channel);

  // let res = db::add_channel(&mut connection, &channel, &articles).await;

  return "gg".to_string();
}
