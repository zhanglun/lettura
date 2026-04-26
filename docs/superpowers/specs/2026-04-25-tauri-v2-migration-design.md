# Tauri v1 → v2 渐进式迁移设计

**日期**: 2026-04-25
**状态**: 草案
**目标**: 将 Lettura 桌面应用从 Tauri v1 (1.4) 升级到 Tauri v2，同时利用迁移机会进行技术栈现代化。

## 动机

- **全面现代化**: 升级核心框架、依赖链、构建工具
- **生态系统对齐**: v2 的插件生态更成熟，权限系统更安全
- **可维护性**: v1 已进入维护模式，长期来看必须迁移
- **移动端准备**: v2 提供移动端支持基础，为未来扩展留出空间

## 当前状态

### 技术栈快照

| 组件 | 当前版本 | 目标版本 |
|------|---------|---------|
| Tauri (Rust) | 1.4 | 2.x |
| @tauri-apps/api | ^1.5.6 | ^2.x |
| @tauri-apps/cli | ^1.5.14 | ^2.x |
| tauri-build | 1.x | 2.x |

### Tauri v1 使用范围

**Rust 端** (src-tauri/src/):
- ~19 个 Tauri 命令（cmd.rs + scheduler.rs）
- 系统托盘（SystemTray, SystemTrayMenu, CustomMenuItem）
- 应用菜单（Menu, Submenu, MenuItem, WindowMenuEvent）
- 窗口事件处理（GlobalWindowEvent, WindowEvent::CloseRequested）
- 状态管理（app.manage(), State<'_, AppState>）
- 内嵌 Actix-web HTTP 服务器
- 插件：tauri-plugin-log (v1), tauri-plugin-single-instance (v1)
- API 路径：tauri::api::path::home_dir(), tauri::api::process::restart()
- 自动更新（updater，配置在 tauri.conf.json）

**前端** (src/):
- invoke 调用：dataAgent.ts, index.tsx
- 窗口控制：App.tsx (minimize, toggleMaximize, close)
- 事件系统：App.tsx, Subscribes/index.tsx (listen/emit)
- shell.open：6 个组件
- fs 操作：Setting/ImportAndExport/index.tsx
- dialog 操作：Setting/ImportAndExport/index.tsx
- 测试 mock：src/__tests__/setup.ts

## 迁移方案：渐进式（Approach A）

从 main 创建长期迁移分支，分 6 个阶段推进，每个阶段都能编译运行。

### 阶段 1：基础设施升级

**目标**: 升级构建工具链，为 Tauri v2 做准备。

**操作**:
- Rust 工具链确认 stable 最新版
- Node.js 确认 >= 18
- `@tauri-apps/cli` 升级到 v2
- `@tauri-apps/api` 升级到 v2
- `tauri` / `tauri-build` crate 升级到 v2
- 移除 v1 Cargo features：`dialog-all`, `fs-all`, `http-all`, `shell-open`, `system-tray`, `updater`
- 添加 v2 Cargo features：`tray-icon`（替代 system-tray），`devtools`
- 运行 `pnpm tauri migrate` 自动转换 tauri.conf.json 格式

**受影响文件**: `package.json`, `Cargo.toml` (workspace + app), `tauri.conf.json`

**验证**: `cargo check` 通过（此时会有编译错误，预期内）

### 阶段 2：Rust 后端核心迁移

#### 2a. 项目结构重构

v2 推荐 `lib.rs` + `main.rs` 分离结构（这也是移动端支持的前提，因为 iOS/Android 共享 lib.rs）：

```
src-tauri/src/
  lib.rs   — pub fn run() 包含 Builder、命令注册、setup 逻辑（从 main.rs 迁入）
  main.rs  — 仅调用 lib::run()
```

Cargo.toml 中需要设置 `crate-type = ["lib", "cdylib", "staticlib", "bin"]`。

`main.rs` 简化为：
```rust
fn main() {
    lettura_lib::run()
}
```

`lib.rs` 包含 `pub fn run()` 函数，容纳原 main.rs 的全部 Builder 逻辑。

#### 2b. Builder 链重写

