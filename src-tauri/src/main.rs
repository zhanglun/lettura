#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

#[macro_use]
extern crate diesel;
extern crate diesel_migrations;
extern crate dotenv;

use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use log::LevelFilter;
use tauri::{GlobalWindowEvent, Manager, WindowEvent, Wry};
use tauri_plugin_log::{fern, LogTarget};
use tokio;

mod cmd;
mod core;
mod db;
mod feed;
mod models;
mod schema;
mod server;

use std::env;

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

use tokio::sync::Mutex;

fn send_to_webview<R: tauri::Runtime>(
  event_name: String,
  message: String,
  manager: &impl Manager<R>,
) {
  println!("Event Name {:?}", event_name);

  manager
    .emit_all(&event_name, format!("rs: {}", message))
    .unwrap();
}

#[tokio::main]
async fn main() {
  core::config::UserConfig::init_config();

  let context = tauri::generate_context!();
  let mut connection = db::establish_connection();

  connection
    .run_pending_migrations(MIGRATIONS)
    .expect("Error migrating");

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
      let app_handle = app.handle();

      let main_window = app.get_window("main").unwrap();

      match env::var("LETTURA_ENV") {
        Ok(_env) => {
          main_window.set_title("Lettura dev").unwrap();
        }
        Err(_) => {}
      }

      let boxed_handle = Box::new(app_handle);

      std::thread::spawn(move || {
        server::init(*boxed_handle).unwrap();
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
      cmd::update_proxy,
      cmd::update_threads,
      cmd::update_theme,
      cmd::create_folder,
      cmd::delete_folder,
      cmd::update_folder,
      cmd::get_folders,
      cmd::move_channel_into_folder,
      cmd::init_process,
      cmd::update_icon,
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
