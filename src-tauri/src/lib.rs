use std::error::Error;

pub async fn fetch_rss_item(url: &str) -> Result<String, Box<dyn Error>> {
  let content = reqwest::get(url).await?.bytes().await?;
  let channel = rss::Channel::read_from(&content[..])?;
  let items = serde_json::to_string(&channel.items)?;

  Ok(items)
}