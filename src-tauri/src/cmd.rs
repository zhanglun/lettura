use reqwest;
use serde::{Serialize, Deserialize};
use std::error::Error;
use tauri::{command};

use crate::{db, models::Feed};

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

  // let res = match res {
  //   Ok(res) => res,
  //   Err(error) => "No result".into(),
  // };

 res.unwrap()
}


#[command]
pub async fn get_feeds() -> String {
  let results = db::get_feeds();

  return results;
}
