use tauri::{api, AppHandle, CustomMenuItem, Manager};
use tauri::{SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem, SystemTraySubmenu};

pub struct Tray {}

impl Tray {
  pub fn get_tray_menu() -> SystemTray {
    let menu = SystemTrayMenu::new()
      .add_item(CustomMenuItem::new("open_window", "Open Lettura"))
      .add_item(CustomMenuItem::new("hide_window", "Hide Lettura"))
      .add_native_item(SystemTrayMenuItem::Separator)
      .add_submenu(SystemTraySubmenu::new(
        "More",
        SystemTrayMenu::new()
          .add_item(CustomMenuItem::new("restart_app", "Restart Lettura"))
      ))
      .add_native_item(SystemTrayMenuItem::Separator)
      .add_item(CustomMenuItem::new("quit", "Quit").accelerator("CmdOrControl+Q"));

    SystemTray::new().with_menu(menu)
  }

  pub fn on_system_tray_event(app_handle: &AppHandle, event: SystemTrayEvent) {
    match event {
      SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
        "open_window" => {
          let window = app_handle.get_window("main").unwrap();

          window.show().unwrap();
          window.set_focus().unwrap();
        },
        "hide_window" => {
          let window = app_handle.get_window("main").unwrap();

          window.hide().unwrap();
        },
        "restart_app" => api::process::restart(&app_handle.env()),
        "quit" => {
          app_handle.exit(0);
          std::process::exit(0);
        }
        _ => {}
      },

      #[cfg(target_os = "windows")]
      SystemTrayEvent::LeftClick { .. } => {
        println!("system tray received a left click");
        let window = app_handle.get_window("main").unwrap();
        if window.is_visible().unwrap() {
          window.hide().unwrap()
        } else {
          window.show().unwrap()
        }
        // resolve::create_window(app_handle);
      }
      _ => {}
    }
  }
}
