use actix_web::{get, post, web, App, HttpResponse, HttpRequest, HttpServer, Responder, Result};
use serde::{Serialize, Deserialize};
use log;

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

#[get("/api/articles")]
pub async fn handle_articles(req: HttpRequest, query: web::Query<feed::article::ArticleFilter>) -> Result<impl Responder> {
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
    name: "hahah".to_string()
  };

  Ok(web::Json(obj))
}


pub fn config(cfg: &mut web::ServiceConfig) {
  cfg.service(handle_test)
    .service(handle_articles);
}
