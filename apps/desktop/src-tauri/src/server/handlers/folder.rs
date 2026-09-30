use actix_web::{delete, get, post, put, web, Responder, Result};
use serde::Deserialize;

use crate::feed;

#[get("/api/folders")]
pub async fn handle_get_folders() -> Result<impl Responder> {
  Ok(web::Json(feed::folder::get_folders()))
}

#[derive(Deserialize)]
pub struct FolderBody {
  name: String,
}

#[post("/api/folders")]
pub async fn handle_create_folder(body: web::Json<FolderBody>) -> Result<impl Responder> {
  Ok(web::Json(feed::folder::create_folder(body.name.clone())))
}

#[put("/api/folders/{uuid}")]
pub async fn handle_update_folder(
  uuid: web::Path<String>,
  body: web::Json<FolderBody>,
) -> Result<impl Responder> {
  Ok(web::Json(feed::folder::update_folder(uuid.into_inner(), body.name.clone())))
}

#[delete("/api/folders/{uuid}")]
pub async fn handle_delete_folder(uuid: web::Path<String>) -> Result<impl Responder> {
  Ok(web::Json(feed::folder::delete_folder(uuid.into_inner())))
}

pub fn config(cfg: &mut web::ServiceConfig) {
  cfg
    .service(handle_get_folders)
    .service(handle_create_folder)
    .service(handle_update_folder)
    .service(handle_delete_folder);
}
