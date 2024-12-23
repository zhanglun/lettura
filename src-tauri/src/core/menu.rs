use std::env;
use tauri::utils::assets::EmbeddedAssets;
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu, Context, WindowMenuEvent};
use serde_json::json;
use sys_info;

pub struct AppMenu {

}

impl AppMenu {
  pub fn get_menu(context: &Context<EmbeddedAssets>) -> Menu {
    #[allow(unused_mut)]
    let mut disable_item =
      CustomMenuItem::new("disable-menu", "Disable menu").accelerator("CmdOrControl+D");
    #[cfg(target_os = "macos")]
    {
      disable_item = disable_item.native_image(tauri::NativeImage::MenuOnState);
    }

    let _env = env::var("LETTURA_ENV");
    let name = match _env {
      Ok(_env) => {
        String::from("Lettura dev")
      }
      Err(_) => {
        context.package_info().name.clone()
      }
    };

    let app_menu = Submenu::new(
        "",
        Menu::new()
          // .add_native_item(MenuItem::About(name.into(), AboutMetadata::new()))
          .add_item(CustomMenuItem::new("about".to_string(), format!("About {}", name)))
          .add_native_item(MenuItem::Separator)
          .add_item(CustomMenuItem::new("settings".to_string(), "Settings...").accelerator("CmdOrControl+,"))
          .add_item(CustomMenuItem::new("check_for_updates".to_string(), "Check for Updates"))
          .add_native_item(MenuItem::Separator)
          .add_native_item(MenuItem::Hide)
          .add_native_item(MenuItem::HideOthers)
          .add_native_item(MenuItem::Separator)
          .add_item(CustomMenuItem::new("quit".to_string(), "Quit Lettura").accelerator("CmdOrControl+Q"))
    );

    let file_menu = Submenu::new(
        "File",
        Menu::new()
            .add_item(CustomMenuItem::new("new_feed".to_string(), "New Feed"))
            .add_item(CustomMenuItem::new("new_folder".to_string(), "New Folder")),
    );

    let edit_menu = Submenu::new(
        "Edit",
        Menu::new()
            .add_native_item(MenuItem::Copy)
            .add_native_item(MenuItem::Paste)
            .add_native_item(MenuItem::Cut)
            .add_native_item(MenuItem::SelectAll)
            .add_item(CustomMenuItem::new("undo".to_string(), "Undo"))
            .add_item(CustomMenuItem::new("redo".to_string(), "Redo")),
    );

    let window_menu = Submenu::new (
      "Window",
      Menu::new()
        .add_native_item(MenuItem::Minimize)
        .add_native_item(MenuItem::Zoom)
        .add_native_item(MenuItem::CloseWindow)
        .add_native_item(MenuItem::EnterFullScreen)
    );

    Menu::new()
      .add_submenu(app_menu)
      .add_submenu(file_menu)
      .add_submenu(edit_menu)
      .add_submenu(window_menu)
  }

  pub fn on_menu_event(event: WindowMenuEvent) {
    match event.menu_item_id() {
      "quit" => {
        std::process::exit(0);
      }
      "close" => {
        event.window().close().unwrap();
      }

      "about" => {
        use std::process::Command;
        use tauri::Manager;

        let app_handle = event.window().app_handle();
        let package_info = app_handle.package_info();
        let name = package_info.name.clone();
        let version = package_info.version.clone();

        let tauri_version = env!("CARGO_PKG_VERSION").to_string();

        let react_version = Command::new("node")
            .args(["-p", "require('react/package.json').version"])
            .output()
            .expect("Failed to get React version")
            .stdout;
        let react_version = String::from_utf8_lossy(&react_version).trim().to_string();

        let os = match sys_info::os_release() {
            Ok(version) => format!("{} {}", std::env::consts::OS, version),
            Err(_) => std::env::consts::OS.to_string(),
        };

        let node_version = Command::new("node")
            .args(["-v"])
            .output()
            .expect("Failed to get Node version")
            .stdout;
        let node_version = String::from_utf8_lossy(&node_version).trim().to_string();

        let rust_version = Command::new("rustc")
            .args(["--version"])
            .output()
            .expect("Failed to get Rust version")
            .stdout;
        let rust_version = String::from_utf8_lossy(&rust_version).trim().to_string();

        let metadata = json!({
            "name": name,
            "version": version,
            "tauri": tauri_version,
            "react": react_version,
            "OS": os,
            "node": node_version,
            "rust": rust_version,
        }).to_string();

        // Emit the metadata
        event.window().emit("about_lettura", metadata).unwrap();
      }
      "check_for_updates" => {
        event.window().emit("check_for_updates", "").unwrap();
      }
      "settings" => {
        println!("gotosetting");
        event.window().emit("go_to_settings", "").unwrap();
      }
      _ => {}
    }
  }
}
