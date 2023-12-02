use actix_web::{get, post, web, Responder, Result};
use serde::{Deserialize, Serialize};

use crate::core::common;

#[derive(Debug, Deserialize)]
pub struct SearchRequest {
  pub query: String,
  pub limit: Option<i32>,
  pub cursor: Option<i32>,
}

#[get("/api/search")]
pub async fn handle_search(search: web::Query<SearchRequest>) -> Result<impl Responder> {
  let result = common::Common::global_search(common::GlobalSearchQuery {
    query: search.query.to_string(),
    limit: search.limit,
    cursor: search.cursor
  });

  Ok(web::Json(result))
}

#[get("/api/star")]
pub async fn handle_get_favorite() -> Result<impl Responder> {
  Ok("")
}

#[post("/api/star")]
pub async fn handle_update_favorite() -> Result<impl Responder> {
  Ok("")
}

pub fn config(cfg: &mut web::ServiceConfig) {
  cfg
    .service(handle_search)
    .service(handle_get_favorite)
    .service(handle_update_favorite);
}
