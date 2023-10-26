use feed_rs::parser;
use log;
use reqwest;
use crate::core::config;

pub mod article;
pub mod channel;
pub mod folder;

pub fn create_client() -> reqwest::Client {
  let user_config = config::get_user_config();
  let client_builder = reqwest::Client::builder();

  if let Some(user_config) = user_config {
    if let Some(proxy) = user_config.local_proxy {
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