v1 Builder 链:
```rust
tauri::Builder::default()
    .menu(menu::build_menu())
    .plugin(tauri_plugin_log::Builder::default().build())
    .plugin(tauri_plugin_single_instance::init(|_| {}))
    .setup(|app| { /* ... */ })
    .on_menu_event(menu::handle_menu_event)
    .system_tray(tray::build_system_tray())
    .on_system_tray_event(tray::handle_tray_event)
    .on_window_event(handle_window_event)
    .invoke_handler(tauri::generate_handler![/* commands */])
    .build(tauri::generate_context!())
    .expect("error while building tauri application")
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
```

v2 Builder 链:
```rust
tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::default().build())
    .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {}))
    .setup(|app| {
        // tray 和 menu 在 setup 中创建
        let tray = tray::create_tray(app)?;
        let menu = menu::create_menu(app)?;
        app.set_menu(menu)?;
        // ... 其余 setup 逻辑
        Ok(())
    })
    .on_menu_event(menu::handle_menu_event)
    .on_window_event(handle_window_event)
    .invoke_handler(tauri::generate_handler![/* commands */])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
```

关键变更：
- `.system_tray()` 和 `.on_system_tray_event()` 从 Builder 链移除
- Tray 在 `setup()` 中通过 `TrayIconBuilder` 创建
- Menu 在 `setup()` 中通过 `MenuBuilder` 创建并 `app.set_menu()` 设置
- `.build()` + `.run()` 合并为 `.run(tauri::generate_context!())`
- `Context<EmbeddedAssets>` 参数移除
- `tauri::generate_context!()` 不再需要类型参数

#### 2c. Tray 重写 (tray.rs)

v1:
```rust
use tauri::{SystemTray, SystemTrayEvent, CustomMenuItem, SystemTrayMenu, SystemTrayMenuItem, SystemTraySubmenu};

pub fn build_system_tray() -> SystemTray { /* ... */ }
pub fn handle_tray_event(app: &AppHandle, event: SystemTrayEvent) { /* ... */ }
```

v2:
```rust
use tauri::{TrayIconBuilder, Manager};
use tauri::menu::{MenuBuilder, MenuItemBuilder};

pub fn create_tray(app: &App) -> Result<TrayIcon> {
    let menu = MenuBuilder::new(app)
        .item("open", "打开 Lettura")
        .separator()
        .item("restart", "重启")
        .item("quit", "退出")
        .build()?;
    
    TrayIconBuilder::new()
        .menu(&menu)
        .on_menu_event(move |app, event| { /* handle */ })
        .icon(app.default_window_icon().unwrap().clone())
        .build(app)
}
```

功能完全保留：显示/隐藏主窗口、重启应用、退出。API 彻底不同，需要完全重写。

#### 2d. Menu 重写 (menu.rs)

v1:
```rust
use tauri::{Menu, Submenu, CustomMenuItem, MenuItem};

pub fn build_menu() -> Menu { /* ... */ }
pub fn handle_menu_event(event: WindowMenuEvent) { /* ... */ }
```

v2:
```rust
use tauri::menu::{MenuBuilder, SubmenuBuilder, MenuItem};

pub fn create_menu(app: &App) -> Result<Menu> {
    let app_menu = SubmenuBuilder::new(app, "Lettura")
        .about()
        .separator()
        .item("check_update", "检查更新...")
        .build()?;
    
    let file_menu = SubmenuBuilder::new(app, "文件")
        .item("import_opml", "导入 OPML")
        .item("export_opml", "导出 OPML")
        .build()?;
    
    // ... edit_menu, window_menu
    
    MenuBuilder::new(app)
        .item(&app_menu)
        .item(&file_menu)
        .build()
}
```

App Menu、File、Edit、Window 子菜单结构保持一致，API 从构造函数模式改为 Builder 模式。

#### 2e. State 管理

`app.manage()` 和 `State<'_>` 在 v2 中仍然可用，但 `Manager` trait 的方法签名有调整。主要变更：
- `app.manage(shared_state)` → 用法不变
- `State<'_, AppState>` → 参数类型不变
- `app.get_window("main")` → `app.get_webview_window("main")`
- `window.emit()` → 基本不变

