# 刷新机制 / Feeds 重构 / Today 源列表 设计文档

日期: 2026-05-03
状态: Draft

## 概览

三项改进，解决 Today、Topics、Feeds 模块的体验差距：

- **A**: 刷新机制升级 — 全模块自动同步 + 手动同步
- **B**: Feeds 阅读体验 — RightPanel 模式对齐 Today
- **C**: Today 源列表 — 默认展开，允许跨 Signal 切换

---

## A: 刷新机制升级

### A1: Topics 自动刷新

TopicListPage 订阅 `pipeline:completed` Tauri 事件，pipeline 完成后自动重新拉取 topics。

模式：与 TodayPage 现有监听器一致。

文件: `apps/desktop/src/layout/Intelligence/Topics/TopicListPage.tsx`

```
useEffect(() => {
  const unlisten = listen('pipeline:completed', () => {
    store.fetchTopics();
  });
  return () => { unlisten.then(fn => fn()); };
}, []);
```

### A2: Feeds 自动同步（Rust Scheduler）

**问题**: `scheduler.rs` 已完整实现定时同步逻辑，但应用启动时未调用。`update_interval` 默认值为 0（禁用）。

**改动**:

1. `apps/desktop/src-tauri/src/lib.rs` — 在 `start_pipeline_timer()` 之后启动 scheduler：
   - 创建 `Scheduler::init()`，在 tokio spawn 中调用 `start()`
   - 或：通过 app_handle 编程式调用已有的 `start_scheduler` Tauri 命令

2. `apps/desktop/src-tauri/src/core/config.rs` — 将 `update_interval` 默认值从 `0` 改为 `1800`（30 分钟）。由于 serde 仅在 key 缺失时使用默认值，已安装用户的 toml 中如果写了 `update_interval: 0` 不受影响。要真正对所有用户生效：在 `get_user_config()` 中添加运行时覆盖 — 当 `update_interval == 0` 时，记录 deprecation 警告并按 `1800` 处理（除非用户通过新设置界面显式禁用，写入 `sync_disabled: true` 标记）

3. 设置界面 — 在用户设置中暴露 `update_interval` 配置项
   - 输入控件：数字输入框 + 单位（分钟）
   - 设置为 `0` 禁用自动同步
   - 运行时修改值应重启 scheduler（先 `stop_scheduler` 再 `start_scheduler`）

### A3: Feeds 手动同步

**问题**: `useRefresh` hook 已实现但无组件引用。

**方案**: 将批量同步逻辑从 `useRefresh` hook 迁移到 `createFeedSlice`，作为 `syncAllArticles()` action。避免 hook 依赖，任何组件均可调用。

`useRefresh` 原有逻辑：
- `setGlobalSyncStatus(true)` → 通过 `syncArticles()` 同步所有 feeds → `setGlobalSyncStatus(false)`
- 使用 `pLimit(threads)` 控制并发

`createFeedSlice` 新增 action：
```
syncAllArticles: async () => {
  set({ globalSyncStatus: true });
  const config = await getUserConfig();
  const feeds = get().subscribes;
  const limit = pLimit(config.threads || 5);
  await Promise.all(feeds.map(f => limit(() => get().syncArticles(f))));
  set({ globalSyncStatus: false });
  get().getSubscribes();
}
```

UI: 在 `Subscribes/index.tsx`（feed 列表头部区域，与现有"添加 Feed"/文件夹按钮并列）添加刷新按钮。同步中显示旋转图标，通过 `globalSyncStatus` 控制状态。同时在 `ArticleCol.tsx` 头部也添加刷新按钮，方便阅读文章时手动同步。

---

## B: Feeds 阅读体验（RightPanel 重构）

### B1: ArticleContainer 布局重构

**当前**: URL 驱动的条件渲染
```
ArticleContainer
├── ArticleCol (宽度: 100% 或 280px，取决于路由)
└── View (framer-motion AnimatePresence，条件渲染)
```

**目标**: 状态驱动 + RightPanel
```
ArticleContainer
├── ArticleCol (min-width: 360px，固定)
└── RightPanel (始终渲染，CSS transition 控制宽度)
    ├── 收起（未选中文章）: ~280px，空态占位
    └── 展开（选中文章）: flex-1，显示 View 文章详情
```

**改动**:

1. **`Article/index.tsx`**（ArticleContainer）：
   - 移除 `isListOnlyRoute` 宽度切换逻辑
   - ArticleCol 使用固定 `min-width: 360px`（不再基于百分比）
   - 添加 RightPanel 包裹 View，复用 TodayPage 的 RightPanel 模式
   - 移除 framer-motion AnimatePresence（改用 CSS transition）
   - RightPanel 收起态（未选中文章）：显示轻量占位 — 图标 + "选择文章开始阅读" 文案，居中，淡色。宽度 ~280px
   - RightPanel 展开态（选中文章）：flex-1，显示 View 组件展示文章详情

2. **`Article/View.tsx`**：
   - 已有 `closable` 和 `onClose` props — 直接使用
   - 关闭动作：清空活跃文章 + 收起 RightPanel
   - 移除 `navigate(-1)` 回退逻辑

