use actix_web::{get, post, delete, web, Responder, Result};
use serde::Deserialize;

use crate::feed;

#[get("/api/tags")]
pub async fn handle_get_tags() -> Result<impl Responder> {
    let tags = feed::tag::get_tags();
    Ok(web::Json(tags))
}

#[derive(Debug, Deserialize)]
pub struct CreateTagBody {
    name: String,
}

#[post("/api/tags")]
pub async fn handle_create_tag(body: web::Json<CreateTagBody>) -> Result<impl Responder> {
    let body = body.into_inner();
    let (count, err) = feed::tag::create_tag(body.name);
    if err.is_empty() {
        Ok(web::Json(serde_json::json!({ "success": true, "count": count })))
    } else {
        Ok(web::Json(serde_json::json!({ "success": false, "error": err })))
    }
}

#[delete("/api/tags/{uuid}")]
pub async fn handle_delete_tag(uuid: web::Path<String>) -> Result<impl Responder> {
    let count = feed::tag::delete_tag(uuid.to_string());
    Ok(web::Json(serde_json::json!({ "success": true, "count": count })))
}

#[derive(Debug, Deserialize)]
pub struct AddTagToArticleBody {
    article_id: i32,
    tag_name: String,
}

#[post("/api/article-tags")]
pub async fn handle_add_tag_to_article(body: web::Json<AddTagToArticleBody>) -> Result<impl Responder> {
    let body = body.into_inner();
    let (count, err) = feed::tag::add_tag_to_article(body.article_id, body.tag_name);
    if err.is_empty() {
        Ok(web::Json(serde_json::json!({ "success": true, "count": count })))
    } else {
        Ok(web::Json(serde_json::json!({ "success": false, "error": err })))
    }
}

#[derive(Debug, Deserialize)]
pub struct RemoveTagFromArticleBody {
    article_id: i32,
    tag_id: i32,
}

#[delete("/api/article-tags")]
pub async fn handle_remove_tag_from_article(body: web::Json<RemoveTagFromArticleBody>) -> Result<impl Responder> {
    let body = body.into_inner();
    let count = feed::tag::remove_tag_from_article(body.article_id, body.tag_id);
    Ok(web::Json(serde_json::json!({ "success": true, "count": count })))
}

#[get("/api/articles/{article_id}/tags")]
pub async fn handle_get_article_tags(article_id: web::Path<i32>) -> Result<impl Responder> {
    let tags = feed::tag::get_article_tags(article_id.into_inner());
    Ok(web::Json(tags))
}

pub fn config(cfg: &mut web::ServiceConfig) {
    cfg
        .service(handle_get_tags)
        .service(handle_create_tag)
        .service(handle_delete_tag)
        .service(handle_add_tag_to_article)
        .service(handle_remove_tag_from_article)
        .service(handle_get_article_tags);
}
