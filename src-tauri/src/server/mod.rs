mod handlers;

use actix_cors::Cors;
use actix_web::{http, middleware, web, App, HttpServer};
use std::sync::Mutex;

use crate::{core::config, AppState};
use std::net::TcpListener;

// 检测端口是否可用
fn is_port_available(port: u16) -> bool {
  TcpListener::bind(("127.0.0.1", port)).is_ok()
}

// 动态选择端口
fn find_available_port(start: u16, end: u16) -> Option<u16> {
  (start..=end).find(|&port| is_port_available(port))
}

#[actix_web::main]
pub async fn start_server(port: u16, state: tauri::State<'_, AppState>) -> std::io::Result<()> {
  let port = if is_port_available(port) {
    port
  } else {
    find_available_port(8000, 9000).expect("No available ports")
  };

  config::update_port(port);

  let server = HttpServer::new(move || {
    let cors = Cors::default()
      .allow_any_origin()
      .allow_any_method()
      .allowed_headers(vec![http::header::AUTHORIZATION, http::header::ACCEPT])
      .allowed_header(http::header::CONTENT_TYPE)
      .max_age(3600);

    App::new()
      .wrap(cors)
      // .app_data(tauri_app.clone())
      .wrap(middleware::Logger::default())
      .configure(handlers::common::config)
      .configure(handlers::article::config)
      .configure(handlers::feed::config)
      .configure(handlers::folder::config)
  })
  .bind(("127.0.0.1", port))?
  .run();

  let mut state = state.server.lock().unwrap();
  *state = Some(server.handle());

  log::debug!("actix_web server start with port: {:?}!", port);

  server.await
}

pub fn stop_server(state: tauri::State<'_, AppState>) {
  // 停止当前的服务器
  if let Some(server) = state.server.lock().unwrap().take() {
    server.stop(true);
    println!("Server stopped.");
  }
}
