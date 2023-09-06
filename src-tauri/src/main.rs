#![cfg_attr(
all(not(debug_assertions), target_os = "windows"),
windows_subsystem = "windows"
)]

#[macro_use]
extern crate diesel;
extern crate diesel_migrations;
extern crate dotenv;

use chrono::offset::Utc;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use serde::{Deserialize, Serialize};
use tauri::{App, AppHandle, GlobalWindowEvent, Manager, WindowEvent, Wry};
use tokio::{self, sync::mpsc, time};
use tauri_plugin_log::{LogTarget, fern};

mod cmd;
mod core;
mod db;
mod feed;
mod models;
mod schema;

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

#[derive(Debug, Serialize, Deserialize)]
pub enum AsyncProcessMessage {
  TurnOnAutoUpdateFeed,
  TurnOffAutoUpdateFeed,
}

use crate::cmd::AsyncProcInputTx;
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


fn after_setup<'a>(app_handle: &'a AppHandle, mut rx: mpsc::Receiver<AsyncProcessMessage>) {
  // fn create_interval_task<'a>(app_handle: &'a AppHandle) -> tauri::async_runtime::JoinHandle<()> {
  //   let interval_task = tauri::async_runtime::spawn(async {
  //     let update_interval = core::config::get_user_config().unwrap().update_interval;
  //     let mut interval = time::interval(time::Duration::from_secs(update_interval));

  //     println!("interval {:?}", update_interval);

  //     loop {
  //       print!("WAITTING!\n");

  //       interval.tick().await;

  //       let mut cfg = core::config::get_user_config().unwrap();

  //       if cfg.update_interval > 0 {
  //         send_to_webview("start-auto-async".to_string(), "".to_string(), app_handle);
  //       }

  //       print!("Prepared!\n");
  //     }
  //   });

  //   return interval_task;
  // }

  // let mut interval_task = create_interval_task(&app_handle);
  // tauri::async_runtime::spawn(async move {
  //   loop {
  //     if let Some(message) = rx.recv().await {
  //       println!("output: {:?}", message);

  //       match message {
  //         AsyncProcessMessage::TurnOffAutoUpdateFeed => {
  //           println!("init output start 2 {:?}", message);
  //           interval_task.abort();
  //         }
  //         AsyncProcessMessage::TurnOnAutoUpdateFeed => {
  //           println!("init output stop 2 {:?}", message);
  //           interval_task = create_interval_task(&app_handle);
  //         }
  //       }
  //     }
  //   }
  // });

  fn get_now_timestamp() -> i64 {
    Utc::now().timestamp()
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

  let (async_process_input_tx, async_process_input_rx) = mpsc::channel::<AsyncProcessMessage>(32);

  let window = tauri::Builder::default();

  window.manage(AsyncProcInputTx {
    sender: Mutex::new(async_process_input_tx),
  })
    .menu(core::menu::AppMenu::get_menu(&context))
    .plugin(tauri_plugin_log::Builder::default()
      .targets([
        LogTarget::LogDir,
        LogTarget::Stdout,
        LogTarget::Webview,
      ])
      .with_colors(fern::colors::ColoredLevelConfig::default())
      .build())
    .setup(move |app| {
      let app_handle = app.handle();

      let main_window = app.get_window("main").unwrap();

      let _env = env::var("LETTURA_ENV");

      match _env {
        Ok(env) => {
          main_window.set_title("Lettura dev").unwrap();
        }
        Err(_) => {}
      }

      after_setup(&app_handle, async_process_input_rx);
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
      cmd::add_feed,
      cmd::delete_feed,
      cmd::update_feed_sort,
      cmd::get_articles,
      cmd::get_today_articles,
      cmd::get_all_articles,
      cmd::get_collection_metas,
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
      cmd::update_interval,
      cmd::create_folder,
      cmd::delete_folder,
      cmd::update_folder,
      cmd::get_folders,
      cmd::move_channel_into_folder,
      cmd::init_process,
      cmd::get_article_detail,
      cmd::update_icon,
      cmd::get_web_best_image,
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
