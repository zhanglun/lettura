# Lettura pnpm Workspace Monorepo 迁移实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将当前平铺结构的 Lettura 仓库迁移为 `apps/desktop` + `apps/docs` 的 pnpm workspace monorepo 布局。

**Architecture:** 根目录变为 workspace 协调器（`pnpm-workspace.yaml` + 根 `package.json`），桌面应用（React/Vite 前端 + Tauri v1 Rust 后端）整体移入 `apps/desktop/`，文档站点（Astro）移入 `apps/docs/`。本轮不引入共享包、Nx 或 Turborepo。

**Tech Stack:** pnpm workspaces, Tauri v1, React/Vite, Vitest, Astro, GitHub Actions

---

## 目录结构（目标）

```
lettura/                          ← workspace 根（协调器）
├── pnpm-workspace.yaml           ← 新增：声明 workspace 成员
├── package.json                  ← 改造：变为 workspace 根配置
├── Cargo.toml                    ← 更新：workspace members 路径
├── Cargo.lock                    ← 保留：cargo 自动更新
├── .npmrc                        ← 保留原位（workspace 级生效）
├── .gitignore                    ← 更新路径
├── README.md                     ← 更新开发命令说明
├── apps/
│   ├── desktop/                  ← 原 根目录 全部内容
│   │   ├── package.json          ← 原 根package.json（name 改为 @lettura/desktop）
│   │   ├── components.json       ← shadcn UI 配置
│   │   ├── rome.json             ← linter/formatter 配置
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── tsconfig.node.json
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   ├── vitest.config.ts
│   │   ├── index.html
│   │   ├── scripts/
│   │   ├── src/                  ← 全部前端源码
│   │   └── src-tauri/            ← Rust 后端（Cargo.toml 等）
│   └── docs/                     ← 原 docs/ 全部内容
│       ├── package.json          ← 原 docs/package.json
│       ├── superpowers/          ← 计划和技能文档
│       ├── astro.config.mjs
│       ├── tailwind.config.cjs
│       ├── tsconfig.json
│       └── ...
├── screenshots/                  ← 保留根级静态资源
└── .github/workflows/            ← 更新 CI 路径
```

---

## 阶段 0：前置准备（验证 + 分支）

**目的：** 创建安全回退点，确认当前状态可工作。

- [ ] **步骤 0.1：创建迁移分支**

```bash
git checkout -b chore/pnpm-workspace-migration
```

- [ ] **步骤 0.2：验证当前状态**

```bash
pnpm install
pnpm build          # tsc && vite build — 确认无错误
pnpm test           # vitest — 确认测试通过
```

预期：全部通过。如有失败先修复。

- [ ] **步骤 0.3：提交当前状态（确保 working tree 干净）**

```bash
git add -A && git commit -m "chore: clean state before monorepo migration"
```

---

## 阶段 1：创建目标目录结构

**目的：** 建立空壳结构，为文件移动做准备。

- [ ] **步骤 1.1：创建 apps 目录**

```bash
mkdir -p apps/desktop
mkdir -p apps/docs
```

---

## 阶段 2：移动 docs 到 apps/docs

**目的：** docs 是独立 Astro 项目，移动最简单，先处理。

- [ ] **步骤 2.1：移动 docs 全部内容**

```bash
git mv docs/README.md apps/docs/README.md
git mv docs/package.json apps/docs/package.json
git mv docs/astro.config.mjs apps/docs/astro.config.mjs
git mv docs/tailwind.config.cjs apps/docs/tailwind.config.cjs
git mv docs/tsconfig.json apps/docs/tsconfig.json
git mv docs/LICENSE apps/docs/LICENSE
git mv docs/screenshots.jpg apps/docs/screenshots.jpg
git mv docs/.prettierignore apps/docs/.prettierignore
git mv docs/.prettierrc.mjs apps/docs/.prettierrc.mjs
git mv docs/public apps/docs/public
git mv docs/src apps/docs/src
git mv docs/superpowers apps/docs/superpowers
```

> **注意：** `docs/.astro/` 和 `docs/node_modules/` 不需要移动（git 已忽略）。
> `docs/superpowers/` 包含计划和技能文档，必须一并移入 `apps/docs/`。

- [ ] **步骤 2.2：删除旧的 docs lockfile 和空目录**

