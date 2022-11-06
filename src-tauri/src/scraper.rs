use reqwest::{self, Response};
use scraper::{self, Selector};
use std::error::Error;

use crate::cmd;

pub struct PageScraper {}

impl PageScraper {
  // pub fn from_str(s: &str) -> Result<Self, Error> {}
  pub fn from_str(s: &str) -> usize {
    let document = scraper::Html::parse_document(s);
    let head_selector = Selector::parse("title").unwrap();

    for element in document.select(&head_selector) {
      println!("{:?}",element.inner_html());
    }

    1
  }

  pub async fn fetch_page(url: &str) -> Option<String> {
    let client = cmd::create_client();
    let response = client.get(url).send().await;

    let result = match response {
      Ok(response) => match response.status() {
        reqwest::StatusCode::OK => {
          let content = response.text().await.unwrap();

          content
        }
        _ => String::from(""),
      },
      Err(a) => String::from(""),
    };

    Some(result)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_from_str() {
    let url = "https://post.smzdm.com/p/a3032dkd/";
    let response = PageScraper::fetch_page(&url).await.unwrap();

    PageScraper::from_str(&response);
  }
}
