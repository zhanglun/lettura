use crate::core::config;
use feed_rs::{
  model::{MediaContent, MediaObject, MediaThumbnail, Text, Image, Link},
  parser,
};
use log;
use reqwest;
use serde::{ser::SerializeStruct, Serialize, Serializer};

pub mod article;
pub mod channel;
pub mod folder;

pub fn create_client() -> reqwest::Client {
  let user_config = config::get_user_config();
  let client_builder = reqwest::Client::builder();

  if let Some(config) = user_config {
    if let Some(proxy) = config.local_proxy {
      log::info!("user_config.local_proxy {:?}", proxy);

      let mut scheme = String::from("socks5h://");

      scheme.push_str(&proxy.ip.to_string());
      scheme.push_str(":");
      scheme.push_str(&proxy.port.to_string());

      return client_builder
        .proxy(reqwest::Proxy::all(scheme).unwrap())
        .build()
        .unwrap();
    }
  }

  client_builder.build().unwrap()
}

/// request feed, parse Feeds
///
/// # Examples
/// ```
/// let url = "https://sspai.com/feed".to_string();
/// let res = parse_feed(&url).await;
/// ```
pub async fn parse_feed(url: &str) -> Result<feed_rs::model::Feed, String> {
  let client = create_client();
  let result = client.get(url).send().await;

  let a = match result {
    Ok(response) => match response.status() {
      reqwest::StatusCode::OK => {
        let content = response.text().await;

        match content {
          Ok(content) => {
            let res = parser::parse(content.as_bytes());

            match res {
              Ok(res) => Ok(res),
              Err(error) => {
                log::error!("content parse error{:?}", error);
                Err(error.to_string())
              }
            }
          }
          Err(error) => {
            log::error!("response not OK {:?}", error);
            Err(error.to_string())
          }
        }
      }
      reqwest::StatusCode::NOT_FOUND => Err(String::from("Could not find a feed at the location.")),
      _ => {
        log::error!("o {:?}", response);
        Err("Not 200 OK".to_string())
      }
    },
    Err(error) => {
      log::error!("ERROR: {:?}", error);
      log::error!("URL: {:?}", url);

      Err(error.to_string())
    }
  };

  a
}

pub struct WrappedText(pub Text);

impl Serialize for WrappedText {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    let mut state = serializer.serialize_struct("Text", 3)?;
    state.serialize_field("content_type", &self.0.content_type.to_string())?;
    state.serialize_field("src", &self.0.src)?;
    state.serialize_field("content", &self.0.content)?;
    state.end()
  }
}

pub struct WrappedMediaContent(pub MediaContent);

impl Serialize for WrappedMediaContent {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
      where
          S: Serializer {
      let mut state = serializer.serialize_struct("MediaContent", 6)?;
      state.serialize_field("url", &self.0.url)?;
      state.serialize_field("content_type", &self.0.content_type.clone().unwrap().to_string())?;
      state.serialize_field("height", &self.0.height)?;
      state.serialize_field("width", &self.0.width)?;
      state.serialize_field("size", &self.0.size)?;
      state.end()
  }
}

pub struct WrappedLink(pub Link);

impl Serialize for WrappedLink {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
      where
          S: Serializer {
      let mut state = serializer.serialize_struct("Link", 6)?;
      state.serialize_field("href", &self.0.href)?;
      state.serialize_field("rel", &self.0.rel)?;
      state.serialize_field("media_type", &self.0.media_type)?;
      state.serialize_field("href_lang", &self.0.href_lang)?;
      state.serialize_field("title", &self.0.title)?;
      state.serialize_field("length", &self.0.length)?;
      state.end()
  }
}

pub struct WrappedImage(pub Image);

impl Serialize for WrappedImage {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
      where
          S: Serializer {
      let mut state = serializer.serialize_struct("Image", 6)?;
      state.serialize_field("uri", &self.0.uri)?;
      state.serialize_field("title", &self.0.title)?;
      state.serialize_field("link", &self.0.link.clone().map(WrappedLink))?;
      state.serialize_field("width", &self.0.width)?;
      state.serialize_field("height", &self.0.height)?;
      state.serialize_field("description", &self.0.description)?;
      state.end()
  }
}

pub struct WrappedMediaThumbnail(pub MediaThumbnail);

impl Serialize for WrappedMediaThumbnail {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
      where
          S: Serializer {
      let mut state = serializer.serialize_struct("MediaThumbnail", 2)?;
      state.serialize_field("image", &WrappedImage(self.0.image.clone()))?;
      state.serialize_field("time", &self.0.time)?;
      state.end()
  }
}

pub struct WrappedMediaObject(pub MediaObject);

impl Serialize for WrappedMediaObject {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    let mut state = serializer.serialize_struct("MediaObject", 8)?;
    state.serialize_field("title", &self.0.title.clone().map(WrappedText))?;
    state.serialize_field("description", &self.0.description.clone().map(WrappedText))?;
    state.serialize_field("content", &self.0.content.clone().into_iter().map(WrappedMediaContent).collect::<Vec<WrappedMediaContent>>())?;
    state.serialize_field("thumbnails", &self.0.thumbnails.clone().into_iter().map(WrappedMediaThumbnail).collect::<Vec<WrappedMediaThumbnail>>())?;
    state.end()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_parse_feed() {
    let url = "https://www.youtube.com/feeds/videos.xml?channel_id=UCpVm7bg6pXKo1Pr6k5kxG9A";
    let res = parse_feed(url).await;

    println!("{:?}", res);
  }
}
