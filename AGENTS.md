# AGENTS.md

面向 AI 编码代理的仓库速查笔记。内容与可执行配置冲突时，以配置为准。

## 项目形态

- Lettura 是 Tauri v2 桌面订阅阅读器：React/Vite 前端 + Rust 后端（Cargo
  workspace 成员 `apps/desktop/src-tauri`）。
- 两套 workspace 共享仓库树：pnpm 管理 JS 包（`apps/desktop`、`apps/docs`、
  未来的 `packages/*`），根 Cargo.toml 管理全部 Rust（成员
  `apps/desktop/src-tauri` 与 `packages/*`）。pnpm 会静默忽略 Rust 目录；
  Cargo.lock 只保留根目录一份。
- 订阅抓取器是 `packages/fetcher-*` 下的独立 crate（`fetcher-core` =
  `Fetcher` trait + `FetchedArticle`；`fetcher-rss` = 解析/发现层；
  `fetcher-mail` = IMAP（async-imap 0.10 + mail-parser 0.11，两者均已锁
  feature）；`fetcher-bilibili` = wbi 签名 Web API）。抓取器必须无状态，
  禁止依赖 diesel/tauri/actix；注册表、探测分发（`claims` 顺序、rss 兜底）
  与 `FetchedArticle → NewArticle` 转换器在 `src-tauri/src/fetchers/mod.rs`；
  按 `feeds.provider` 的同步分发在 `feed/channel.rs::sync_articles`。
  新增源类型 = 新 crate + 注册表加一行。每源配置存在
  `feeds.provider/account_uuid/source_config`；凭据在 `source_accounts`
  表（`sources/account_service.rs`，命令
  `list/save/delete/test_source_account`）。邮件同步会把 `last_uid`
  水位写回 `source_config`。
- 前端数据访问只走 localhost HTTP（`src/helpers/http.ts` 的
  `apiGet/apiPost`，对准内嵌 Actix 服务 `http://127.0.0.1:{port}/api`，
  实现在 `src-tauri/src/server/handlers/`）。dataAgent 已移除（2026-09-30，
  提交 5a8278b4 回滚了此前的 IPC-only 收拢）。Tauri `invoke` 仅保留非数据
  命令（窗口/端口、OPML、来源账户、订阅添加/预览）。新数据操作 =
  新增 Actix handler。
- 前端数据流是两条车道（保持现状）：文章列表查询走 `src/hooks/useArticle.ts`
  （模块级缓存 + 在途去重，列表状态的唯一真相源）；命令类 POST 可直接
  `apiPost`，然后经 `store.getSubscribes()` 和/或
  `busChannel.emit("getChannels")` 刷新（AppLayout 监听一次）。改变文章
  全集的命令（退订/删除源等）成功后必须调
  `invalidateArticleCache()`（useArticle.ts 导出，含在途世代守卫），否则
  返回列表页会命中陈旧缓存。不要引入第三层缓存，不要把列表状态塞回
  Zustand slice。
- React Compiler 1.0 已接入 vite.config.ts 与 vitest.config.ts
  （babel-plugin-react-compiler）：src 下所有组件/钩子都被编译（零
  bail-out）并自动记忆化。禁止再写 useCallback/useMemo/React.memo——
  记忆化由编译器负责，手写hook 曾经直接阻断编译（"Existing memoization
  could not be preserved"）。塑造了现有代码形态的编译器约束（务必继续
  遵守）：渲染期禁止写 ref（在 useEffect 里同步）；组件/钩子内禁止
  try/finally 语句（用 promise 的 .catch()/.finally()）；组件体内禁止
  import() 表达式（提升到模块级）；渲染期禁止读可变模块级状态（缓存、
  单例）——编译器会把这类读当作纯计算缓存住陈旧值。跨渲染数据一律走
  state 传递，缓存在 effect 里同步（键切换不允许画出旧帧时用
  useLayoutEffect）。
- 前端入口：`src/index.tsx` 定义路由并在 Tauri 内等待 `get_server_port`；
  `src/App.tsx` 是应用外壳与 Tauri 事件监听；路由名在 `src/config.ts`。
- Rust 入口：`src-tauri/src/main.rs` 调用 `lettura_lib::run()`（定义在
  `src-tauri/src/lib.rs`）：加载配置、打开 SQLite、跑内嵌 Diesel 迁移、
  启动 Actix 服务、注册 Tauri 命令、托盘/菜单处理器与调度器。
- 状态是单一 Zustand store（`useAppStore`，`src/stores/index.ts`），由
  feed、article、user config、podcast 四个 slice 组合而成。

## 常用命令

- 安装：`pnpm install`（`.npmrc` 设了 `auto-install-peers=true`）。
- 仅前端开发：`pnpm dev`（Vite 固定端口 9527）。
- 桌面完整开发：`pnpm tauri dev`（经 `src-tauri/tauri.conf.json` 运行
  `pnpm dev`）。
- 前端构建/类型检查：`pnpm build`（`tsc && vite build`）；Vite 输出到
  `build/`，不是 `dist/`。
