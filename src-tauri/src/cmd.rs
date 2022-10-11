use reqwest;
use std::error::Error;
use tauri::{command};

pub async fn fetch_rss_item(url: &str) -> Result<String, Box<dyn Error>> {
  let content = reqwest::get(url).await?.bytes().await?;
  let channel = rss::Channel::read_from(&content[..])?;
  let items = serde_json::to_string(&channel.items)?;

  Ok(items)
}

#[command]
pub async fn fetch_feed(url: String) -> String {
  let res = fetch_rss_item(&url).await;
  let res = match res {
    Ok(data) => data,
    Err(error) => error.to_string(),
  };

  res
}
