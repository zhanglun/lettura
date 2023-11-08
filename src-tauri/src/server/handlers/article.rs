use actix_web::{get, post, web, App, HttpRequest, HttpResponse, HttpServer, Responder, Result};
use serde::{Deserialize, Serialize};

use crate::core;
use crate::feed;

#[derive(Serialize)]
struct MyObj {
  name: String,
}

#[get("/api/articles/{uuid}")]
pub async fn handle_get_article_detail(uuid: web::Path<String>) -> Result<impl Responder> {
  let res = feed::article::Article::get_article_with_uuid(uuid.to_string());

  Ok(web::Json(res))
}

#[derive(Debug, Deserialize)]
pub struct ProxyQuery {
  url: String,
}

#[get("/api/image-proxy")]
pub async fn handle_get_article_best_image(
  query: web::Query<ProxyQuery>,
) -> Result<impl Responder> {
  let res = core::scraper::PageScraper::get_first_image_or_og_image(&(query.url.to_string()))
    .await
    .unwrap_or("".to_string());

  Ok(web::Json(Some(res)))
}

#[get("/api/article-proxy")]
pub async fn handle_get_article_source(query: web::Query<ProxyQuery>) -> Result<impl Responder> {
  let res = core::scraper::PageScraper::fetch_page(&(query.url.to_string())).await;

  Ok(web::Json(res))
}

#[get("/api/collection-metas")]
pub async fn handle_collection_metas() -> Result<impl Responder> {
  let obj = feed::article::Article::get_collection_metas();

  Ok(web::Json(obj))
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SyncFeedQuery {
  feed_type: String,
}

#[get("/api/feeds/{uuid}/sync")]
pub async fn handle_sync_feed(
  uuid: web::Path<String>,
  query: web::Query<SyncFeedQuery>,
) -> Result<impl Responder> {
  let res = feed::channel::sync_feed(uuid.to_string(), query.feed_type.to_string()).await;

  Ok(web::Json(res))
}

#[post("/api/mark-all-as-read")]
pub async fn handle_mark_as_read(
  body: web::Json<feed::article::MarkAllUnreadParam>,
) -> Result<impl Responder> {
  let res = feed::article::Article::mark_as_read(feed::article::MarkAllUnreadParam {
    uuid: body.uuid.clone(),
    is_today: body.is_today,
    is_all: body.is_all,
  });

  Ok(web::Json(res))
}

#[get("/api/articles")]
pub async fn handle_articles(
  query: web::Query<feed::article::ArticleFilter>,
) -> Result<impl Responder> {
  let filter = feed::article::ArticleFilter {
    feed_uuid: query.feed_uuid.clone(),
    item_type: query.item_type.clone(),
    read_status: query.read_status.clone(),
    cursor: query.cursor.clone(),
    limit: query.limit.clone(),
  };

  let res = feed::article::Article::get_article(filter);

  Ok(web::Json(res))
}

#[get("/api/all-articles")]
pub async fn handle_get_all_articles(
  query: web::Query<feed::article::ArticleFilter>,
) -> Result<impl Responder> {
  let filter = feed::article::ArticleFilter {
    feed_uuid: query.feed_uuid.clone(),
    item_type: query.item_type.clone(),
    read_status: query.read_status.clone(),
    cursor: query.cursor.clone(),
    limit: query.limit.clone(),
  };

  let res = feed::article::Article::get_all_articles(filter);

  Ok(web::Json(res))
}

#[get("/api/today-articles")]
pub async fn handle_get_today_articles(
  query: web::Query<feed::article::ArticleFilter>,
) -> Result<impl Responder> {
  let filter = feed::article::ArticleFilter {
    feed_uuid: query.feed_uuid.clone(),
    item_type: query.item_type.clone(),
    read_status: query.read_status.clone(),
    cursor: query.cursor.clone(),
    limit: query.limit.clone(),
  };

  let res = feed::article::Article::get_today_articles(filter);

  Ok(web::Json(res))
}

pub fn config(cfg: &mut web::ServiceConfig) {
  cfg
    .service(handle_get_article_best_image)
    .service(handle_get_article_detail)
    .service(handle_get_article_source)
    .service(handle_collection_metas)
    .service(handle_sync_feed)
    .service(handle_mark_as_read)
    .service(handle_articles)
    .service(handle_get_all_articles)
    .service(handle_get_today_articles)
    ;
}