#### 2f. 其他 Rust API

| v1 | v2 | 文件 |
|----|-----|------|
| `tauri::api::path::home_dir()` | `app.path().home_dir()` (Manager trait) | 多处 |
| `tauri::api::process::restart()` | `tauri_plugin_process::ProcessExt::restart()` | tray.rs |
| `get_window()` | `get_webview_window()` | main.rs |
| `GlobalWindowEvent<Wry>` | `WindowEvent` | main.rs |

**受影响文件**: `main.rs`, `lib.rs` (新), `tray.rs`, `menu.rs`, `cmd.rs`

**验证**: `cargo build` 通过，应用可启动（部分功能可能不可用）

### 阶段 3：插件系统迁移

v2 将 v1 的内置功能拆分为独立插件。每个插件需要：Rust crate 注册 + JS 包安装 + capabilities 权限声明。

| v1 功能 | v2 Rust crate | v2 JS 包 | 受影响的前端文件 |
|---------|--------------|----------|---------------|
| `tauri::api::process` | `tauri-plugin-process` | `@tauri-apps/plugin-process` | 无（仅 Rust 端） |
| fs | `tauri-plugin-fs` | `@tauri-apps/plugin-fs` | Setting/ImportAndExport |
| dialog | `tauri-plugin-dialog` | `@tauri-apps/plugin-dialog` | Setting/ImportAndExport |
| http | `tauri-plugin-http` | `@tauri-apps/plugin-http` | (Rust 端 Actix server) |
| shell | `tauri-plugin-shell` | `@tauri-apps/plugin-shell` | 6 个组件 |
| log | `tauri-plugin-log` (v2) | 无 | (Rust 端) |
| single-instance | `tauri-plugin-single-instance` (v2) | 无 | (Rust 端) |
| updater | `tauri-plugin-updater` | `@tauri-apps/plugin-updater` | App.tsx |

**注意**：
- `tauri-plugin-single-instance` v2 的 init 回调签名变为 `|app, args, cwd|`（增加 args 和 cwd 参数）
- 插件安装后必须在 capabilities 中声明权限，否则前端调用会被拒绝
- Actix-web 内嵌服务器的兼容性需要在迁移后验证

**验证**: 每个插件迁移后单独测试其功能

### 阶段 4：前端 API 迁移

12 个文件、18 处导入需要更新：

| v1 导入 | v2 导入 | 受影响文件数 |
|---------|---------|------------|
| `@tauri-apps/api/tauri` → `invoke` | `@tauri-apps/api/core` → `invoke` | 2 |
| `@tauri-apps/api/window` → `appWindow` | `@tauri-apps/api/webviewWindow` → `WebviewWindow` | 1 |
| `@tauri-apps/api/event` → `listen/emit` | `@tauri-apps/api/event` → `listen/emit` | 2 |
| `@tauri-apps/api/shell` → `open` | `@tauri-apps/plugin-shell` → `open` | 6 |
| `@tauri-apps/api/fs` → `writeTextFile/readTextFile` | `@tauri-apps/plugin-fs` → `writeTextFile/readTextFile` | 1 |
| `@tauri-apps/api/dialog` → `save/open` | `@tauri-apps/plugin-dialog` → `save/open` | 1 |

**关键变更**：
- `appWindow.minimize()` → `WebviewWindow.getCurrent().minimize()`
- `appWindow.toggleMaximize()` → `WebviewWindow.getCurrent().toggleMaximize()`
- `appWindow.close()` → `WebviewWindow.getCurrent().close()`
- `listen` 的事件名可能需要调整（v2 事件命名约定变更）
- Updater 事件 `tauri://update` → 需要确认 v2 plugin-updater 的事件名

**测试 mock 更新**：
- `src/__tests__/setup.ts` 中的 `@tauri-apps/api` mock 需要更新为新的模块路径
- 现有 Vitest 测试（`src/stores/__tests__/`、`src/helpers/__tests__/`）需要用新 API 重新 mock

**验证**: `pnpm build` 通过，`pnpm test` 通过

### 阶段 5：配置与权限系统

