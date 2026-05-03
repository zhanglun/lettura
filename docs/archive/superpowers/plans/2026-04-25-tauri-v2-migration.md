# Tauri v1 → v2 迁移实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Lettura 桌面阅读器从 Tauri v1.4 完整迁移到 Tauri v2，保持所有功能不变。

**Architecture:** 渐进式 6 阶段迁移。先升级基础设施（CLI、依赖包），再用官方 `tauri migrate` 工具自动转换配置格式，最后逐模块手动迁移 Rust 后端和前端 API 调用。每个阶段完成后验证编译通过。

**Tech Stack:** Tauri v2, Rust, React/TypeScript, Actix-web, Diesel SQLite, pnpm

**设计文档:** `docs/superpowers/specs/2026-04-25-tauri-v2-migration-design.md`

---

## File Structure

### Rust 后端 — 需要创建/修改的文件

| 文件 | 操作 | 职责 |
|------|------|------|
| `apps/desktop/src-tauri/Cargo.toml` | 修改 | 升级 tauri 到 v2，替换所有插件依赖 |
| `apps/desktop/src-tauri/src/main.rs` | 修改 | 精简为入口，调用 lib.rs |
| `apps/desktop/src-tauri/src/lib.rs` | 创建 | Builder 链、setup、事件处理 |
| `apps/desktop/src-tauri/src/core/tray.rs` | 修改 | SystemTray → TrayIconBuilder |
| `apps/desktop/src-tauri/src/core/menu.rs` | 修改 | Menu API → MenuBuilder 风格 |
| `apps/desktop/src-tauri/src/core/config.rs` | 修改 | `tauri::api::path` → 标准库 |
| `apps/desktop/src-tauri/src/db.rs` | 修改 | `tauri::api::path` → 标准库 |
| `apps/desktop/src-tauri/src/cmd.rs` | 修改 | Window 类型更新 |
| `apps/desktop/src-tauri/src/server/mod.rs` | 修改 | State 类型更新 |
| `apps/desktop/src-tauri/src/build.rs` | 修改 | tauri_build v2 |
| `apps/desktop/src-tauri/capabilities/default.json` | 创建 | 权限声明（替代 allowlist） |

### 前端 — 需要修改的文件

| 文件 | 修改内容 |
|------|----------|
| `apps/desktop/package.json` | 升级 @tauri-apps 包，添加插件包 |
| `apps/desktop/src/App.tsx` | appWindow → getCurrentWebviewWindow |
| `apps/desktop/src/index.tsx` | invoke 路径更新 |
| `apps/desktop/src/helpers/dataAgent.ts` | invoke 路径更新 |
| `apps/desktop/src/components/About/index.tsx` | shell.open → plugin-shell |
| `apps/desktop/src/layout/Article/index.tsx` | shell.open → plugin-shell |
| `apps/desktop/src/components/ArticleView/Detail.tsx` | shell.open → plugin-shell |
| `apps/desktop/src/layout/Article/ReadingOptions.tsx` | shell.open → plugin-shell |
| `apps/desktop/src/components/Subscribes/index.tsx` | shell.open → plugin-shell, listen 更新 |
| `apps/desktop/src/layout/Setting/Content/Feed.tsx` | shell.open → plugin-shell |
| `apps/desktop/src/layout/Setting/ImportAndExport/index.tsx` | fs + dialog → 插件包 |
| `apps/desktop/src/__tests__/setup.ts` | mock 路径更新 |

### 配置文件

| 文件 | 修改内容 |
|------|----------|
| `apps/desktop/src-tauri/tauri.conf.json` | v1 格式 → v2 格式 |

---

## Phase 1: 基础设施升级

### Task 1: 升级前端 Tauri 包

**Files:**
- Modify: `apps/desktop/package.json`

- [ ] **Step 1: 升级 @tauri-apps/cli 和 @tauri-apps/api 到 v2**

```bash
cd apps/desktop
pnpm add -D @tauri-apps/cli@^2
pnpm add @tauri-apps/api@^2
```

- [ ] **Step 2: 安装前端插件包**

```bash
pnpm add @tauri-apps/plugin-shell @tauri-apps/plugin-fs @tauri-apps/plugin-dialog @tauri-apps/plugin-process @tauri-apps/plugin-updater @tauri-apps/plugin-log
```

- [ ] **Step 3: 验证安装**

