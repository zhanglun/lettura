use actix_web::{get, post, web, Responder, Result};
use serde::{Deserialize, Serialize};

use crate::core;

#[get("/api/search")]
pub async fn handle_search() -> Result<impl Responder> {}

#[get("/api/favorite")]
pub async fn handle_get_favorite() -> Result<impl Responder> {}

#[post("/api/favorite")]
pub async fn handle_update_favorite() -> Result<impl Responder> {}

pub fn config(cfg: &mut web::ServiceConfig) {
  cfg
    .service(handle_search)
    .service(handle_favorite)
    .service(handle_update_favorite);
}