```bash
rm -f docs/pnpm-lock.yaml
rm -rf docs/
```

> workspace 根会生成统一的 lockfile。

---

## 阶段 3：移动桌面应用到 apps/desktop

**目的：** 将根目录的所有桌面应用文件移入 apps/desktop。

- [ ] **步骤 3.1：移动前端源码和资源**

```bash
git mv src apps/desktop/src
git mv public apps/desktop/public   # 如果存在 public/ 目录
git mv scripts apps/desktop/scripts
```

- [ ] **步骤 3.2：移动配置文件**

```bash
git mv vite.config.ts apps/desktop/vite.config.ts
git mv tsconfig.json apps/desktop/tsconfig.json
git mv tsconfig.node.json apps/desktop/tsconfig.node.json
git mv tailwind.config.js apps/desktop/tailwind.config.js
git mv postcss.config.js apps/desktop/postcss.config.js
git mv vitest.config.ts apps/desktop/vitest.config.ts
git mv index.html apps/desktop/index.html
```

- [ ] **步骤 3.3：移动 package.json**

```bash
git mv package.json apps/desktop/package.json
```

- [ ] **步骤 3.4：移动 Rust 后端**

```bash
git mv src-tauri apps/desktop/src-tauri
```

- [ ] **步骤 3.5：移动桌面工具链配置**

```bash
git mv components.json apps/desktop/components.json
git mv rome.json apps/desktop/rome.json
```

- `components.json`（shadcn 配置）引用 `"config": "tailwind.config.js"` 和 `"css": "src/index.css"`，这些路径在移动后相对于 `apps/desktop/` 仍然正确。
- `rome.json`（linter/formatter 配置）引用 `./node_modules/rome/configuration_schema.json`，移动后 `node_modules` 在 `apps/desktop/node_modules/`，路径正确。

**不移动、保留在根的文件：** `.npmrc`、`.gitignore`、`README.md`、`screenshots/`、`.github/`、`LICENSE`（如有）、`Cargo.toml`（根级 Cargo workspace）、`Cargo.lock`、`.editorconfig`、`.vscode/`、`MacOS-icon.png`、`prd/`

---

## 阶段 4：配置 workspace 根

**目的：** 建立根级 workspace 协调配置。

- [ ] **步骤 4.1：创建 pnpm-workspace.yaml**

**文件：** `pnpm-workspace.yaml`（根目录新建）

```yaml
packages:
  - "apps/*"
```

- [ ] **步骤 4.2：创建根 package.json**

**文件：** `package.json`（根目录新建）

```json
{
  "name": "lettura-monorepo",
  "private": true,
  "version": "0.1.22",
  "scripts": {
    "dev:desktop": "pnpm --filter @lettura/desktop dev",
    "dev:docs": "pnpm --filter @lettura/docs dev",
    "build:desktop": "pnpm --filter @lettura/desktop build",
    "build:docs": "pnpm --filter @lettura/docs build",
    "tauri": "pnpm --filter @lettura/desktop tauri",
    "test": "pnpm --filter @lettura/desktop test",
    "preview": "pnpm --filter @lettura/desktop preview",
    "create-json": "pnpm --filter @lettura/desktop create-json"
  }
}
```

> filter 名称需要与子包 `name` 字段一致。

- [ ] **步骤 4.3：更新根 Cargo.toml workspace 路径**

**文件：** `Cargo.toml`（根目录）

**变更：**
```toml
# 当前
[workspace]
members = ["src-tauri"]

# 改为
[workspace]
members = ["apps/desktop/src-tauri"]
```

> `Cargo.lock`（根目录）也需保留，`cargo build` 会自动更新其中的路径引用。

- [ ] **步骤 4.4：确认 .npmrc 保留原位**

当前 `.npmrc` 内容 `auto-install-peers=true` 对整个 workspace 有效，无需修改。

---

## 阶段 5：修改 apps/desktop/package.json

**目的：** 更新包名，适配 workspace filter。

- [ ] **步骤 5.1：修改包名**

**文件：** `apps/desktop/package.json`

**变更：** `"name": "lettura"` → `"name": "@lettura/desktop"`

scripts 部分保持不变（`dev`、`build`、`preview`、`tauri`、`create-json`、`test`），它们相对于 `apps/desktop/` 执行。