```bash
pnpm install && pnpm list @tauri-apps/cli @tauri-apps/api @tauri-apps/plugin-shell @tauri-apps/plugin-fs @tauri-apps/plugin-dialog
```

Expected: 所有包显示 v2.x.x 版本

- [ ] **Step 4: Commit**

```bash
git add apps/desktop/package.json apps/desktop/pnpm-lock.yaml
git commit -m "chore: upgrade @tauri-apps packages to v2 and add plugin packages"
```

---

### Task 2: 升级 Rust Cargo.toml 依赖

**Files:**
- Modify: `apps/desktop/src-tauri/Cargo.toml`

- [ ] **Step 1: 更新 tauri 和 tauri-build 到 v2**

在 `apps/desktop/src-tauri/Cargo.toml` 中：
- 将 `tauri = { version = "1.4", features = [...] }` 改为 `tauri = { version = "2", features = ["devtools"] }`
  - 移除 features: dialog-all, fs-all, http-all, shell-open, system-tray, updater（v2 中这些由插件提供）
  - 保留 feature: devtools
- 将 `tauri-build = { version = "1.4" }` 改为 `tauri-build = { version = "2" }`

- [ ] **Step 2: 替换插件依赖**

移除 git 引用的 v1 插件：
```toml
# 移除这两行
# tauri-plugin-log = { git = "https://github.com/tauri-apps/plugins-workspace", branch = "v1" }
# tauri-plugin-single-instance = { git = "https://github.com/tauri-apps/plugins-workspace", branch = "v1" }
```

添加 v2 插件 crates：
```toml
tauri-plugin-shell = "2"
tauri-plugin-fs = "2"
tauri-plugin-dialog = "2"
tauri-plugin-http = "2"
tauri-plugin-process = "2"
tauri-plugin-updater = "2"
tauri-plugin-log = "2"
tauri-plugin-single-instance = "2"
```

- [ ] **Step 3: 添加 Cargo.toml lib 配置**

在 `[lib]` 段添加（因为 v2 需要 lib.rs + main.rs 分离）：
```toml
[lib]
name = "lettura_lib"
crate-type = ["staticlib", "cdylib", "lib"]
```

- [ ] **Step 4: 验证 Cargo 能解析依赖**

```bash
cd apps/desktop/src-tauri && cargo check 2>&1 | head -30
```

Expected: 编译错误（因为 API 变了），但依赖解析应该成功。如果依赖解析失败，检查版本号。

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src-tauri/Cargo.toml apps/desktop/src-tauri/Cargo.lock
git commit -m "chore: upgrade tauri Cargo dependencies to v2 and add plugin crates"
```

---

## Phase 2: Rust 后端核心迁移

### Task 3: 拆分 main.rs 为 main.rs + lib.rs

**Files:**
- Modify: `apps/desktop/src-tauri/src/main.rs`
- Create: `apps/desktop/src-tauri/src/lib.rs`
- Modify: `apps/desktop/src-tauri/src/core/config.rs`
- Modify: `apps/desktop/src-tauri/src/db.rs`

- [ ] **Step 1: 修改 config.rs 和 db.rs 中的 `tauri::api::path::home_dir()`**

`core/config.rs` 中有两处、`db.rs` 中有一处使用了 `tauri::api::path::home_dir()`。在 v2 中这个 API 被移除，需要改为直接使用标准库：

在两个文件顶部都确保有：
```rust
use std::env;
```

将 `tauri::api::path::home_dir()` 的调用替换为：
```rust
env::var("HOME").or_else(|_| env::var("USERPROFILE")).map(std::path::PathBuf::from).unwrap_or_else(|_| std::path::PathBuf::from("/"))
```

涉及位置：
- `core/config.rs` 约第 113 行：`let home_dir = tauri::api::path::home_dir();`
- `core/config.rs` 约第 161 行：`let home_dir = &tauri::api::path::home_dir().unwrap();`
- `db.rs` 约第 23 行：`let database_url = path::Path::new(&tauri::api::path::home_dir().unwrap())`

注意：这两个文件都是纯函数，不依赖 Tauri state，这个修改是安全的。

- [ ] **Step 2: 创建 lib.rs — 将 Builder 逻辑从 main.rs 迁出**

创建 `apps/desktop/src-tauri/src/lib.rs`，内容为 main.rs 中除去 `fn main()` 的所有逻辑，重构为一个 `pub fn run()` 函数。

关键变更：

```rust
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
use tauri::Manager;
use std::{env, sync::Mutex};

