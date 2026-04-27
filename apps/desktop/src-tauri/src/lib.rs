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
use tauri::{Emitter, Manager};
use tauri_plugin_log::{Target, TargetKind};
use std::{env, sync::Mutex};

mod cmd;
mod core;
mod db;
mod feed;
mod models;
mod schema;
mod server;
mod sources;
mod ai;

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

// 全局状态
pub struct AppState {
  server: Mutex<Option<ServerHandle>>,
}

impl AppState {
  fn new() -> Self {
    Self {
      server: Mutex::new(None),
    }
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let user_config = core::config::UserConfig::init_config();
  let mut connection = db::establish_connection();

  connection
    .run_pending_migrations(MIGRATIONS)
    .expect("Error migrating");

  let shared_state = AppState::new();

  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_log::Builder::new().targets([
      Target::new(TargetKind::LogDir { file_name: None }),
      Target::new(TargetKind::Stdout),
    ]).build())
    .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
      let _ = app
        .get_webview_window("main")
        .expect("no main window")
        .set_focus();
    }))
    .manage(shared_state)
    .setup(move |app| {
      let app_handle = app.handle().clone();
      let main_window = app.get_webview_window("main").unwrap();

      match env::var("LETTURA_ENV") {
        Ok(_env) => {
          main_window.set_title("Lettura in developing").unwrap();
        }
        Err(_) => {}
      }

      let port = user_config.port.clone();

      // 启动 Actix 服务器
      std::thread::spawn(move || {
        let state = app_handle.state::<AppState>();
        server::start_server(port, state).unwrap();
        main_window.emit("get_server_port", ()).unwrap();
      });

      // 设置托盘
      core::tray::setup_tray(app)?;
      // 设置菜单
      core::menu::setup_menu(app)?;

      feed::article::Article::purge_articles();

      ai::pipeline::start_pipeline_timer(app.handle().clone());

      Ok(())
    })
    .on_window_event(|window, event| {
      if let tauri::WindowEvent::CloseRequested { api, .. } = event {
        window.hide().unwrap();
        api.prevent_close();
      }
    })
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
      cmd::export_opml,
      cmd::import_opml,
      cmd::get_starter_packs,
      cmd::preview_pack,
      cmd::install_pack,
      cmd::import_opml_as_source,
      cmd::get_today_signals,
      cmd::get_signal_detail,
      cmd::get_dedup_stats,
      cmd::get_ai_config,
      cmd::save_ai_config,
      cmd::validate_ai_config,
      cmd::trigger_pipeline,
      cmd::submit_feedback,
      cmd::get_feedback_history,
      core::scheduler::start_scheduler,
      core::scheduler::stop_scheduler,
      core::scheduler::is_scheduler_running,
    ])
    .build(tauri::generate_context!())
    .expect("error while running tauri Application")
    .run(|_app_handle, event| match event {
      tauri::RunEvent::ExitRequested { api, .. } => {
        api.prevent_exit();
      }
      _ => {}
    });
}
