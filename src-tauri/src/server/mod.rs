mod handlers;

use actix_cors::Cors;
use actix_web::{http, middleware, web, App, HttpServer};
use std::sync::Mutex;
use tauri::AppHandle;

struct TauriAppState {
  app: Mutex<AppHandle>,
}

#[actix_web::main]
pub async fn init(app: AppHandle) -> std::io::Result<()> {
  let tauri_app = web::Data::new(TauriAppState {
    app: Mutex::new(app),
  });
  log::debug!("actix_web server start!");
  HttpServer::new(move || {
    let cors = Cors::default()
      .allow_any_origin()
      .allow_any_method()
      .allowed_headers(vec![http::header::AUTHORIZATION, http::header::ACCEPT])
      .allowed_header(http::header::CONTENT_TYPE)
      .max_age(3600);

    App::new()
      .wrap(cors)
      .app_data(tauri_app.clone())
      .wrap(middleware::Logger::default())
      .configure(handlers::common::config)
      .configure(handlers::article::config)
      .configure(handlers::feed::config)
      .configure(handlers::folder::config)
  })
  .bind(("127.0.0.1", 1105))?
  .run()
  .await
}