#### tauri.conf.json 格式变更

由 `tauri migrate` 自动处理的主要变更：
- `build.devPath` → `devUrl`
- `build.distDir` → `frontendDist`
- `build.beforeDevCommand` → `devUrl` 旁的配置
- `package.*` → 顶层字段
- `tauri.*` → `app.*`
- `tauri.bundle` → `bundle`
- `tauri.allowlist` → 移除（被 capabilities 替代）
- `tauri.systemTray` → `app.trayIcon`
- Updater 配置 → `plugins.updater`

#### Capabilities 权限系统

在 `src-tauri/capabilities/` 下创建权限声明文件，替代 v1 的 allowlist：

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main",
  "description": "Main window capabilities",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "shell:allow-open",
    "fs:allow-read-text-file",
    "fs:allow-write-text-file",
    "dialog:allow-open",
    "dialog:allow-save",
    "http:allow-request",
    "updater:default",
    "process:allow-restart"
  ]
}
```

#### Updater 配置

- 从 `tauri.conf.json` 内嵌迁移到 `plugins.updater`
- 设置 `bundle.createUpdaterArtifacts: "v1Compatible"` 保持与现有更新 endpoint 的兼容
- 前端更新检查逻辑需要适配 `@tauri-apps/plugin-updater` 的 API

**验证**: `pnpm tauri build` 通过，打包产物正常

### 阶段 6：验证与收尾

- macOS 上完整功能回归测试：feed 管理、文章阅读、导入导出 OPML、系统托盘、自动更新、窗口管理
- 更新 `.github/workflows/release.yml` 中的 Tauri 构建步骤（v2 CLI 命令可能有变化）
- 更新项目根目录 `AGENTS.md` 中的版本号和技术描述
- 更新 `apps/docs` 中的相关文档（如有）

## TDD 策略

### 迁移前：补齐测试覆盖

在开始迁移之前，确保以下测试存在且通过：
- `cargo test` — Rust 端命令测试
- `pnpm test` — 前端 store 和 helper 测试
- 记录测试基线：`cargo test 2>&1 | tee baseline-rust.txt` 和 `pnpm test 2>&1 | tee baseline-frontend.txt`

### 迁移中：测试作为回归安全网

每个阶段完成后运行完整测试套件：
- 阶段 2 完成后：`cargo test` + `cargo build`
- 阶段 4 完成后：`pnpm test` + `pnpm build`
- 阶段 5 完成后：`pnpm tauri build`

### 关键测试点

1. **Rust 命令**：确保 `#[tauri::command]` 函数签名和 State 注入在 v2 下仍然正常
2. **前端 invoke**：更新 mock 后确保 dataAgent.ts 的所有 invoke 调用测试通过
3. **事件系统**：验证 listen/emit 在 v2 下的行为一致性
4. **插件功能**：fs、dialog、shell 的集成测试

## 风险与注意事项

1. **Windows IndexedDB 重置**: v2 中 webview scheme 变更可能导致 IndexedDB 数据丢失。Podcast 数据存储在 Dexie/IndexedDB 中，需要在迁移文档中标注此风险并提供数据备份方案。
2. **Actix-web 兼容性**: Lettura 内嵌了 Actix-web 服务器，需要验证 v2 的异步运行时与 Actix-web 的兼容性。tokio 版本冲突是潜在风险。
3. **自动更新兼容**: 现有更新 endpoint 使用 v1 格式，需要确认 `createUpdaterArtifacts: "v1Compatible"` 是否足够，或者需要调整更新服务器。
4. **单实例插件 API**: `tauri-plugin-single-instance` v2 的回调签名增加了 args 和 cwd 参数，需要适配。
5. **Diesel 兼容性**: Diesel 本身不依赖 Tauri，但 Rust 版本升级可能影响 Diesel 的编译。需要确认 Diesel 版本与 Rust stable 最新版的兼容性。

## 不在范围内

- 移动端适配（仅做桌面端迁移，但项目结构拆分为 lib.rs + main.rs 为移动端预留基础）
- UI/UX 重设计
- 数据库 schema 变更
- 前端框架升级（React 版本不变）
