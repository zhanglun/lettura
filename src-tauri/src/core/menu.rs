use std::env;
use tauri::{utils::assets::EmbeddedAssets};
use tauri::{AboutMetadata, CustomMenuItem, Menu, MenuItem, Submenu, Context, WindowMenuEvent};
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
          .add_native_item(MenuItem::About(name.into(), AboutMetadata::new()))
          .add_native_item(MenuItem::Separator)
          .add_item(CustomMenuItem::new("settings".to_string(), "Settings...").accelerator("CmdOrControl+,"))
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
      "settings" => {
        println!("gotosetting");
        event.window().emit("go-to-settings", "").unwrap();
      }
      _ => {}
    }
  }
}
