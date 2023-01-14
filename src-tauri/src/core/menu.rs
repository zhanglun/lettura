use tauri::{utils::assets::EmbeddedAssets};
use tauri::{AboutMetadata, CustomMenuItem, Menu, MenuItem, Submenu, Context};
pub struct AppMenu {

}

impl AppMenu {
  pub fn get_menu(context: &Context<EmbeddedAssets>) -> Menu {
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

    let name = &context.package_info().name;

    let app_menu = Submenu::new(
        "",
        Menu::new()
          .add_native_item(MenuItem::About(name.into(), AboutMetadata::new()))
          .add_native_item(MenuItem::Separator)
          .add_native_item(MenuItem::Hide)
          .add_native_item(MenuItem::HideOthers)
          .add_native_item(MenuItem::Separator)
          .add_item(CustomMenuItem::new("quit".to_string(), "Quit Lettura"))
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
}
