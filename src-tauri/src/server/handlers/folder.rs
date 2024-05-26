use actix_web::{get, post, web, Responder, Result};

use crate::feed;

#[get("/api/folders")]
pub async fn handle_get_folders() -> Result<impl Responder> {
 let folders = feed::folder::get_folders();
 Ok(web::Json(folders))
}

pub fn config(cfg: &mut web::ServiceConfig) {
  cfg.service(handle_get_folders);
}
