use actix_web::{get, web, Responder, Result};

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

pub fn config(cfg: &mut web::ServiceConfig) {
  cfg
    .service(handle_get_subscribes)
    .service(handle_get_feeds);
}
