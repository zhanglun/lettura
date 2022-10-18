use reqwest;
use serde::{Deserialize, Serialize};
use std::error::Error;
use tauri::command;
use uuid::Uuid;
use tauri::{command};
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

  let content = response.bytes().await?;
  let channel = rss::Channel::read_from(&content[..])?;

  Ok(channel)
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
pub async fn add_channel(url: String) -> String {
  let mut connection = db::establish_connection();
  let res = fetch_rss_item(&url).await.unwrap();
  let image = match &res.image {
    Some(t) => String::from(&t.url),
    None => String::from(""),
  };
  let date = match &res.pub_date {
    Some(t) => String::from(t),
    None => String::from(""),
  };
  let feed = models::NewFeed {
    uuid: &Uuid::new_v4().hyphenated().to_string(),
    title: &res.title,
    link: &res.link,
    image: &image,
    feed_url: &url,
    description: &res.description,
    pub_date: &date,
  };

  println!("{:?}", feed);

  let res = db::add_channel(&mut connection, &feed).await;

  return "gg".to_string();
}