---

## 阶段 6：确认 tauri.conf.json 无需修改

**目的：** 验证 Tauri 配置在移动后仍然有效。

- [ ] **步骤 6.1：审查 tauri.conf.json**

**文件：** `apps/desktop/src-tauri/tauri.conf.json`

当前值：
```json
"beforeBuildCommand": "pnpm build",
"beforeDevCommand": "pnpm dev",
"devPath": "http://localhost:3000/",
"distDir": "../build"
```

**分析：**
- `beforeBuildCommand: "pnpm build"` — Tauri 从 `src-tauri/` 的父目录执行，迁移后父目录为 `apps/desktop/`，有 package.json 的 build script。**正确，无需修改。**
- `beforeDevCommand: "pnpm dev"` — 同理。**无需修改。**
- `devPath: "http://localhost:3000/"` — Vite 仍监听 3000。**无需修改。**
- `distDir: "../build"` — 相对 `src-tauri/` 即 `apps/desktop/build/`，与 Vite outDir 匹配。**无需修改。**
- `$schema: "../node_modules/@tauri-apps/cli/schema.json"` — 相对路径仍有效。**无需修改。**

**结论：tauri.conf.json 无需任何修改。** ✅

---

## 阶段 7：确认桌面应用内部配置无需修改

**目的：** 逐一确认各配置文件的相对路径在移动后仍然有效。

- [ ] **步骤 7.1：vite.config.ts** — `__dirname` + 相对路径自动适配。无需修改。✅
- [ ] **步骤 7.2：tsconfig.json** — `include: ["src"]`、`paths`、`references` 均为相对路径。无需修改。✅
- [ ] **步骤 7.3：vitest.config.ts** — `setupFiles` 和 `alias` 均为相对路径。无需修改。✅
- [ ] **步骤 7.4：tailwind.config.js** — `content` 路径均为相对路径。无需修改。✅
- [ ] **步骤 7.5：postcss.config.js** — 纯配置，无路径引用。无需修改。✅
- [ ] **步骤 7.6：index.html** — Vite 服务路径自动适配。无需修改。✅
- [ ] **步骤 7.7：scripts/update-version.mjs** — `import.meta.dirname + "/../package.json"` 路径仍然正确。无需修改。✅
- [ ] **步骤 7.8：scripts/updater.mjs** — 使用 `process.cwd()` 和 GitHub API，无本地路径依赖。无需修改。✅

---

## 阶段 8：修改 apps/docs/package.json

**目的：** 统一包名以便 workspace filter。

- [ ] **步骤 8.1：修改包名（推荐但可选）**

**文件：** `apps/docs/package.json`

**变更：** `"name": "astro-landing-page"` → `"name": "@lettura/docs"`

其余内容保持不变。

---

## 阶段 9：更新 .gitignore

**目的：** 确保忽略规则覆盖新结构。

- [ ] **步骤 9.1：添加 .astro/ 忽略**

**文件：** `.gitignore`（根目录）

现有规则（`node_modules`、`build`、`target` 等）已经递归匹配子目录，无需修改。

建议新增：
```
.astro/
```

---

## 阶段 10：更新 CI 工作流

**目的：** CI 路径需要适配新目录结构。

### 10.1：release.yml

**文件：** `.github/workflows/release.yml`

- [ ] **步骤 10.1.1：更新版本号读取路径**

```yaml
# 当前（约第 28 行）
run: echo "PACKAGE_VERSION=$(node -p "require('./src-tauri/tauri.conf.json').package.version")" >> $GITHUB_ENV

# 改为
run: echo "PACKAGE_VERSION=$(node -p "require('./apps/desktop/src-tauri/tauri.conf.json').package.version")" >> $GITHUB_ENV
```

- [ ] **步骤 10.1.2：更新 Rust cache 路径**

```yaml
# 当前（约第 82-83 行）
with:
  workspaces: './src-tauri -> target'

# 改为
with:
  workspaces: './apps/desktop/src-tauri -> target'
```

- [ ] **步骤 10.1.3：pnpm install 保持不变**

workspace 根执行 `pnpm install` 会安装所有子包依赖。

- [ ] **步骤 10.1.4：更新 tauri-action 的 projectPath**

