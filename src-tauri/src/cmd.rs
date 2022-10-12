use reqwest;
use serde::{Serialize, Deserialize};
use std::error::Error;
use tauri::{command};

use crate::{db, models::Feed};

#[derive(Debug, Serialize, Deserialize)]
pub struct FeedRes {
  channel: String,
  items: String,
}

pub async fn fetch_rss_item(url: &str) -> Result<FeedRes, Box<dyn Error>> {
  let response = reqwest::get(url).await?;

  println!("{}", &response.status());

  if response.status().is_success() {
    let content = response.bytes().await?;
    let channel = rss::Channel::read_from(&content[..])?;
    let items = serde_json::to_string(&channel.items)?;
    let res = FeedRes {
      channel: channel.to_string(),
      items,
    };

    return Ok(res);
  } else {
    return Ok(FeedRes{ channel: "".to_string(), items: "[]".to_string()});
  }
}

#[command]
pub async fn fetch_feed(url: String) -> String {
  let res = fetch_rss_item(&url).await;
  let res = match res {
    Ok(data) => serde_json::to_string(&data),
    Err(error) => error.to_string(),
  };

  res
}


#[command]
pub async fn get_feeds() -> String {
  let results = db::get_feeds();

  return results;
}
