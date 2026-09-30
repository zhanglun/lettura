# AGENTS.md

Compact, repo-specific notes for future OpenCode sessions. Trust executable
config over prose when something conflicts.

## Project shape

- Lettura is a Tauri v2 desktop feed reader: React/Vite frontend plus Rust
  backend in the `apps/desktop/src-tauri` Cargo workspace member.
- Two overlapping workspaces share the repo tree: pnpm manages JS packages
  (`apps/desktop`, `apps/docs`, future `packages/*` with package.json) and the
  root Cargo.toml manages ALL Rust (member `apps/desktop/src-tauri` plus
  `packages/*`). pnpm silently ignores Rust dirs; keep one Cargo.lock at root.
- Subscription fetchers are separate crates under `packages/fetcher-*`
  (`fetcher-core` = `Fetcher` trait + `FetchedArticle`; `fetcher-rss` = parse/
  discovery layer; `fetcher-mail` = IMAP (async-imap 0.10 + mail-parser 0.11,
  both feature-locked); `fetcher-bilibili` = wbi-signed web API; `fetcher-site`
  + `site-rules` = TOML-driven site scraping engine). Fetchers are stateless
  and must not depend on diesel/tauri/actix; the registry, probe dispatch
  (`claims` order with rss fallback) and the `FetchedArticle → NewArticle`
  converters live in `src-tauri/src/fetchers/mod.rs`. Sync dispatch by
  `feeds.provider` happens in `feed/channel.rs::sync_articles`. Adding a
  source type = new crate + one registry line. Per-source config lives in
  `feeds.provider/account_uuid/source_config`; credentials live in the
  `source_accounts` table (`sources/account_service.rs`, commands
  `list/save/delete/test_source_account`). Mail syncs write a `last_uid`
  watermark back into `source_config`.
- Site rules: builtin TOML packs compile into `packages/site-rules/rules/`;
  user rules live in `~/.lettura/rules/*.toml` (same key overrides, hot
  reload on every load). `GET /api/generated/{key}?params` serves a rule's
  output as RSS (Lettura doubles as a local converter service);
  `GET /api/rules` lists rules. Import via `import_site_rule` command.
- Frontend data access is localhost HTTP only (`src/helpers/http.ts`
  `apiGet/apiPost` against the embedded Actix server on
  `http://127.0.0.1:{port}/api`, implemented in
  `src-tauri/src/server/handlers/`). dataAgent was removed (2026-09-30,
  commit 5a8278b4 reverted the earlier IPC-only collapse). Tauri `invoke`
  survives only for non-data commands (window/port, OPML, source accounts,
  site rules, feed add/preview). New data operations = new Actix handler;
  `GET /api/rules` and `GET /api/generated/{key}` also serve site-rule
  output as RSS for external consumers.
- Frontend data flow is two-lane (keep it that way): article list queries go
  through `src/hooks/useArticle.ts` (module-level cache + in-flight dedupe,
  single source of truth for list state); command-style POSTs may call
  `apiPost` directly, then refresh via `store.getSubscribes()` and/or
  `busChannel.emit("getChannels")` (AppLayout listens once). Do not add a
  third caching layer or re-introduce list state into the Zustand slices.
- Main frontend entrypoints: `src/index.tsx` defines routes and waits for
  `get_server_port` inside Tauri; `src/App.tsx` is the app shell and Tauri event
  listener; routes are named in `src/config.ts`.
- Main Rust entrypoint: `src-tauri/src/main.rs` calls `lettura_lib::run()`
  defined in `src-tauri/src/lib.rs`, which loads config, opens SQLite, runs
  embedded Diesel migrations, starts the Actix server, registers Tauri
  commands, tray/menu handlers, and the scheduler.
- State is one Zustand store (`useAppStore`) in `src/stores/index.ts`, composed
  from feed, article, user config, and podcast slices.

## Commands

- Install: `pnpm install` (`.npmrc` sets `auto-install-peers=true`).
- Frontend dev only: `pnpm dev` (Vite on fixed port 9527).
- Full desktop dev: `pnpm tauri dev` (runs `pnpm dev` via
  `src-tauri/tauri.conf.json`).
- Frontend build/typecheck: `pnpm build` (`tsc && vite build`); Vite outputs to
  `build/`, not `dist/`.
