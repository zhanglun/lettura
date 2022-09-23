#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

extern crate app;

use self::app::*;
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};

#[tauri::command]
async fn fetch_feed(url: String) -> String {
  let res = fetch_rss_item(&url).await;
  let res = match res {
    Ok(data) => data,
    Err(error) => error.to_string(),
  };

  res
}

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

  let window_menu = Menu::new()
    .add_native_item(MenuItem::Hide);

  // add all our childs to the menu (order is how they'll appear)
  Menu::new()
    // .add_submenu(Submenu::new("My app", my_app_menu))
    .add_submenu(Submenu::new("Other menu 2", test_menu))
    .add_submenu(Submenu::new("Edit", edit_menu))
    .add_submenu(Submenu::new("Window", window_menu))
}

fn main() {
  let context = tauri::generate_context!();
  tauri::Builder::default()
//     .menu(get_menu())
    .menu(tauri::Menu::os_default(&context.package_info().name))
    .invoke_handler(tauri::generate_handler![
      fetch_feed,
    ])
    .run(context)
    .expect("error while running tauri  Application");
}
