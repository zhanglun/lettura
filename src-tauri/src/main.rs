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
use tauri::{GlobalWindowEvent, WindowEvent, Wry};
use tokio::{self, sync::mpsc, time};

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
use once_cell::sync::Lazy;
use tokio::sync::Mutex;

static CHANNEL: Lazy<
  Mutex<(
    mpsc::Sender<AsyncProcessMessage>,
    mpsc::Receiver<AsyncProcessMessage>,
  )>,
> = Lazy::new(|| Mutex::new(mpsc::channel::<AsyncProcessMessage>(32)));

#[tokio::main]
async fn main() {
  core::config::UserConfig::init_config();

  let context = tauri::generate_context!();
  let mut connection = db::establish_connection();

  connection
    .run_pending_migrations(MIGRATIONS)
    .expect("Error migrating");

  let (async_process_input_tx, mut async_process_input_rx) =
    mpsc::channel::<AsyncProcessMessage>(32);
  let tx = async_process_input_tx.clone();

  tauri::async_runtime::spawn(async move {
    loop {
      if let Some(message) = async_process_input_rx.recv().await {
        println!("output: {:?}", message);

        match message {
          AsyncProcessMessage::TurnOffAutoUpdateFeed => {
            println!("init output start 2 {:?}", message);
          }
          AsyncProcessMessage::TurnOnAutoUpdateFeed => {
            println!("init output stop 2 {:?}", message);
          }
        }
      }
    }
  });

  fn get_now_timestamp() -> i64 {
    Utc::now().timestamp()
  }

  tauri::async_runtime::spawn(async move {
    let update_interval = core::config::get_user_config().unwrap().update_interval;
    let mut interval = time::interval(time::Duration::from_secs(update_interval));

    println!("interval {:?}", interval);

    let mut last_time = get_now_timestamp();

    loop {
      let now = get_now_timestamp();

      print!("WAITTING!\n");

      interval.tick().await;

      let mut cfg = core::config::get_user_config().unwrap();
      print!("Prepared!\n");
    }
  });

  tauri::Builder::default()
    .manage(AsyncProcInputTx {
      sender: Mutex::new(async_process_input_tx),
    })
    .menu(core::menu::AppMenu::get_menu(&context))
    .setup(move |app| Ok(()))
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

  // // 在当前线程中接收消息
  // let received_msg = channe.recv().unwrap();
  // println!("Received message: {}", received_msg);

  // // 获取当前线程的 ID
  // let thread_id = thread::current().id();
  // println!("Receiver thread ID: {:?}", thread_id);
  // if thread_id == current_thread_id {
  //     println!("Sender and receiver are in the same thread");
  // } else {
  //     println!("Sender and receiver are in different threads");
  // }
}