- Desktop build: `pnpm tauri build`.
- Frontend tests: `pnpm test`; focused test: `pnpm test path/to/file.test.ts`.
- Rust tests: run `cargo test` from repo root (workspace members are
  `src-tauri` and `packages/*`); `pnpm cargo:check|cargo:test|cargo:fmt` are
  convenience wrappers.
- Lint/format use Biome (`apps/desktop/biome.json`), not ESLint/Prettier:
  `npx biome check src/` and `npx biome format src/` (run from
  `apps/desktop/`).

## Runtime and storage gotchas

- Vite uses `server.strictPort = true` on port 9527. The Actix API server uses
  the configured app port, then falls back to 8000-9000 if occupied.
- Outside Tauri, `src/index.tsx` defaults `localStorage.port` to `3456`; inside
  Tauri it calls `invoke("get_server_port")` before rendering.
- Production SQLite DB is `~/.lettura/lettura.db`. With `LETTURA_ENV` set, Rust
  reads `DATABASE_URL` from env via `dotenv`.
- User config is TOML (`~/.lettura/lettura.toml` in normal runs; local file in
  dev mode), not part of the SQLite schema.
- Podcast data is separate browser-side Dexie/IndexedDB in
  `src/helpers/podcastDB.ts`.
- Closing the main window hides it to the system tray instead of quitting.

## Testing notes

- Vitest uses `vitest.config.ts`: globals enabled, jsdom environment, setup file
  `src/__tests__/setup.ts`.
- The setup file mocks `localStorage`, `@tauri-apps/api/core` `invoke`,
  `@tauri-apps/api/event`, `@tauri-apps/api/webviewWindow`,
  `@tauri-apps/plugin-shell`, `@tauri-apps/plugin-fs`,
  `@tauri-apps/plugin-dialog`, and global `fetch`; keep that in mind when
  tests pass without a live Tauri backend.
- Frontend tests live mainly under `src/stores/__tests__/` and
  `src/helpers/__tests__/`. Rust tests exist in files such as
  `src-tauri/src/cmd.rs` and `src-tauri/src/core/scheduler.rs`.

## Styling and i18n

- Tailwind v3 + Radix UI theme tokens are configured in `tailwind.config.js`;
  dark mode is class/data-attribute based and the app toggles `body.dark-theme`.
- shadcn-style components live in `src/components/ui/`; prefer the existing
  `cn` helper in `src/helpers/cn.tsx` when composing classes there.
- The 0.2.0 UI is carried by `src/styles/fusion.css` (global `fusion-*`
  classes), layered via `src/index.css` → `styles/index.css`; Astryx themes
  come from the npm `@astryxdesign/theme-*` packages. No PWA/service worker
  (vite-plugin-pwa was removed; ignore older notes mentioning it).
- i18n is initialized in `src/i18n.ts`; locale files are
  `src/locales/en.json` and `src/locales/zh.json`.

## Rust backend notes

- Diesel schema output is `src-tauri/src/schema.rs`; migrations live in
  `src-tauri/migrations/` and are embedded by `embed_migrations!`.
- The scheduler (`core/scheduler.rs`) is due-based: it ticks every 60s and
  syncs feeds where `last_sync_date + (sync_interval or update_interval)` has
  elapsed, then emits `sync://completed` `{uuid, title, inserted, error}` per
  feed (listened in `src/App.tsx`). Feed rows keep `last_sync_date` in Local
  time as "YYYY-MM-DD HH:MM:SS".
- Rust modules are split by concern: `core/` for config/menu/scheduler/tray,
  `feed/` for article/channel/folder/OPML logic, and `server/` for Actix routes.
  Tray and menu are built in `setup()` via `TrayIconBuilder`/`MenuBuilder`.
- Tauri v2 uses a plugin architecture: shell, fs, dialog, http, process,
  updater, log, and single-instance are separate plugins (both Rust crates and
  npm packages). Permissions are declared in
  `src-tauri/capabilities/default.json` instead of v1's allowlist.
- `LETTURA_ENV` enables debug logging and changes config/database behavior; do
  not assume dev and production paths are identical.

## CI and release

- `.github/workflows/release.yml` runs on pushes to `release`, creates a draft
  release, then builds macOS, Ubuntu, and Windows artifacts with Tauri.
- `.github/workflows/deploy-doc.yml` runs on `master` and deploys the Astro docs
  app in `docs/` to GitHub Pages.
- Keep versions synchronized across `package.json`,
  `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml`.
