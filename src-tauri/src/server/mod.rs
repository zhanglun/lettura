mod handlers;

use actix_cors::Cors;
use std::{sync::Mutex};

use actix_web::{middleware, web, http, App, HttpServer};
use tauri::AppHandle;

struct TauriAppState {
  app: Mutex<AppHandle>,
}

#[actix_web::main]
pub async fn init(app: AppHandle) -> std::io::Result<()> {
  let tauri_app = web::Data::new(TauriAppState {
    app: Mutex::new(app),
  });

  println!("start initial server");

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
      .configure(handlers::article::config)
  })
    .bind(("127.0.0.1", 1105))?
    .run()
    .await
}
