use serde_json::json;
use std::env;
use std::process::Command;
use sys_info;
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    App, Emitter, Runtime,
};

pub fn setup_menu<R: Runtime>(app: &App<R>) -> tauri::Result<()> {
    let _env = env::var("LETTURA_ENV");
    let name = match _env {
        Ok(_env) => String::from("Lettura dev"),
        Err(_) => app.package_info().name.clone(),
    };

    let about = MenuItemBuilder::with_id("about", format!("About {}", name)).build(app)?;
    let settings = MenuItemBuilder::with_id("settings", "Settings...").accelerator("CmdOrControl+,").build(app)?;
    let check_updates = MenuItemBuilder::with_id("check_for_updates", "Check for Updates").build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "Quit Lettura").accelerator("CmdOrControl+Q").build(app)?;

    let app_menu = SubmenuBuilder::new(app, "")
        .item(&about)
        .separator()
        .item(&settings)
        .item(&check_updates)
        .separator()
        .hide()
        .hide_others()
        .separator()
        .item(&quit)
        .build()?;

    let new_feed = MenuItemBuilder::with_id("new_feed", "New Feed").build(app)?;
    let new_folder = MenuItemBuilder::with_id("new_folder", "New Folder").build(app)?;

    let file_menu = SubmenuBuilder::new(app, "File")
        .item(&new_feed)
        .item(&new_folder)
        .build()?;

    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .copy()
        .paste()
        .cut()
        .select_all()
        .separator()
        .item(&MenuItemBuilder::with_id("undo", "Undo").build(app)?)
        .item(&MenuItemBuilder::with_id("redo", "Redo").build(app)?)
        .build()?;

    let window_menu = SubmenuBuilder::new(app, "Window")
        .minimize()
        .maximize()
        .close_window()
        .fullscreen()
        .build()?;

    let menu = MenuBuilder::new(app)
        .item(&app_menu)
        .item(&file_menu)
        .item(&edit_menu)
        .item(&window_menu)
        .build()?;

    app.set_menu(menu)?;

    app.on_menu_event(move |app, event| {
        match event.id().as_ref() {
            "about" => {
                let package_info = app.package_info();
                let name = package_info.name.clone();
                let version = package_info.version.clone();
                let tauri_version = env!("CARGO_PKG_VERSION").to_string();

                let react_version = Command::new("node")
                    .args(["-p", "require('react/package.json').version"])
                    .output()
                    .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
                    .unwrap_or_else(|_| "unknown".to_string());

                let os = match sys_info::os_release() {
                    Ok(v) => format!("{} {}", std::env::consts::OS, v),
                    Err(_) => std::env::consts::OS.to_string(),
                };

                let node_version = Command::new("node")
                    .args(["-v"])
                    .output()
                    .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
                    .unwrap_or_else(|_| "unknown".to_string());

                let rust_version = Command::new("rustc")
                    .args(["--version"])
                    .output()
                    .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
                    .unwrap_or_else(|_| "unknown".to_string());

                let metadata = json!({
                    "name": name,
                    "version": version,
                    "tauri": tauri_version,
                    "react": react_version,
                    "OS": os,
                    "node": node_version,
                    "rust": rust_version,
                });

                let _ = app.emit("about_lettura", metadata);
            }
            "settings" => {
                let _ = app.emit("go_to_settings", ());
            }
            "check_for_updates" => {
                let _ = app.emit("check_for_updates", ());
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        }
    });

    Ok(())
}
