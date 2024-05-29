use actix_web::{delete, get, post, put, web, HttpResponse, Responder, Result};
use serde::Deserialize;
use serde::Serialize;
use serde_json::json;

use crate::core::common;
use crate::core::config;

#[get("/api/user-config")]
pub async fn handle_get_user_config() -> Result<impl Responder> {
  let user_config = config::get_user_config();

  Ok(web::Json(user_config))
}

#[post("/api/user-config")]
pub async fn handle_update_user_config(
  user_cfg: web::Json<config::UserConfig>,
) -> Result<impl Responder> {
  let result = config::update_user_config(user_cfg.0);
  Ok(web::Json(result))
}

#[get("/api/proxy")]
pub async fn handle_get_proxy() -> Result<impl Responder> {
  let user_config = config::get_user_config();

  let proxy = user_config.proxy;
  let proxy_rules = user_config.proxy_rules;
  // letHttpResponse::Ok().json()

  Ok(web::Json(json!({
    "proxy": proxy,
    "proxy_rules": proxy_rules,
  })))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PutProxyBody {
  proxy: config::Proxy,
  rules: Vec<String>,
}

#[put("/api/proxy")]
pub async fn handle_add_proxy(body: web::Json<PutProxyBody>) -> Result<impl Responder> {
  let body = body.into_inner();
  let result = config::add_proxy(body.proxy, body.rules);

  let response = match result {
    Ok(proxies) => HttpResponse::Ok().json(proxies),
    Err(err) => HttpResponse::Ok().json(json!({"error": err.to_string()})),
  };

  Ok(response)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateProxyBody {
  id: String,
  proxy: config::Proxy,
  rules: Option<Vec<String>>,
}

#[post("/api/proxy")]
pub async fn handle_update_proxy(body: web::Json<UpdateProxyBody>) -> Result<impl Responder> {
  let body = body.into_inner();
  let result = config::update_proxy(body.id, body.proxy, body.rules);

  let response = match result {
    Ok(proxies) => HttpResponse::Ok().json(proxies),
    Err(err) => HttpResponse::Ok().json(json!({"error": err.to_string()})),
  };

  Ok(response)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeleteProxyBody {
  id: String,
  proxy: config::Proxy,
}

#[delete("/api/proxy")]
pub async fn handle_delete_proxy(body: web::Json<DeleteProxyBody>) -> Result<impl Responder> {
  let body = body.into_inner();
  let result = config::delete_proxy(body.id, body.proxy);

  println!("--->{:?}", result);

  let response = match result {
    Ok(proxies) => HttpResponse::Ok().json(proxies),
    Err(err) => HttpResponse::Ok().json(json!({"error": err.to_string()})),
  };

  Ok(response)
}

#[post("/api/proxy-rules")]
pub async fn handle_set_proxy_rules(
  user_cfg: web::Json<config::UserConfig>,
) -> Result<impl Responder> {
  let result = config::update_user_config(user_cfg.0);
  Ok(web::Json(result))
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
    cursor: search.cursor.clone(),
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
    .service(handle_get_proxy)
    .service(handle_add_proxy)
    .service(handle_update_proxy)
    .service(handle_delete_proxy)
    .service(handle_search)
    .service(handle_get_stared)
    .service(handle_update_stared);
}
