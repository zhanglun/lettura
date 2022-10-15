use std::error::Error;
use reqwest;
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use tauri::{command};

use crate::db;
use crate::models::{Feed, NewFeed};

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
pub async fn get_feeds() -> String {
  let results = db::get_feeds();

  return results;
}

#[command]
pub async fn add_channel(url: String) -> String {
  let mut connection = db::establish_connection();
  let res = fetch_rss_item(&url).await.unwrap();
  let image = match res.image {
    Some(t) => t.url,
    None => "".to_string(),
  };
  let date = match res.pub_date {
    Some(t) => t,
    None => "".to_string(),
  };
  let feed = NewFeed {
    uuid: &Uuid::new_v4().hyphenated().to_string(),
    title: &res.title,
    link: &res.link,
    image: &image,
    feed_url: &url,
    description: &res.description,
    pub_date: &date,
  };

  println!("{:?}", feed);

  let res = db::add_feed(&mut connection, &feed).await;

  return "gg".to_string();
}
