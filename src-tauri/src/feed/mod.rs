use feed_rs::parser;
use reqwest;

use crate::core::config;

pub mod article;
pub mod channel;
pub mod folder;

pub fn create_client() -> reqwest::Client {
  let user_config = config::get_user_config();
  let client = match user_config {
    Some(user_config) => match user_config.local_proxy {
      Some(proxy) => {
        let mut scheme = String::from("socks5h://");

        scheme.push_str(&proxy.ip.to_string());
        scheme.push_str(":");
        scheme.push_str(&proxy.port.to_string());

        reqwest::Client::builder()
          .proxy(reqwest::Proxy::all(scheme).unwrap())
          .build()
          .unwrap()
      }
      None => reqwest::Client::builder().build().unwrap(),
    },
    None => reqwest::Client::builder().build().unwrap(),
  };

  client
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
                println!("content parse error{:?}", error);
                Err(error.to_string())
              }
            }
          }
          Err(error) => {
            println!("response not OK {:?}", error);
            Err(error.to_string())
          }
        }
      }
      reqwest::StatusCode::NOT_FOUND => Err(String::from("Could not find a feed at the location.")),
      _ => {
        println!("o {:?}", response);
        Err("Not 200 OK".to_string())
      }
    },
    Err(error) => {
      println!("ERROR: {:?}", error);
      println!("URL: {:?}", url);

      Err(error.to_string())
    }
  };

  a
}