- 桌面构建：`pnpm tauri build`。
- 前端测试：`pnpm test`；单文件：`pnpm test path/to/file.test.ts`。
- Rust 测试：在仓库根跑 `cargo test`（workspace 成员是 `src-tauri` 与
  `packages/*`）；`pnpm cargo:check|cargo:test|cargo:fmt` 是便捷封装。
- Lint/格式化用 Biome（`apps/desktop/biome.json`），不是 ESLint/Prettier：
  `npx biome check src/` 与 `npx biome format src/`（在 `apps/desktop/`
  下执行）。

## 运行时与存储要点

- Vite 固定 `server.strictPort = true`，端口 9527。Actix API 服务先用配置
  端口，被占用则回落 8000-9000。
- Tauri 之外，`src/index.tsx` 把 `localStorage.port` 默认为 `3456`；Tauri
  内渲染前调用 `invoke("get_server_port")`。
- 生产 SQLite 库是 `~/.lettura/lettura.db`。设置 `LETTURA_ENV` 后，Rust 经
  `dotenv` 从环境变量读 `DATABASE_URL`。
- 用户配置是 TOML（正常运行为 `~/.lettura/lettura.toml`，dev 模式为本地
  文件），不在 SQLite schema 内。
- 播客数据是独立的浏览器端 Dexie/IndexedDB（`src/helpers/podcastDB.ts`），
  读写统一收口在 `stores/createPodcastSlice.ts` 的 action 与渲染端
  useLiveQuery。
- 关闭主窗口是隐藏到系统托盘，不是退出。

## 测试要点

- Vitest 使用 `vitest.config.ts`：开启 globals，jsdom 环境，setup 文件为
  `src/__tests__/setup.ts`（测试管线同样挂了 React Compiler 编译器）。
- setup 文件 mock 了 `localStorage`、`@tauri-apps/api/core` 的 `invoke`、
  `@tauri-apps/api/event`、`@tauri-apps/api/webviewWindow`、
  `@tauri-apps/plugin-shell`、`@tauri-apps/plugin-fs`、
  `@tauri-apps/plugin-dialog` 和全局 `fetch`；测试在没有真实 Tauri 后端时
  也能通过，判断测试结果时要记住这一点。
- 前端测试主要在 `src/stores/__tests__/`、`src/helpers/__tests__/`、
  `src/hooks/__tests__/`；Rust 测试如 `src-tauri/src/cmd.rs`、
  `src-tauri/src/core/scheduler.rs`。

## 样式与 i18n

- Tailwind v3 + Radix UI 主题令牌配置在 `tailwind.config.js`；暗色模式基于
  class/data-attribute，应用切换 `body.dark-theme`。
- shadcn 风格组件在 `src/components/ui/`；组合类名优先用
  `src/helpers/cn.tsx` 的 `cn`。
- 0.2.0 的 UI 由 `src/styles/fusion.css`（全局 `fusion-*` 类）承载，经
  `src/index.css` → `styles/index.css` 分层引入；Astryx 主题来自 npm 包
  `@astryxdesign/theme-*`。无 PWA/service worker（vite-plugin-pwa 已移除，
  忽略提及它的旧笔记）。
- i18n 在 `src/i18n.ts` 初始化；语言包为 `src/locales/en.json` 与
  `src/locales/zh.json`。

## Rust 后端要点

- Diesel schema 输出在 `src-tauri/src/schema.rs`；迁移在
  `src-tauri/migrations/`，由 `embed_migrations!` 内嵌。
- 调度器（`core/scheduler.rs`）按到期驱动：每 60s tick 一次，同步
  `last_sync_date + (sync_interval 或 update_interval)` 已到期的源，然后每
  个源 emit `sync://completed` `{uuid, title, inserted, error}`（在
  `src/App.tsx` 监听）。源行的 `last_sync_date` 以本地时间存
  "YYYY-MM-DD HH:MM:SS" 字符串。
- Rust 模块按职责拆分：`core/`（配置/菜单/调度/托盘）、`feed/`（文章/
  频道/文件夹/OPML）、`server/`（Actix 路由）。托盘与菜单在 `setup()` 里
  用 `TrayIconBuilder`/`MenuBuilder` 构建。
- Tauri v2 是插件架构：shell、fs、dialog、http、process、updater、log、
  single-instance 都是独立插件（Rust crate 与 npm 包成对）。权限声明在
  `src-tauri/capabilities/default.json`（取代 v1 的 allowlist）。
- `LETTURA_ENV` 开启调试日志并改变配置/数据库行为；不要假设 dev 与生产
  路径一致。

## CI 与发布

- `.github/workflows/release.yml` 在 push 到 `release` 时运行：创建 draft
  release，再用 Tauri 构建 macOS、Ubuntu、Windows 产物。
- `.github/workflows/deploy-doc.yml` 在 `master` 上运行，把 `docs/` 的
  Astro 文档站部署到 GitHub Pages。
- `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml` 三处
  版本号保持同步。
