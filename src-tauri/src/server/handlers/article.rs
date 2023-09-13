use actix_web::{get, post, web, App, HttpRequest, HttpResponse, HttpServer, Responder, Result};
use serde::{Deserialize, Serialize};

use crate::feed;

#[derive(Serialize)]
struct MyObj {
  name: String,
}

#[get("/api/articles/{name}")]
pub async fn handle_test(name: web::Path<String>) -> Result<impl Responder> {
  let obj = MyObj {
    name: name.to_string(),
  };

  Ok(web::Json(obj))
}

#[get("/api/collection-metas")]
pub async fn handle_collection_metas() -> Result<impl Responder> {
  let obj = feed::article::Article::get_collection_metas();

  Ok(web::Json(obj))
}

#[post("/api/mark-all-as-read")]
pub async fn handle_mark_as_read(
  body: web::Json<feed::article::MarkAllUnreadParam>,
) -> Result<impl Responder> {
  let res = feed::article::Article::mark_as_read(feed::article::MarkAllUnreadParam{
    uuid: body.uuid.clone(),
    is_today: body.is_today,
    is_all: body.is_all
   });

  println!("{:?}", body);

  Ok(web::Json(res))
}

#[get("/api/articles")]
pub async fn handle_articles(
  query: web::Query<feed::article::ArticleFilter>,
) -> Result<impl Responder> {
  println!("{:?}", query);

  let obj = feed::article::ArticleFilter {
    channel_uuid: query.channel_uuid.clone(),
    read_status: query.read_status.clone(),
    cursor: query.cursor.clone(),
    limit: query.limit.clone(),
  };

  let res = feed::article::Article::get_article(obj);

  Ok(web::Json(res))
}

#[get("/api/articles/today")]
pub async fn handle_today_articles() -> Result<impl Responder> {
  let obj = MyObj {
    name: "hahah".to_string(),
  };

  Ok(web::Json(obj))
}

pub fn config(cfg: &mut web::ServiceConfig) {
  cfg
    .service(handle_test)
    .service(handle_collection_metas)
    .service(handle_mark_as_read)
    .service(handle_articles);
}
