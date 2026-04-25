# AGENTS.md

Compact, repo-specific notes for future OpenCode sessions. Trust executable
config over prose when something conflicts.

## Project shape

- Lettura is a Tauri v2 desktop feed reader: React/Vite frontend plus Rust
  backend in the `apps/desktop/src-tauri` Cargo workspace member.
- The backend has two communication paths. `src/helpers/dataAgent.ts` mixes
  Tauri IPC (`invoke` from `@tauri-apps/api/core`, implemented in
  `src-tauri/src/cmd.rs`) with localhost HTTP calls (`src/helpers/request.ts`,
  implemented under `src-tauri/src/server/handlers/`). Check the existing path
  before adding a new API.
- Main frontend entrypoints: `src/index.tsx` defines routes and waits for
  `get_server_port` inside Tauri; `src/App.tsx` is the app shell and Tauri event
  listener; routes are named in `src/config.ts`.
- Main Rust entrypoint: `src-tauri/src/main.rs` calls `lettura_lib::run()`
  defined in `src-tauri/src/lib.rs`, which loads config, opens SQLite, runs
  embedded Diesel migrations, starts the Actix server, registers Tauri
  commands, tray/menu handlers, and the scheduler.
- State is one Zustand store (`useBearStore`) in `src/stores/index.ts`, composed
  from feed, article, user config, and podcast slices.

## Commands

- Install: `pnpm install` (`.npmrc` sets `auto-install-peers=true`).
- Frontend dev only: `pnpm dev` (Vite on fixed port 3000).
- Full desktop dev: `pnpm tauri dev` (runs `pnpm dev` via
  `src-tauri/tauri.conf.json`).
- Frontend build/typecheck: `pnpm build` (`tsc && vite build`); Vite outputs to
  `build/`, not `dist/`.
- Desktop build: `pnpm tauri build`.
- Frontend tests: `pnpm test`; focused test: `pnpm test path/to/file.test.ts`.
- Rust tests: run `cargo test` from repo root (workspace member is
  `src-tauri`).
- Lint/format use Rome 11 config, not ESLint/Prettier:
  `npx rome check src/` and `npx rome format src/`.

## Runtime and storage gotchas

- Vite uses `server.strictPort = true` on port 3000. The Actix API server uses
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

## Styling, PWA, and i18n

- Tailwind v3 + Radix UI theme tokens are configured in `tailwind.config.js`;
  dark mode is class/data-attribute based and the app toggles `body.dark-theme`.
- shadcn-style components live in `src/components/ui/`; prefer the existing
  `cn` helper in `src/helpers/cn.tsx` when composing classes there.
- PWA is enabled with `vite-plugin-pwa` `injectManifest`; service worker source
  is `src/worker/sw.ts`.
- i18n is initialized in `src/i18n.ts`; locale files are
  `src/locales/en.json` and `src/locales/zh.json`.

## Rust backend notes

- Diesel schema output is `src-tauri/src/schema.rs`; migrations live in
  `src-tauri/migrations/` and are embedded by `embed_migrations!`.
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
