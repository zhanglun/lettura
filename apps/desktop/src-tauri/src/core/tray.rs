use tauri::{
  image::Image,
  menu::{MenuBuilder, MenuItemBuilder},
  tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
  App, Manager, Runtime,
};

#[cfg(target_os = "macos")]
const TRAY_ICON_BYTES: &[u8] = include_bytes!("../../icons/tray-mac.png");

#[cfg(target_os = "windows")]
const TRAY_ICON_BYTES: &[u8] = include_bytes!("../../icons/icon.ico");

#[cfg(target_os = "linux")]
const TRAY_ICON_BYTES: &[u8] = include_bytes!("../../icons/32x32.png");

pub fn setup_tray<R: Runtime>(app: &App<R>) -> tauri::Result<()> {
  let open_window = MenuItemBuilder::with_id("open_window", "Open Lettura").build(app)?;
  let hide_window = MenuItemBuilder::with_id("hide_window", "Hide Window").build(app)?;
  let restart_app = MenuItemBuilder::with_id("restart_app", "Restart").build(app)?;
  let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

  let tray_menu = MenuBuilder::new(app)
    .item(&open_window)
    .item(&hide_window)
    .separator()
    .item(&restart_app)
    .separator()
    .item(&quit)
    .build()?;

  let tray_icon = Image::from_bytes(TRAY_ICON_BYTES)
    .expect("Failed to load tray icon");

  TrayIconBuilder::new()
    .icon(tray_icon)
    .icon_as_template(cfg!(target_os = "macos"))
    .menu(&tray_menu)
    .on_menu_event(|app, event| match event.id().as_ref() {
      "open_window" => {
        if let Some(window) = app.get_webview_window("main") {
          window.show().unwrap();
          window.set_focus().unwrap();
        }
      }
      "hide_window" => {
        if let Some(window) = app.get_webview_window("main") {
          window.hide().unwrap();
        }
      }
      "restart_app" => {
        app.request_restart();
      }
      "quit" => {
        app.exit(0);
      }
      _ => {}
    })
    .on_tray_icon_event(|tray, event| {
      if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
      } = event
      {
        let app = tray.app_handle();
        if let Some(window) = app.get_webview_window("main") {
          window.show().unwrap();
          window.set_focus().unwrap();
        }
      }
    })
    .build(app)?;

  Ok(())
}
