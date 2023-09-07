use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder, Result};

use serde::Serialize;

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

// #[get("/api/hello")]
// pub async fn handle_hello(req_body: String) -> impl Responder> {
//   let text = "hello world";
//   HttpResponse::Ok().body(req_body)
// }
