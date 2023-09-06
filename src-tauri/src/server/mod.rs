mod handlers;

use std::{sync::Mutex};

use actix_web::{middleware, web, App, HttpServer};
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
    App::new()
      .app_data(tauri_app.clone())
      .wrap(middleware::Logger::default())
      .service(handlers::home::handle_test)
      .service(handlers::home::handle_hello)
  })
    .bind(("127.0.0.1", 1105))?
    .run()
    .await
}
