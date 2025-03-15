#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

#[macro_use]
extern crate diesel;
extern crate diesel_migrations;
extern crate dotenv;

use actix_web::dev::ServerHandle;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use log::LevelFilter;
use tauri::{GlobalWindowEvent, Manager, State, WindowEvent, Wry};
use tauri_plugin_log::{fern, LogTarget};
use tokio;

mod cmd;
mod core;
mod db;
mod feed;
mod models;
mod schema;
mod server;

use std::{
  env,
  sync::{Mutex},
};

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

fn handle_window_event(event: GlobalWindowEvent<Wry>) {
  let window = event.window();
  // let app = window.app_handle();

  match event.event() {
    WindowEvent::CloseRequested { api, .. } => {
      let window = window.clone();

      window.hide().unwrap();
      api.prevent_close();
    }
    _ => {}
  }
}

// 全局状态
pub struct AppState {
  // app: Mutex<Option<AppHandle>>, // Tauri 的 AppHandle
  server: Mutex<Option<ServerHandle>>, // Actix Web 的 ServerHandle
}

impl AppState {
  fn new() -> Self {
      Self {
          // app: Mutex::new(None),
          server: Mutex::new(None)
      }
  }
}


#[tokio::main]
async fn main() {
  let user_config = core::config::UserConfig::init_config();
  let context = tauri::generate_context!();
  let mut connection = db::establish_connection();

  connection
    .run_pending_migrations(MIGRATIONS)
    .expect("Error migrating");

  let shared_state = AppState::new();

  let window = tauri::Builder::default();

  window
    .menu(core::menu::AppMenu::get_menu(&context))
    .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
      println!("{}, {argv:?}, {cwd}", app.package_info().name);

      // app.emit_all("single-instance", Payload { args: argv, cwd }).unwrap();
    }))
    .plugin(
      tauri_plugin_log::Builder::default()
        .targets([LogTarget::LogDir, LogTarget::Stdout])
        .with_colors(fern::colors::ColoredLevelConfig::default())
        .level(
          env::var("LETTURA_ENV")
            .map(|_env| LevelFilter::Debug)
            .unwrap_or(LevelFilter::Info),
        )
        .build(),
    )
    .setup(move |app| {
      app.manage(shared_state);
      let app_handle = app.handle().clone();

      let main_window = app.get_window("main").unwrap();

      match env::var("LETTURA_ENV") {
        Ok(_env) => {
          main_window.set_title("Lettura in developing").unwrap();
        }
        Err(_) => {}
      }

      // let state_clone = shared_state.clone();
      let port = user_config.port.clone();

      std::thread::spawn(move || {
        let state = app_handle.state::<AppState>();
        server::start_server(port, state).unwrap();
        main_window.emit("get_server_port", ()).unwrap();
      });

      feed::article::Article::purge_articles();

      Ok(())
    })
    .on_menu_event(core::menu::AppMenu::on_menu_event)
    .system_tray(core::tray::Tray::get_tray_menu())
    .on_system_tray_event(core::tray::Tray::on_system_tray_event)
    .on_window_event(handle_window_event)
    .invoke_handler(tauri::generate_handler![
      cmd::fetch_feed,
      cmd::add_feed,
      cmd::update_user_config,
      cmd::update_threads,
      cmd::update_theme,
      cmd::create_folder,
      cmd::delete_folder,
      cmd::update_folder,
      cmd::move_channel_into_folder,
      cmd::init_process,
      cmd::update_icon,
      cmd::get_server_port,
    ])
    .build(context)
    .expect("error while running tauri Application")
    .run(|_app_handle, event| match event {
      tauri::RunEvent::ExitRequested { api, .. } => {
        api.prevent_exit();
      }
      _ => {}
    });
}
