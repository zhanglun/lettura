#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

#[macro_use]
extern crate diesel;
extern crate diesel_migrations;
extern crate dotenv;

use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use tauri::http::ResponseBuilder;
use tauri::{GlobalWindowEvent, Manager, WindowEvent, Wry};
use tokio::sync::mpsc;

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

fn handle_window_event(event: GlobalWindowEvent<Wry>) {
  let window = event.window();
  let app = window.app_handle();

  match event.event() {
    WindowEvent::CloseRequested { api, .. } => {
      let window = window.clone();

      window.hide().unwrap();
      api.prevent_close();
    }
    _ => {}
  }
}

#[tokio::main]
async fn main() {
  core::config::UserConfig::init_config();

  let context = tauri::generate_context!();
  let mut connection = db::establish_connection();

  connection
    .run_pending_migrations(MIGRATIONS)
    .expect("Error migrating");

  let (async_process_ix, async_process_rx) = mpsc::channel::<String>(32);

  tauri::Builder::default()
    .menu(core::menu::AppMenu::get_menu(&context))
    .setup(|app| {
      // core::scheduler::Scheduler.init(async_process_rx);
      Ok(())
    })
    .on_menu_event(core::menu::AppMenu::on_menu_event)
    .system_tray(core::tray::Tray::get_tray_menu())
    .on_system_tray_event(core::tray::Tray::on_system_tray_event)
    .on_window_event(handle_window_event)
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
      cmd::update_theme,
      cmd::create_folder,
      cmd::delete_folder,
      cmd::get_folders,
      cmd::move_channel_into_folder,
      cmd::init_process,
      cmd::get_web_source,
    ])
    .register_uri_scheme_protocol("lettura", move |app, request| {
      let res_not_img = ResponseBuilder::new().status(404).body(Vec::new());
      if request.method() != "GET" {
        return res_not_img;
      }
      let uri = request.uri();
      // let start_pos = match uri.find("?n=") {
      //   Some(_pos) => _pos + 3,
      //   None => return res_not_img,
      // };
      // let end_pos = match uri.find("&") {
      //   Some(_pos) => _pos,
      //   None => return res_not_img,
      // };
      // let entry_num: usize = match &uri[start_pos..end_pos].parse() {
      //   Ok(_i) => *_i,
      //   Err(_) => return res_not_img,
      // };
      // let dir_entries: State<DirEntries> = app.state();
      // let v_dirs = &*dir_entries.0.lock().unwrap();
      // let target_file = match v_dirs.get(entry_num) {
      //   Some(_dir) => &v_dirs[entry_num],
      //   None => return res_not_img,
      // };
      // let extension = match target_file.extension() {
      //   Some(_ex) => _ex.to_string_lossy().to_string(),
      //   None => return res_not_img,
      // };
      // if !is_img_extension(&extension) {
      //   return res_not_img;
      // }
      // println!("🚩Request: {} / {:?}", entry_num, target_file);
      // let local_img = if let Ok(data) = read(target_file) {
      //   tauri::http::ResponseBuilder::new()
      //     .mimetype(format!("image/{}", &extension).as_str())
      //     .body(data)
      // } else {
      //   res_not_img
      // };
      // local_img
      tauri::http::ResponseBuilder::new()
        .mimetype(format!("application/{}", "json").as_str())
        .header("Access-Control-Allow-Origin", "*")
        .header("Access-Control-Request-Method: POST", "GET, POST")
        .body(vec![111])
    })
    .build(context)
    .expect("error while running tauri Application")
    .run(|_app_handle, event| match event {
      tauri::RunEvent::ExitRequested { api, .. } => {
        api.prevent_exit();
      }
      _ => {}
    });
}