mod cmd;
mod core;
mod db;
mod feed;
mod models;
mod schema;
mod server;

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
      LogTarget::LogDir,
      LogTarget::Stdout,
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
```

关键变化（对比 v1 main.rs）：
- 模块声明与原 main.rs 完全一致：`mod cmd; mod core; mod db; mod feed; mod models; mod schema; mod server;`
- `core/mod.rs` 已存在并导出所有子模块，无需手动声明子模块
- `extern crate` 声明和 `MIGRATIONS` 常量保持不变
- `AppState` 保持原有结构（含 `new()` 构造器）
- 数据库连接仍使用 `db::establish_connection()`（已在 Step 1 修复 home_dir）
- `.system_tray()` 和 `.on_system_tray_event()` 被移除，由 `core::tray::setup_tray(app)` 在 setup 中处理
- `.menu()` 和 `.on_menu_event()` 被移除，由 `core::menu::setup_menu(app)` 在 setup 中处理
- `get_window()` → `get_webview_window()`
- `app.manage(shared_state)` 保持不变（v2 兼容）
- `.build(context).run()` 保留 `RunEvent::ExitRequested` 处理
- `window.emit()` → `main_window.emit()`（通过 Emitter trait）

- [ ] **Step 3: 精简 main.rs 为入口**

```rust
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

fn main() {
    lettura_lib::run()
}
```

- [ ] **Step 4: 验证编译**

```bash
cd apps/desktop/src-tauri && cargo check 2>&1 | head -50
```

Expected: 会有 core/tray.rs 和 core/menu.rs 的编译错误（因为它们的 API 还没更新），这是正常的。应该没有 lib.rs/main.rs 自身的语法错误。

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src-tauri/src/main.rs apps/desktop/src-tauri/src/lib.rs apps/desktop/src-tauri/src/core/config.rs apps/desktop/src-tauri/src/db.rs
git commit -m "refactor: split main.rs into main.rs + lib.rs for Tauri v2 structure"
```

---

### Task 4: 重写 core/tray.rs — SystemTray → TrayIconBuilder

**Files:**
- Modify: `apps/desktop/src-tauri/src/core/tray.rs`

- [ ] **Step 1: 重写 tray.rs**

v2 中 `SystemTray` 系列被 `TrayIconBuilder` 替代。完整重写：

```rust
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, Manager, Runtime,
};
use tauri_plugin_process::ProcessExt;

pub fn setup_tray<R: Runtime>(app: &App<R>) -> tauri::Result<()> {
    let open_window = MenuItemBuilder::with_id("open_window", "Open Lettura").build(app)?;
    let hide_window = MenuItemBuilder::with_id("hide_window", "Hide Window").build(app)?;
    let restart_app = MenuItemBuilder::with_id("restart_app", "Restart").build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

    let tray_menu = MenuBuilder::new(app)
        .item(&open_window)
        .item(&hide_window)
 .separator()
        .items(&[&restart_app])
 .separator()
        .item(&quit)
        .build()?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().cloned().unwrap())
        .menu(&tray_menu)
        .on_menu_event(|app, event| {
            match event.id().as_ref() {
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
                    app.restart();
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
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
```

关键变化：
- `SystemTray` → `TrayIconBuilder::new()`
- `SystemTrayMenu` → `MenuBuilder`
- `CustomMenuItem` → `MenuItemBuilder::with_id()`
- `SystemTrayEvent` → `TrayIconEvent`
- `api::process::restart()` → `ProcessExt::restart()` (via trait)
- `get_window()` → `get_webview_window()`
- 不再返回 `SystemTray` 给 Builder 链，而是在 setup 中直接构建

- [ ] **Step 2: 验证编译**

```bash
cd apps/desktop/src-tauri && cargo check 2>&1 | grep tray
```

Expected: core/tray.rs 编译通过

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src-tauri/src/core/tray.rs
git commit -m "refactor: rewrite core/tray.rs for Tauri v2 TrayIconBuilder API"
```

---

### Task 5: 重写 core/menu.rs — Menu API 更新

**Files:**
- Modify: `apps/desktop/src-tauri/src/core/menu.rs`

- [ ] **Step 1: 重写 menu.rs**

v2 中菜单 API 改为 Builder 模式。完整重写：

```rust
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    App, Emitter, Manager, Runtime,
};
use std::process::Command;

