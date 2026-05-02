use actix_web::{get, post, delete, put, web, Responder, Result};
use serde::Deserialize;

use crate::feed;

#[get("/api/collections")]
pub async fn handle_get_collections() -> Result<impl Responder> {
    let collections = feed::collection::get_collections();
    Ok(web::Json(collections))
}

#[derive(Debug, Deserialize)]
pub struct CreateCollectionBody {
    name: String,
    description: Option<String>,
    icon: Option<String>,
}

#[post("/api/collections")]
pub async fn handle_create_collection(body: web::Json<CreateCollectionBody>) -> Result<impl Responder> {
    let body = body.into_inner();
    let (count, err) = feed::collection::create_collection(body.name, body.description, body.icon);
    if err.is_empty() {
        Ok(web::Json(serde_json::json!({ "success": true, "count": count })))
    } else {
        Ok(web::Json(serde_json::json!({ "success": false, "error": err })))
    }
}

#[derive(Debug, Deserialize)]
pub struct UpdateCollectionBody {
    name: Option<String>,
    description: Option<String>,
    icon: Option<String>,
}

#[put("/api/collections/{uuid}")]
pub async fn handle_update_collection(
    uuid: web::Path<String>,
    body: web::Json<UpdateCollectionBody>,
) -> Result<impl Responder> {
    let body = body.into_inner();
    let (count, err) = feed::collection::update_collection(
        uuid.to_string(), body.name, body.description, body.icon,
    );
    if err.is_empty() {
        Ok(web::Json(serde_json::json!({ "success": true, "count": count })))
    } else {
        Ok(web::Json(serde_json::json!({ "success": false, "error": err })))
    }
}

#[delete("/api/collections/{uuid}")]
pub async fn handle_delete_collection(uuid: web::Path<String>) -> Result<impl Responder> {
    let count = feed::collection::delete_collection(uuid.to_string());
    Ok(web::Json(serde_json::json!({ "success": true, "count": count })))
}

#[derive(Debug, Deserialize)]
pub struct ArticleCollectionBody {
    article_id: i32,
    collection_id: i32,
}

#[post("/api/article-collections")]
pub async fn handle_add_article_to_collection(body: web::Json<ArticleCollectionBody>) -> Result<impl Responder> {
    let body = body.into_inner();
    let (count, err) = feed::collection::add_article_to_collection(body.article_id, body.collection_id);
    if err.is_empty() {
        Ok(web::Json(serde_json::json!({ "success": true, "count": count })))
    } else {
        Ok(web::Json(serde_json::json!({ "success": false, "error": err })))
    }
}

#[derive(Debug, Deserialize)]
pub struct RemoveArticleCollectionQuery {
    article_id: i32,
    collection_id: i32,
}

#[delete("/api/article-collections")]
pub async fn handle_remove_article_from_collection(body: web::Json<RemoveArticleCollectionQuery>) -> Result<impl Responder> {
    let body = body.into_inner();
    let count = feed::collection::remove_article_from_collection(body.article_id, body.collection_id);
    Ok(web::Json(serde_json::json!({ "success": true, "count": count })))
}

#[get("/api/articles/{id}/collections")]
pub async fn handle_get_article_collections(id: web::Path<i32>) -> Result<impl Responder> {
    let collections = feed::collection::get_article_collections(id.into_inner());
    Ok(web::Json(collections))
}

pub fn config(cfg: &mut web::ServiceConfig) {
    cfg
        .service(handle_get_collections)
        .service(handle_create_collection)
        .service(handle_update_collection)
        .service(handle_delete_collection)
        .service(handle_add_article_to_collection)
        .service(handle_remove_article_from_collection)
        .service(handle_get_article_collections);
}
