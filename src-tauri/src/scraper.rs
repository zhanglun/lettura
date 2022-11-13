use reqwest::{self};
use scraper::{self, Selector};
use serde::Serialize;

use crate::cmd;

#[derive(Debug, Default, Serialize)]
pub struct PageScraper {
  pub title: String,
  pub content: String,
  pub author: String,
  pub date_published: String,
  pub domain: String,
  pub url: String,
  pub excerpt: String,
}

impl PageScraper {
  // pub fn from_str(s: &str) -> Result<Self, Error> {}

  /// get content from string
  /// # Examples
  /// ```
  /// use crate::scraper;
  /// let html = r#'
  ///   <html>
  ///     <head>
  ///        <title>Test Title</title>
  ///     </head>
  ///   </html>'
  /// PageScraper.from_str(html)
  /// ```
  pub fn from_str(s: &str) -> usize {
    let document = scraper::Html::parse_document(s);
    let mut scraper = PageScraper::default();
    let head_selector = Selector::parse("title").unwrap();

    for element in document.select(&head_selector) {
      scraper.title = element.inner_html();
    }

    println!("{:?}", scraper);

    1
  }

  pub fn title(&self) -> &str {
    self.title.as_str()
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
      Err(_) => String::from(""),
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
