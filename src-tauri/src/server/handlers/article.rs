use actix_web::{get, post, web, Responder, Result};
use serde::{Deserialize, Serialize};

use crate::core;
use crate::feed;

#[get("/api/articles/{uuid}")]
pub async fn handle_get_article_detail(uuid: web::Path<String>) -> Result<impl Responder> {
  let res = feed::article::Article::get_article_with_uuid(uuid.to_string());

  Ok(web::Json(res))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReadParam {
  read_status: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StarParam {
  starred: i32,
}

#[post("/api/articles/{uuid}/read")]
pub async fn handle_update_article_read_status(uuid: web::Path<String>, body: web::Json<ReadParam>) -> Result<impl Responder> {
  let body = body.into_inner();
  let res = feed::article::Article::update_article_read_status(uuid.to_string(), body.read_status);

  Ok(web::Json(res))
}

#[post("/api/articles/{uuid}/star")]
pub async fn handle_update_article_star_status(uuid: web::Path<String>, body: web::Json<StarParam>) -> Result<impl Responder> {
  let body = body.into_inner();
  let res = feed::article::Article::update_article_star_status(uuid.to_string(), body.starred);

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
    is_today: body.is_today.clone(),
    is_all: body.is_all.clone(),
  });

  Ok(web::Json(res))
}

#[get("/api/articles")]
pub async fn handle_articles(
  query: web::Query<feed::article::ArticleFilter>,
) -> Result<impl Responder> {
  let filter = feed::article::ArticleFilter {
    feed_uuid: query.feed_uuid.clone(),
    folder_uuid: query.folder_uuid.clone(),
    item_type: query.item_type.clone(),
    is_today: query.is_today.clone(),
    is_starred: query.is_starred.clone(),
    read_status: query.read_status.clone(),
    cursor: query.cursor.clone(),
    limit: query.limit.clone(),
  };

  let res = feed::article::Article::get_article(filter);

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
    .service(handle_update_article_read_status)
    .service(handle_update_article_star_status)
    .service(handle_articles)
    ;
}
