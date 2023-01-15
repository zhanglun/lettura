#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

#[macro_use]
extern crate diesel;
extern crate diesel_migrations;
extern crate dotenv;

use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

mod cmd;
mod core;
mod db;
mod feed;
mod models;
mod schema;

use std::env;

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

// the payload type must implement `Serialize` and `Clone`.
#[derive(Clone, serde::Serialize)]
struct Payload {
  message: String,
}

fn main() {
  core::config::UserConfig::init_config();

  let context = tauri::generate_context!();
  let mut connection = db::establish_connection();

  connection
    .run_pending_migrations(MIGRATIONS)
    .expect("Error migrating");

  tauri::Builder::default()
    .menu(core::menu::AppMenu::get_menu(&context))
    .on_menu_event(core::menu::AppMenu::on_menu_event)
    .system_tray(core::tray::Tray::get_tray_menu())
    .on_system_tray_event(core::tray::Tray::on_system_tray_event)
    .invoke_handler(tauri::generate_handler![
      cmd::fetch_feed,
      cmd::get_feeds,
      cmd::get_channels,
      cmd::add_channel,
      cmd::delete_channel,
      cmd::update_feed_sort,
      cmd::get_articles,
      cmd::sync_articles_with_channel_uuid,
      cmd::import_channels,
      cmd::get_unread_total,
      cmd::update_article_read_status,
      cmd::mark_all_read,
      cmd::get_user_config,
      cmd::update_user_config,
      cmd::update_proxy,
      cmd::update_threads,
      cmd::create_folder,
      cmd::delete_folder,
      cmd::get_folders,
      cmd::move_channel_into_folder,
      cmd::init_process,
      cmd::get_web_source,
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