pub fn setup_menu<R: Runtime>(app: &App<R>) -> tauri::Result<()> {
    let about = MenuItemBuilder::with_id("about", "About Lettura").build(app)?;
    let settings = MenuItemBuilder::with_id("settings", "Settings...").build(app)?;
    let check_updates = MenuItemBuilder::with_id("check_updates", "Check for Updates...").build(app)?;
    let hide = MenuItemBuilder::with_id("hide", "Hide Lettura").build(app)?;
    let hide_others = MenuItemBuilder::with_id("hide_others", "Hide Others").build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

    let app_menu = SubmenuBuilder::new(app, "Lettura")
        .item(&about)
        .separator()
        .item(&settings)
        .separator()
        .item(&check_updates)
        .separator()
        .item(&hide)
        .item(&hide_others)
        .item(&quit)
        .build()?;

    let new_feed = MenuItemBuilder::with_id("new_feed", "New Feed").build(app)?;
    let new_folder = MenuItemBuilder::with_id("new_folder", "New Folder").build(app)?;

    let file_menu = SubmenuBuilder::new(app, "File")
        .item(&new_feed)
        .item(&new_folder)
        .build()?;

    let copy = MenuItemBuilder::with_id("copy", "Copy").build(app)?;
    let paste = MenuItemBuilder::with_id("paste", "Paste").build(app)?;
    let cut = MenuItemBuilder::with_id("cut", "Cut").build(app)?;
    let select_all = MenuItemBuilder::with_id("select_all", "Select All").build(app)?;
    let undo = MenuItemBuilder::with_id("undo", "Undo").build(app)?;
    let redo = MenuItemBuilder::with_id("redo", "Redo").build(app)?;

    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .item(&undo)
        .item(&redo)
        .separator()
        .item(&cut)
        .item(&copy)
        .item(&paste)
        .item(&select_all)
        .build()?;

    let minimize = MenuItemBuilder::with_id("minimize", "Minimize").build(app)?;
    let zoom = MenuItemBuilder::with_id("zoom", "Zoom").build(app)?;
    let close_window = MenuItemBuilder::with_id("close_window", "Close Window").build(app)?;
    let enter_fullscreen = MenuItemBuilder::with_id("enter_fullscreen", "Enter Full Screen").build(app)?;

    let window_menu = SubmenuBuilder::new(app, "Window")
        .item(&minimize)
        .item(&zoom)
        .item(&close_window)
        .item(&enter_fullscreen)
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
                let version = env!("CARGO_PKG_VERSION").to_string();
                let node_version = Command::new("node")
                    .arg("--version")
                    .output()
                    .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
                    .unwrap_or_else(|_| "unknown".to_string());
                let rust_version = Command::new("rustc")
                    .arg("--version")
                    .output()
                    .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
                    .unwrap_or_else(|_| "unknown".to_string());

                let _ = app.emit("about_lettura", serde_json::json!({
                    "version": version,
                    "nodeVersion": node_version,
                    "rustVersion": rust_version,
                }));
            }
            "settings" => {
                let _ = app.emit("go_to_settings", ());
            }
            "check_updates" => {
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
```

关键变化：
- `Context<EmbeddedAssets>` 参数 → `&App<R>`
- `Menu`/`Submenu`/`CustomMenuItem` → `MenuBuilder`/`SubmenuBuilder`/`MenuItemBuilder`
- `.menu()` 链式调用 → `app.set_menu()` + `app.on_menu_event()`
- `WindowMenuEvent` → 闭包签名 `(app, event)`
- `window.emit()` → `app.emit()`
- 不需要返回 Menu 给 Builder 链

- [ ] **Step 2: 验证编译**

```bash
cd apps/desktop/src-tauri && cargo check 2>&1 | grep menu
```

Expected: core/menu.rs 编译通过

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src-tauri/src/core/menu.rs
git commit -m "refactor: rewrite core/menu.rs for Tauri v2 MenuBuilder API"
```

---

### Task 6: 更新 cmd.rs 和 server/mod.rs

**Files:**
- Modify: `apps/desktop/src-tauri/src/cmd.rs`
- Modify: `apps/desktop/src-tauri/src/server/mod.rs`

- [ ] **Step 1: 更新 cmd.rs 中的 Window 类型**

`cmd.rs` 的 `init_process` 命令使用了 `Window` 类型的 `window.emit()`。

v2 中 `tauri::Window` → `tauri::WebviewWindow`，`window.emit()` 的用法基本不变。

将 import 和函数签名中的 `Window` 替换为 `WebviewWindow`：

```rust
// 旧
use tauri::Window;

// 新
use tauri::WebviewWindow;
```

在 `init_process` 函数参数中：
```rust
// 旧
window: Window,
// 新
window: WebviewWindow,
```

`window.emit()` 调用本身不需要改动（`WebviewWindow` 也有 `emit` 方法，通过 `Emitter` trait）。

- [ ] **Step 2: 更新 server/mod.rs 中的 State 类型**

`server/mod.rs` 使用了 `tauri::State<'_, AppState>`。在 v2 中 State 的 import 路径不变（仍然是 `tauri::State`），但需要确认 `AppState` 的定义在 `lib.rs` 中是 pub 的（已在 Task 3 中处理）。

检查并确保 import 正确：
```rust
use crate::AppState;
use tauri::State;
```

- [ ] **Step 3: 验证编译**

```bash
cd apps/desktop/src-tauri && cargo check 2>&1 | grep -E "(cmd|server)"
```

Expected: cmd.rs 和 server/mod.rs 编译通过

- [ ] **Step 4: Commit**

```bash
git add apps/desktop/src-tauri/src/cmd.rs apps/desktop/src-tauri/src/server/mod.rs
git commit -m "refactor: update Window→WebviewWindow in cmd.rs and server imports for v2"
```

---

### Task 7: 更新 build.rs 并验证完整编译

**Files:**
- Modify: `apps/desktop/src-tauri/src/build.rs`

- [ ] **Step 1: 更新 build.rs**

v2 的 `tauri_build` API 基本不变，但确认版本匹配：

```rust
fn main() {
    tauri_build::build()
}
```

如果当前已经是这个内容，无需修改。只需确认 `tauri-build` 版本已升到 v2（在 Task 2 中已处理）。

- [ ] **Step 2: 完整编译验证**

```bash
cd apps/desktop/src-tauri && cargo build 2>&1 | tail -20
```

Expected: 编译成功（可能有一些 warning，但不应有 error）。如果仍有编译错误，根据错误信息修复。

- [ ] **Step 3: 运行 Rust 测试**

```bash
cd apps/desktop/src-tauri && cargo test 2>&1 | tail -20
```

Expected: 所有现有测试通过（test_parse_feed, test_add_feed, test_calculate_backoff, test_scheduler_initialization, test_scheduler_state）

- [ ] **Step 4: Commit**

```bash
git add apps/desktop/src-tauri/src/build.rs
git commit -m "chore: update build.rs for tauri-build v2 and verify Rust compilation"
```

---

## Phase 3: 配置与权限迁移

### Task 8: 迁移 tauri.conf.json 到 v2 格式

**Files:**
- Modify: `apps/desktop/src-tauri/tauri.conf.json`
- Create: `apps/desktop/src-tauri/capabilities/default.json`

- [ ] **Step 1: 尝试自动迁移**

```bash
cd apps/desktop && pnpm tauri migrate
```

这会自动转换 `tauri.conf.json` 的大部分格式。但手动检查仍然是必要的。

- [ ] **Step 2: 手动检查并修正 tauri.conf.json**

自动迁移后，检查以下字段是否正确转换：

| v1 格式 | v2 格式 | 说明 |
|---------|---------|------|
| `build.devPath` | `devUrl` | `"http://localhost:3000"` |
| `build.distDir` | `frontendDist` | `"../build"` |
| `package.*` | 顶层 `version`, `productName` 等 | 平铺 |
| `tauri.bundle` | `bundle` | 平铺 |
| `tauri.allowlist` | 删除 | 由 capabilities 替代 |
| `tauri.systemTray` | `app.trayIcon` | 如果有 icon 路径 |
| `tauri.updater` | `plugins.updater` | 迁移到 plugins 下 |
| `tauri.windows` | `app.windows` | 窗口配置 |

确保 `plugins.updater` 中有 `"createUpdaterArtifacts": "v1Compatible"` 以兼容旧版更新格式。

确保 bundle.identifier 保持 `"com.lettura.dev"`。

- [ ] **Step 3: 创建 capabilities/default.json**

在 `apps/desktop/src-tauri/capabilities/default.json` 创建权限声明：

```json
{
  "$schema": "https://raw.githubusercontent.com/tauri-apps/tauri/dev/crates/tauri-utils/schema.json",
  "identifier": "default",
  "description": "Default capabilities for Lettura",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:default",
    "core:window:allow-minimize",
    "core:window:allow-toggle-maximize",
    "core:window:allow-close",
    "core:window:allow-show",
    "core:window:allow-hide",
    "core:window:allow-set-focus",
    "shell:allow-open",
    "fs:allow-read-text-file",
    "fs:allow-write-text-file",
    "dialog:allow-save",
    "dialog:allow-open",
    "http:default",
    "http:allow-fetch",
    "http:allow-fetch-cancel",
    "http:allow-fetch-read-body",
    "http:allow-fetch-send",
    "process:allow-restart",
    "process:allow-exit",
    "updater:default",
    "log:default"
  ]
}
```

注意：权限列表可能需要根据实际编译/运行时的错误进行调整。以上是基于 v1 allowlist 的对应关系推导的。

- [ ] **Step 4: 验证编译**

```bash
cd apps/desktop/src-tauri && cargo build 2>&1 | tail -10
```

Expected: 编译通过

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src-tauri/tauri.conf.json apps/desktop/src-tauri/capabilities/
git commit -m "feat: migrate tauri.conf.json to v2 format and add capabilities"
```

---

## Phase 4: 前端 API 迁移

### Task 9: 更新 invoke 路径

**Files:**
- Modify: `apps/desktop/src/helpers/dataAgent.ts`
- Modify: `apps/desktop/src/index.tsx`

- [ ] **Step 1: 更新 dataAgent.ts 的 invoke import**

```typescript
// 旧
import { invoke } from "@tauri-apps/api";

// 新
import { invoke } from "@tauri-apps/api/core";
```

文件中有约 8 处 invoke 调用，调用方式本身不变（仍然是 `invoke("command_name", { args })`），只是 import 路径变了。

- [ ] **Step 2: 更新 index.tsx 的 invoke import**

```typescript
// 旧
import { invoke } from "@tauri-apps/api";

// 新
import { invoke } from "@tauri-apps/api/core";
```

- [ ] **Step 3: 验证前端类型检查**

```bash
cd apps/desktop && pnpm build 2>&1 | head -20
```

Expected: 类型检查通过（如果其他文件还有旧的 import，会报错，这是预期的）

- [ ] **Step 4: Commit**

```bash
git add apps/desktop/src/helpers/dataAgent.ts apps/desktop/src/index.tsx
git commit -m "refactor: update invoke import path to @tauri-apps/api/core for v2"
```

---

### Task 10: 更新 App.tsx — appWindow + event API

**Files:**
- Modify: `apps/desktop/src/App.tsx`

- [ ] **Step 1: 更新 window import**

```typescript
// 旧
import { appWindow } from "@tauri-apps/api/window";

// 新
import { getCurrentWindow } from "@tauri-apps/api/window";
```

- [ ] **Step 2: 替换所有 appWindow 调用**

将所有 `appWindow.minimize()` → `getCurrentWindow().minimize()` 等。具体地：
- `appWindow.minimize()` → `getCurrentWindow().minimize()`
- `appWindow.toggleMaximize()` → `getCurrentWindow().toggleMaximize()`
- `appWindow.close()` → `getCurrentWindow().close()`

如果代码中多处调用，可以提取为变量：
```typescript
const appWindow = getCurrentWindow();
```
这样后续调用不需要改动。

- [ ] **Step 3: 更新 event import（如需要）**

v2 中 `emit` 和 `listen` 的 import 路径：
```typescript
// 旧
import { emit, listen } from "@tauri-apps/api/event";

// 新 — import 路径不变，仍然可用
import { emit, listen } from "@tauri-apps/api/event";
```

Events API 在 v2 中基本兼容，大多数情况下不需要修改。但 emit 的签名可能有细微变化，需要检查。

- [ ] **Step 4: 验证前端类型检查**

```bash
cd apps/desktop && pnpm build 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src/App.tsx
git commit -m "refactor: update App.tsx window and event APIs for Tauri v2"
```

---

### Task 11: 更新 shell.open 引用（6 个文件）

**Files:**
- Modify: `apps/desktop/src/components/About/index.tsx`
- Modify: `apps/desktop/src/layout/Article/index.tsx`
- Modify: `apps/desktop/src/components/ArticleView/Detail.tsx`
- Modify: `apps/desktop/src/layout/Article/ReadingOptions.tsx`
- Modify: `apps/desktop/src/components/Subscribes/index.tsx`
- Modify: `apps/desktop/src/layout/Setting/Content/Feed.tsx`

- [ ] **Step 1: 更新所有 shell.open 文件的 import**

在以上 6 个文件中，每个都需要：

```typescript
// 旧
import { open } from "@tauri-apps/api/shell";

// 新
import { open } from "@tauri-apps/plugin-shell";
```

调用方式 `open(url)` 不变。

- [ ] **Step 2: 批量验证**

```bash
cd apps/desktop && grep -r "@tauri-apps/api/shell" src/ 
```

Expected: 无匹配结果

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src/components/About/index.tsx apps/desktop/src/layout/Article/index.tsx apps/desktop/src/components/ArticleView/Detail.tsx apps/desktop/src/layout/Article/ReadingOptions.tsx apps/desktop/src/components/Subscribes/index.tsx apps/desktop/src/layout/Setting/Content/Feed.tsx
git commit -m "refactor: update shell.open imports to @tauri-apps/plugin-shell for v2"
```

---

### Task 12: 更新 fs + dialog 引用（ImportAndExport）

**Files:**
- Modify: `apps/desktop/src/layout/Setting/ImportAndExport/index.tsx`

- [ ] **Step 1: 更新 import**

```typescript
// 旧
import { writeTextFile, readTextFile } from "@tauri-apps/api/fs";
import { save, open } from "@tauri-apps/api/dialog";

// 新
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import { save, open } from "@tauri-apps/plugin-dialog";
```

注意：`open` 在这个文件中是 dialog 的 open（文件选择器），和 shell.open 不同。如果同时需要 shell.open 和 dialog.open，需要用别名避免冲突：

```typescript
import { open as openFile } from "@tauri-apps/plugin-dialog";
```

- [ ] **Step 2: 验证文件中 API 调用签名是否变化**

v2 的 `writeTextFile`、`readTextFile`、`save`、`open` 的调用签名可能与 v1 略有不同。需要查看具体用法并对照 v2 文档调整。

主要变化点：
- `writeTextFile(path, content)` → 可能变为 `writeTextFile(path, content)` 或 `writeTextFile({ path, contents })`
- `save({ defaultPath, filters })` → 签名可能调整
- `open({ multiple, filters })` → 签名可能调整

根据实际编译错误逐一修正。

- [ ] **Step 3: 验证前端类型检查**

```bash
cd apps/desktop && pnpm build 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add apps/desktop/src/layout/Setting/ImportAndExport/index.tsx
git commit -m "refactor: update fs and dialog imports to plugin packages for Tauri v2"
```

---

### Task 13: 更新测试 mock

**Files:**
- Modify: `apps/desktop/src/__tests__/setup.ts`

- [ ] **Step 1: 更新 mock 路径**

setup.ts 中 mock 了 `@tauri-apps/api`。需要根据实际使用情况更新：

```typescript
// 旧的 mock 路径
vi.mock("@tauri-apps/api", ...)

// 需要添加的 mock 路径（根据实际测试中的 import）
vi.mock("@tauri-apps/api/core", ...)
vi.mock("@tauri-apps/api/window", ...)
vi.mock("@tauri-apps/api/event", ...)
vi.mock("@tauri-apps/plugin-shell", ...)
vi.mock("@tauri-apps/plugin-fs", ...)
vi.mock("@tauri-apps/plugin-dialog", ...)
```

具体需要 mock 哪些路径取决于测试文件的实际 import。

- [ ] **Step 2: 运行前端测试**

```bash
cd apps/desktop && pnpm test 2>&1 | tail -20
```

Expected: 所有测试通过

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src/__tests__/setup.ts
git commit -m "test: update test mocks for Tauri v2 package paths"
```

---

## Phase 5: 完整构建验证

### Task 14: 端到端构建验证

**Files:**
- 无新文件修改

- [ ] **Step 1: 前端完整构建**

```bash
cd apps/desktop && pnpm build 2>&1
```

Expected: tsc 类型检查通过 + vite build 成功

- [ ] **Step 2: Rust 完整构建**

```bash
cd apps/desktop/src-tauri && cargo build 2>&1 | tail -20
```

Expected: 编译成功，无 error

- [ ] **Step 3: 运行所有 Rust 测试**

```bash
cd apps/desktop/src-tauri && cargo test 2>&1
```

Expected: 全部通过

- [ ] **Step 4: 运行所有前端测试**

```bash
cd apps/desktop && pnpm test 2>&1
```

Expected: 全部通过

- [ ] **Step 5: 检查无残留 v1 import**

```bash
cd apps/desktop && grep -r "@tauri-apps/api/shell\|@tauri-apps/api/fs\|@tauri-apps/api/dialog" src/ 
```

Expected: 无匹配

```bash
cd apps/desktop/src-tauri && grep -r "tauri::api::\|SystemTray\|SystemTrayEvent" src/
```

Expected: 无匹配

---

### Task 15: 启动 `pnpm tauri dev` 验证

**Files:**
- 无新文件修改

- [ ] **Step 1: 启动开发模式**

```bash
cd apps/desktop && pnpm tauri dev
```

Expected: 窗口正常显示，托盘图标正常，菜单可点击

- [ ] **Step 2: 功能验证清单**

手动测试以下功能：
- [ ] 窗口最小化/最大化/关闭（关闭应隐藏到托盘）
- [ ] 托盘菜单 — 显示/隐藏窗口
- [ ] 托盘菜单 — 重启应用
- [ ] 托盘菜单 — 退出
- [ ] 应用菜单 — About 弹出
- [ ] 应用菜单 — Settings 跳转
- [ ] 应用菜单 — Check for Updates
- [ ] 添加/删除/修改 Feed
- [ ] 文章阅读和外部链接打开（shell.open）
- [ ] 设置导入导出（fs + dialog）
- [ ] 单实例检查（启动第二个实例时聚焦已有窗口）

- [ ] **Step 3: Commit（如有修复）**

如果有运行时发现的问题需要修复，每个修复单独提交：

```bash
git add -A
git commit -m "fix: [描述修复的具体运行时问题]"
```

---

## Phase 6: 收尾

### Task 16: 更新 CI 和文档

**Files:**
- Modify: `.github/workflows/release.yml`（如需要）
- Modify: `AGENTS.md`

- [ ] **Step 1: 检查 CI 配置**

检查 `.github/workflows/release.yml` 中的 Tauri 构建步骤是否需要更新。v2 的构建命令 `tauri build` 仍然兼容，但可能需要更新 actions 版本：

```bash
grep -n "tauri-apps" .github/workflows/release.yml
```

如果使用了 `tauri-apps/tauri-action`，可能需要升级到支持 v2 的版本。

- [ ] **Step 2: 更新 AGENTS.md**

更新项目描述中的版本信息：
- "Tauri v1 desktop feed reader" → "Tauri v2 desktop feed reader"
- 更新插件相关描述（不再有 allowlist，改为 capabilities）
- 更新 Cargo.toml 中的版本号引用
- 如有新的运行命令或配置路径变化，同步更新

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/release.yml AGENTS.md
git commit -m "docs: update CI and docs for Tauri v2"
```

---

## 风险与注意事项

1. **tauri migrate 不完美** — 自动迁移工具会处理大部分配置格式变化，但 Rust API 变更需要手动处理。不要期望运行一次 migrate 就能编译通过。

2. **Actix-web 兼容性** — Lettura 在 localhost 嵌入了 Actix-web 服务器。Tauri v2 的异步运行时基于 tokio，与 Actix-web 的 tokio 运行时可能有冲突。如果遇到 panic，考虑将 Actix 服务器运行在独立的线程中。

3. **Diesel 连接** — `diesel::SqliteConnection::establish` 是同步调用，放在 `setup` 中应该没有问题。但数据库路径的获取方式变了（从硬编码路径到 `app.path().app_data_dir()`）。

4. **Updater 兼容** — v2 的 updater 插件需要 `createUpdaterArtifacts: "v1Compatible"` 来兼容 v1 的更新端点格式。如果将来要完全迁移到 v2 更新格式，需要同时更新服务端。

5. **Windows IndexedDB** — Tauri v2 在 Windows 上可能使用不同的 scheme，导致 IndexedDB 数据丢失。对于 Lettura 来说这不太重要（数据在 SQLite 中），但 podcast 数据（Dexie/IndexedDB）可能会受影响。

6. **权限调试** — 运行时如果遇到 "permission denied" 错误，需要在 `capabilities/default.json` 中添加对应的权限。查看错误信息中的权限标识符，添加到 permissions 数组中。