```yaml
# 当前
- name: Build the app
  uses: tauri-apps/tauri-action@v0.4

# 改为
- name: Build the app
  uses: tauri-apps/tauri-action@v0.4
  with:
    projectPath: apps/desktop
    releaseId: ${{ needs.create-release.outputs.release_id }}
```

> ⚠️ **风险点：** 需确认 `tauri-action@v0.4` 是否支持 `projectPath`。如不支持，备选方案是用 `working-directory: apps/desktop` 替代。

### 10.2：deploy-doc.yml

**文件：** `.github/workflows/deploy-doc.yml`

- [ ] **步骤 10.2.1：更新文档部署路径**

```yaml
# 当前（约第 26 行）
with:
    path: ./docs

# 改为
with:
    path: ./apps/docs
```

---

## 阶段 11：更新 README.md

**目的：** 更新开发/构建命令说明。

**文件：** `README.md`（根目录）

- [ ] **步骤 11.1：更新开发命令文档**

更新内容示例：

```markdown
### 开发和构建

开发模式：
```bash
pnpm dev:desktop    # 或在 apps/desktop/ 目录下执行 pnpm dev
pnpm tauri dev      # 通过根 workspace script
```

构建：
```bash
pnpm build:desktop  # 仅构建前端
pnpm tauri build    # 构建完整桌面应用
```

文档站点：
```bash
pnpm dev:docs       # 开发文档
pnpm build:docs     # 构建文档
```
```

---

## 阶段 12：安装依赖并验证

**目的：** 从全新状态验证 workspace 工作正常。

- [ ] **步骤 12.1：清理旧依赖**

```bash
rm -rf node_modules
rm -rf apps/desktop/node_modules
rm -rf apps/docs/node_modules
rm -rf apps/desktop/src-tauri/target
rm -f pnpm-lock.yaml
```

- [ ] **步骤 12.2：安装 workspace 依赖**

```bash
pnpm install
```

预期：pnpm 识别 `pnpm-workspace.yaml`，为 `apps/desktop` 和 `apps/docs` 分别安装依赖，生成根级 `pnpm-lock.yaml`。

验证点：检查 `apps/desktop/node_modules/` 和 `apps/docs/node_modules/` 是否正确生成。

- [ ] **步骤 12.3：验证前端构建**

```bash
pnpm build:desktop
```

预期：`tsc` 和 `vite build` 成功，输出到 `apps/desktop/build/`。

- [ ] **步骤 12.4：验证测试**

```bash
pnpm test
```

预期：vitest 运行 `apps/desktop/src/__tests__/` 下的测试并通过。

- [ ] **步骤 12.5：验证 Rust 构建（可选但推荐）**

```bash
cd apps/desktop/src-tauri && cargo build && cd ../../..
```

预期：Rust 编译成功。

- [ ] **步骤 12.6：验证 Tauri 完整构建**

```bash
pnpm tauri build
```

> 此步骤可能耗时较长（5-15 分钟），但这是最终验收标准。

- [ ] **步骤 12.7：验证 docs 构建**

```bash
pnpm build:docs
```

预期：Astro 构建成功。

---

## 阶段 13：提交迁移

- [ ] **步骤 13.1：提交所有变更**

```bash
git add -A
git commit -m "chore: migrate to pnpm workspace monorepo (apps/desktop + apps/docs)"
```

---

## 变更文件清单汇总

### 新建文件
| 文件 | 说明 |
|------|------|
| `pnpm-workspace.yaml` | workspace 声明 |
| `package.json`（根） | workspace 协调器 |
| `apps/desktop/` | 整个目录（从根移动） |
| `apps/docs/` | 整个目录（从 docs/ 移动） |

### 修改文件
| 文件 | 变更内容 |
|------|----------|
| `apps/desktop/package.json` | `name`: `"lettura"` → `"@lettura/desktop"` |
| `apps/docs/package.json` | `name`: `"astro-landing-page"` → `"@lettura/docs"`（可选） |
| `Cargo.toml`（根） | `members`: `["src-tauri"]` → `["apps/desktop/src-tauri"]` |
| `.github/workflows/release.yml` | 路径更新（tauri.conf.json 路径、rust-cache workspaces、tauri-action projectPath） |
| `.github/workflows/deploy-doc.yml` | `path: ./docs` → `./apps/docs` |
| `README.md` | 更新开发/构建命令说明 |
| `.gitignore` | 可选添加 `.astro/` |