3. **`components/ArticleItem/index.tsx`**：
   - 点击时：调用 `setArticle(article)`（store action），不再 `navigate()` 到文章 URL
   - 通过 store 状态变化触发 RightPanel 展开

4. **Deep-link 支持**：
   - 路由 `/local/feeds/:uuid/articles/:id` 仍然存在
   - ArticleContainer 挂载时：若 URL 包含文章 ID，调用 `setArticle()` 补齐状态
   - URL 深链接可用，页面内交互改为状态驱动

### B2: Sidebar 始终可见

**文件**: `components/layout/AppLayout.tsx`

`getSidebarContext` 对文章 URL 返回 `"hidden"` → 改为返回 `"feeds"`。

sidebar 上下文逻辑中的一行改动。

### B3: Store 状态扩展

在 `createArticleSlice` 中新增（或新建 `createFeedViewSlice`）：

```typescript
rightPanelExpanded: boolean;        // 默认 false
setRightPanelExpanded: (expanded: boolean) => void;
```

`setArticle()` 调用时 → 自动设置 `rightPanelExpanded = true`。
文章关闭时 → 设置 `rightPanelExpanded = false`。

### 键盘快捷键

现有快捷键（`o` 在浏览器打开、方向键导航）基于 `activeArticle` 状态运作，不依赖 URL，重构后应保持正常。

---

## C: Today 源列表默认展开

### C1: 源列表默认展开

**文件**: `SignalCard.tsx`

当前行为 (L280-296)：
- `maxHeight: isExpanded ? "2000px" : "0px"`
- `opacity: isExpanded ? 1 : 0`

改动：源列表始终可见（移除 maxHeight/opacity 切换）。保留展开/收起按钮但反转默认值：
- `isExpanded` 在 signal 首次渲染时默认为 `true`
- 按钮允许用户手动收起

实现方式：修改 `expandedSignalId` 初始化逻辑，或添加 `defaultExpanded: true` 行为。

### C2: 移除 dimmed 状态的 pointer-events-none

**文件**: `SignalList.tsx` L21

当前: `isDimmed ? "pointer-events-none" : ""`

改动：移除 `pointer-events-none`。保留透明度降低（0.6）的视觉反馈，但允许点击交互。

### C3: 修复跨 Signal 的 sourceIndex 重置

**文件**: `createTodaySlice.ts`

`startInlineReading`：当前在切换 signal 时会将 `sourceIndex` 重置为 0。

改动：始终使用传入的 `sourceIndex` 参数，无论用户之前是否在阅读其他 signal。

---

## 文件变更汇总

| 文件 | 改动 | 所属方案 |
|------|------|---------|
| `src-tauri/src/lib.rs` | 启动时启动 scheduler | A2 |
| `src-tauri/src/core/config.rs` | update_interval 默认值 0→1800 | A2 |
| `src/layout/Intelligence/Topics/TopicListPage.tsx` | 添加 pipeline:completed 监听 | A1 |
| `src/stores/createFeedSlice.ts` | 新增 syncAllArticles action | A3 |
| `src/hooks/useRefresh.ts` | 删除（逻辑迁入 store） | A3 |
| `src/layout/Subscribes/index.tsx` | 添加刷新按钮 | A3 |
| `src/layout/Article/ArticleCol.tsx` | 添加刷新按钮 | A3 |
| 设置界面组件 | 添加 update_interval 配置项 | A2 |
| `src/layout/Article/index.tsx` | RightPanel 布局重构 | B1 |
| `src/layout/Article/View.tsx` | 使用 closable/onClose，移除 navigate | B1 |
| `src/layout/Article/ArticleCol.tsx` | 固定宽度 | B1 |
| `src/components/layout/AppLayout.tsx` | Sidebar 文章 URL 时可见 | B2 |
| `src/stores/createArticleSlice.ts` | 新增 rightPanelExpanded 状态 | B3 |
| `src/components/ArticleItem/index.tsx` | 移除 navigate，使用 setArticle | B1 |
| `src/layout/Intelligence/SignalCard.tsx` | 源列表默认展开 | C1 |
| `src/layout/Intelligence/SignalList.tsx` | 移除 pointer-events-none | C2 |
| `src/stores/createTodaySlice.ts` | 修复 sourceIndex 重置 | C3 |

## 执行顺序

1. **C 先行**（最小改动，独立，对 Today 体验提升最大）
2. **A 其次**（中等规模，全模块刷新改进）
3. **B 最后**（最大规模，Feeds 重构 — 风险最高）

## 风险与缓解

| 风险 | 缓解措施 |
|------|---------|
| B: ArticleContainer 重构破坏键盘快捷键 | 重构后逐一测试所有快捷键 |
| B: Deep-link URL 失效 | 挂载时从 URL 参数显式补齐状态 |
| A2: 对所有用户生效的 30 分钟同步 | 已有 toml 配置的用户不受 serde 默认值影响；通过 `get_user_config()` 运行时覆盖 |
| B: Podcast overlay / ArticleDialogView 耦合 | 重构后验证这些路径仍正常工作 |
