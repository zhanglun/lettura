use reqwest::{self};
use scraper::{self, Selector};
use serde::Serialize;
use tokio::sync::{Mutex};
use std::sync::Arc;
use tokio::sync::mpsc::{channel};

use crate::feed;
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
    let client = feed::create_client();
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

  pub async fn get_first_image_or_og_image(url: &str) -> Option<String> {
    let client = feed::create_client();
    let res = client.get(url).send().await.ok()?;
    let body = res.text().await.ok()?;
    let document = scraper::Html::parse_document(&body);

    let og_selector = scraper::Selector::parse(r#"meta[property="og:image"]"#).unwrap();
    if let Some(og_image) = document.select(&og_selector).next() {
      if let Some(content) = og_image.value().attr("content") {
        return Some(content.to_string());
      }
    }

    let img_selector = scraper::Selector::parse("img").unwrap();
    for img in document.select(&img_selector) {
      if let Some(src) = img.value().attr("src") {
        return Some(src.to_string());
      }
    }

    None
  }

  pub async fn get_first_images_or_og_images_async(
    urls: Vec<String>,
    _max_concurrency: usize,
  ) -> Vec<(String, Option<String>)> {
    let (tx, mut rx) = channel(urls.len());
    let counter = Arc::new(Mutex::new(0));
    for url in urls.clone() {
      let tx_clone = tx.clone();
      let counter_clone = counter.clone();
      tokio::task::spawn(async move {
        println!("start fetch image : {:?}", &url);
        let image_url = Self::get_first_image_or_og_image(&url).await;
        println!("end fetch image, we get image: {:?}", image_url);
        tx_clone.send((url.clone().to_string(), image_url)).await.unwrap();
        let mut counter = counter_clone.lock().await;
        *counter += 1;
      });

    }

    let _counter_clone = counter.clone();
    let mut image_urls = vec![];
    while let Some((url, image_url)) = rx.recv().await {
      image_urls.push((url, image_url));
      let counter = counter.lock().await;
      println!("counter {:?} len {:?}", *counter, urls.len());

      if *counter >= urls.len() {

        print!("stop!!!!!!");
        tokio::task::yield_now().await;
        return image_urls;
      }
    }

    image_urls
  }
}

#[cfg(test)]
mod tests {
  use uuid::Uuid;

use super::*;

  #[tokio::test]
  async fn test_from_str() {
    let url = "https://post.smzdm.com/feed";
    // let url = "https://anyway.fm/rss.xml";
    println!("request channel {}", &url);

    let res = feed::parse_feed(&url).await;

    match res {
      Ok(res) => {
        let channel_uuid = Uuid::new_v4().hyphenated().to_string();
        let articles = cmd::create_article_models(&channel_uuid, &url.to_string(), &res);

        println!("articles: {:?}", articles);

        let urls = articles.into_iter().map(|a| a.link ).collect::<Vec<String>>();
        let res = PageScraper::get_first_images_or_og_images_async(urls, 5).await;

        println!("res: {:?}", res);
      }
      Err(err) => {
        println!("errpr{:?}", err);
      }
    };
  }
}