### 无需修改的文件
| 文件 | 原因 |
|------|------|
| `apps/desktop/src-tauri/tauri.conf.json` | 所有路径均为相对路径，天然适配 |
| `apps/desktop/vite.config.ts` | `__dirname` + 相对路径自动适配 |
| `apps/desktop/tsconfig.json` | include/paths 均为相对路径 |
| `apps/desktop/tsconfig.node.json` | include 均为相对路径 |
| `apps/desktop/vitest.config.ts` | setupFiles/alias 均为相对路径 |
| `apps/desktop/tailwind.config.js` | content 路径均为相对路径 |
| `apps/desktop/postcss.config.js` | 无路径引用 |
| `apps/desktop/index.html` | Vite 服务路径自动适配 |
| `apps/desktop/scripts/*.mjs` | 使用 `import.meta.dirname` 相对定位 |
| `apps/desktop/components.json` | shadcn 配置引用均为相对路径，移动后正确 |
| `apps/desktop/rome.json` | linter 配置引用 `./node_modules/` 相对路径，移动后正确 |
| `apps/desktop/src-tauri/Cargo.toml` | Rust 依赖无路径变化 |
| `apps/docs/astro.config.mjs` | 无路径引用 |
| `apps/docs/tailwind.config.cjs` | content 路径为相对路径 |
| `apps/docs/tsconfig.json` | 相对路径 |
| `.npmrc` | workspace 级配置，位置不变 |

### 删除文件
| 文件 | 原因 |
|------|------|
| `docs/pnpm-lock.yaml` | 合并为根级 lockfile |
| 原根级 `pnpm-lock.yaml` | 重新生成 |

---

## 风险点与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 根 `Cargo.toml` workspace 路径未更新 | Rust 编译失败 | 阶段 4.3 显式更新 `members` 路径 |
| `docs/superpowers/` 遗漏导致数据丢失 | 计划文件和技能文档被 `rm -rf docs/` 删除 | 阶段 2.1 已包含 `git mv docs/superpowers` |
| `components.json`/`rome.json` 遗漏在根目录 | shadcn CLI 和 Rome linter 路径失效 | 阶段 3.5 已包含移动这两个文件 |
| pnpm 6 的 workspace 行为与 8/9 不同 | lockfile 格式、依赖解析差异 | 本轮保持 pnpm 版本不变，后续单独升级 |
| `tauri-action@v0.4` 可能不支持 `projectPath` | CI 构建失败 | 查阅文档确认；如不支持，改用 `working-directory` |
| vitest alias `{ '@': '/src' }` 在 monorepo 中解析异常 | 测试失败 | 改为 `path.resolve(__dirname, 'src')` |
| docs 独立 lockfile 合并后依赖版本冲突 | 安装失败 | 逐个解决冲突，必要时用 `pnpm override` |

### 回滚策略

整个迁移在 `chore/pnpm-workspace-migration` 分支上进行。如遇无法解决的问题：

```bash
git checkout main  # 或 master
git branch -D chore/pnpm-workspace-migration
```

由于所有变更都在一个分支上，回退成本为零。

---

## 验收标准

- [ ] `pnpm install` 在根目录成功，生成统一 `pnpm-lock.yaml`
- [ ] `pnpm build:desktop` 成功，输出 `apps/desktop/build/`
- [ ] `pnpm test` 通过，所有前端测试绿色
- [ ] `pnpm tauri dev` 能启动桌面应用（开发模式）
- [ ] `pnpm tauri build` 能生成安装包
- [ ] `pnpm build:docs` 成功，输出 `apps/docs/dist/`
- [ ] `pnpm dev:docs` 能启动文档开发服务器
- [ ] CI workflow release.yml 能正确读取版本号并构建
- [ ] CI workflow deploy-doc.yml 能正确部署文档
- [ ] `apps/desktop/src-tauri/` 内的 Rust 代码编译无错
- [ ] 不存在未预期的根级 `node_modules/`（应在子包中）
- [ ] `.gitignore` 正确忽略所有 build/target/node_modules 目录
