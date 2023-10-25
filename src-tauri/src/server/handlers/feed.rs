use actix_web::{get, post, delete, web, Responder, Result};
use log::info;

use crate::feed;
use crate::core::config;

#[get("/api/unread-total")]
pub async fn handle_get_unread_total() -> Result<impl Responder> {
  let result = feed::channel::get_unread_total();

  Ok(web::Json(result))
}

#[get("/api/user-config")]
pub async fn handle_get_user_config() -> Result<impl Responder> {
  let user_config = config::load_or_initial();

  Ok(web::Json(user_config))
}

/// for feed management
#[get("/api/feeds")]
pub async fn handle_get_feeds() -> Result<impl Responder> {
  let results = feed::channel::get_channels();

  Ok(web::Json(results))
}

#[delete("/api/feeds/{uuid}")]
pub async fn handle_delete_feed(uuid: web::Path<String>) -> Result<impl Responder> {
  let results = feed::channel::delete_feed(uuid.to_string());

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
    .service(handle_get_unread_total)
    .service(handle_get_user_config)
    .service(handle_update_feed_sort)
    .service(handle_get_subscribes)
    .service(handle_get_feeds)
    .service(handle_delete_feed);
}
