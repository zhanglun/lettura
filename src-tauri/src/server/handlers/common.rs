use actix_web::{get, post, web, Responder, Result};
use serde::{Deserialize, Serialize};

use crate::core::common;
use crate::core::config;

#[get("/api/user-config")]
pub async fn handle_get_user_config() -> Result<impl Responder> {
  let user_config = config::load_or_initial();

  log::info!("===> USER CONFIG {:?}", user_config);

  Ok(web::Json(user_config))
}

#[post("/api/user-config")]
pub async fn handle_update_user_config(user_cfg: web::Json<config::UserConfig>) -> Result<impl Responder> {
  config::update_user_config(user_cfg.0);
  Ok(web::Json("hahahah"))
}

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
    limit: search.limit.clone(),
    cursor: search.cursor.clone()
  });

  Ok(web::Json(result))
}

#[get("/api/stared")]
pub async fn handle_get_stared() -> Result<impl Responder> {
  Ok("")
}

#[post("/api/star")]
pub async fn handle_update_stared() -> Result<impl Responder> {
  Ok("")
}

pub fn config(cfg: &mut web::ServiceConfig) {
  cfg
    .service(handle_get_user_config)
    .service(handle_update_user_config)
    .service(handle_search)
    .service(handle_get_stared)
    .service(handle_update_stared);
}
