use actix_web::{get, post, web, Responder, Result};
use log::info;

use crate::feed;

/// for feed management
#[get("/api/feeds")]
pub async fn handle_get_feeds() -> Result<impl Responder> {
  let results = feed::channel::get_channels();

  Ok(web::Json(results))
}

/// for ui render
#[get("/api/subscribes")]
pub async fn handle_get_subscribes() -> Result<impl Responder> {
  let results = feed::channel::get_feeds();

  Ok(web::Json(results))
}

#[post("/api/update-feed-sort")]
pub async fn handle_update_feed_sort(body: web::Json<Vec<feed::channel::FeedSort>>) -> Result<impl Responder> {
  info!("body ===> {:?}", body.to_vec());
  let result = feed::channel::update_feed_sort(body.to_vec());

  Ok(web::Json(result))
}

pub fn config(cfg: &mut web::ServiceConfig) {
  cfg
    .service(handle_update_feed_sort)
    .service(handle_get_subscribes)
    .service(handle_get_feeds);
}
