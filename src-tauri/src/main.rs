#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

#[macro_use]
extern crate diesel;
extern crate diesel_migrations;
extern crate dotenv;

use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use tauri::{Manager, CustomMenuItem, Menu, MenuItem, Submenu};

pub mod cmd;
pub mod config;
pub mod db;
pub mod feed;
pub mod folder;
pub mod models;
pub mod schema;
pub mod scraper;

pub fn get_menu() -> Menu {
  #[allow(unused_mut)]
  let mut disable_item =
    CustomMenuItem::new("disable-menu", "Disable menu").accelerator("CmdOrControl+D");
  #[allow(unused_mut)]
  let mut test_item = CustomMenuItem::new("test", "Test").accelerator("CmdOrControl+T");
  #[cfg(target_os = "macos")]
  {
    disable_item = disable_item.native_image(tauri::NativeImage::MenuOnState);
    test_item = test_item.native_image(tauri::NativeImage::Add);
  }

  let test_menu = Menu::new()
    .add_item(CustomMenuItem::new(
      "selected/disabled",
      "Selected and disabled",
    ))
    .add_native_item(MenuItem::Separator)
    .add_native_item(MenuItem::Quit)
    .add_item(test_item)
    .add_item(disable_item);

  let edit_menu = Menu::new()
    .add_native_item(MenuItem::SelectAll)
    .add_native_item(MenuItem::Copy)
    .add_native_item(MenuItem::Paste)
    .add_native_item(MenuItem::Separator)
    .add_native_item(MenuItem::EnterFullScreen);

  let window_menu = Menu::new().add_native_item(MenuItem::Hide);

  // add all our childs to the menu (order is how they'll appear)
  Menu::new()
    .add_submenu(Submenu::new("Other menu 2", test_menu))
    .add_submenu(Submenu::new("Edit", edit_menu))
    .add_submenu(Submenu::new("Window", window_menu))
}

use std::env;
use std::fs;
use std::path;

pub fn init_app_config_path() {
  let home_dir = tauri::api::path::home_dir();
  match home_dir {
    Some(home_dir) => {
      let app_config = path::Path::new(&home_dir);
      let app_config = app_config.join(".lettura");

      println!("{:?}", app_config);
      fs::create_dir_all(app_config);
    }
    None => {
      println!("no ")
    }
  }

  println!("{:?}", env::current_dir());
  println!("{:?}", env::current_exe());
}

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

// the payload type must implement `Serialize` and `Clone`.
#[derive(Clone, serde::Serialize)]
struct Payload {
  message: String,
}

fn main() {
  init_app_config_path();

  let context = tauri::generate_context!();
  let mut connection = db::establish_connection();

  connection
    .run_pending_migrations(MIGRATIONS)
    .expect("Error migrating");

  tauri::Builder::default()
    .menu(tauri::Menu::os_default(&context.package_info().name))
    .setup(|app| {
      // `main` here is the window label; it is defined on the window creation or under `tauri.conf.json`
      // the default value is `main`. note that it must be unique
      let main_window = app.get_window("main").unwrap();

      // listen to the `event-name` (emitted on the `main` window)
      let id = main_window.listen("event-name", |event| {
        println!("got window event-name with payload {:?}", event.payload());
      });
      // unlisten to the event using the `id` returned on the `listen` function
      // an `once` API is also exposed on the `Window` struct

      // emit the `event-name` event to the `main` window
      main_window
        .emit(
          "event-name",
          Payload {
            message: "Tauri is awesome!".into(),
          },
        )
        .unwrap();
      Ok(())
    })
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
    ])
    .run(context)
    .expect("error while running tauri Application");
}
