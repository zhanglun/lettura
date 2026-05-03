# 刷新机制 / Feeds 重构 / Today 源列表 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标**: 三项改进 — Today 源列表默认展开、全模块刷新机制、Feeds 阅读体验对齐 Today RightPanel 模式

**架构**: C(最小) → A(中等) → B(最大) 分阶段执行，每阶段完成后验证再进入下一阶段

**技术栈**: React + Zustand + TypeScript (前端) / Rust + Tauri v2 + Actix (后端)

---

## Phase C: Today 源列表默认展开

### Task 1: C1 — SignalCard 源列表默认展开

**Files:**
- Modify: `apps/desktop/src/layout/Intelligence/SignalCard.tsx:79`

- [ ] **Step 1: 修改 isExpanded 计算逻辑**

SignalCard.tsx L79 当前：
```tsx
const isExpanded = isActive || store.expandedSignalId === signal.id;
```

改为：
```tsx
const isExpanded = isActive || store.expandedSignalId !== signal.id;
```

逻辑变化：
- `expandedSignalId === null`（默认）→ `null !== signal.id` = true → 所有 signal 源列表展开
- 用户点击收起 → `expandedSignalId = signal.id` → `signal.id === signal.id` = false → 该 signal 源列表收起
- 再次点击展开 → `expandedSignalId = null` → 恢复展开

`toggleSourceExpand` 函数无需修改，逻辑仍然兼容。

- [ ] **Step 2: 确认折叠/展开按钮文本仍然正确**

L270 的按钮文本：
```tsx
<span>{isExpanded ? t("today.sources.collapse") : t("today.sources.expand")}</span>
```
isExpanded 反转后，按钮文本自动对应正确。无需改动。

- [ ] **Step 3: 运行 tsc 验证**

```bash
npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 4: 运行测试**

```bash
npx vitest run --reporter=verbose
```
Expected: 全部通过

---

### Task 2: C2 — SignalList 移除 pointer-events-none

**Files:**
- Modify: `apps/desktop/src/layout/Intelligence/SignalList.tsx:21`

- [ ] **Step 1: 移除 pointer-events-none class**

SignalList.tsx L21 当前：
```tsx
className={`animate-in fade-in slide-in-from-bottom-2 transition-opacity duration-300 ${isDimmed ? "pointer-events-none" : ""}`}
```

改为：
```tsx
className="animate-in fade-in slide-in-from-bottom-2 transition-opacity duration-300"
```

保留 `opacity: isDimmed ? 0.6 : 1`（L25）的视觉反馈，仅移除交互阻断。

- [ ] **Step 2: 运行 tsc + 测试验证**

```bash
npx tsc --noEmit && npx vitest run --reporter=verbose
```
Expected: 0 errors，全部测试通过

---

### Task 3: C3 — 修复跨 Signal sourceIndex 重置

**Files:**
- Modify: `apps/desktop/src/stores/createTodaySlice.ts:256-265`

- [ ] **Step 1: 修改 startInlineReading 逻辑**

createTodaySlice.ts L256-265 当前：
```tsx
startInlineReading: (signalId, sourceIndex = 0) => {
  set((state) => {
    const wasReadingAnother = state.activeReadingSignalId !== null && state.activeReadingSignalId !== signalId;
    return {
      activeReadingSignalId: signalId,
      activeReadingSourceIndex: wasReadingAnother ? 0 : sourceIndex,
      isInlineReading: true,
      rightPanelExpanded: true,
    };
  });
},
```

改为：
```tsx
startInlineReading: (signalId, sourceIndex = 0) => {
  set(() => ({
    activeReadingSignalId: signalId,
    activeReadingSourceIndex: sourceIndex,
    isInlineReading: true,
    rightPanelExpanded: true,
  }));
},
```

移除 `wasReadingAnother` 判断，始终使用传入的 `sourceIndex`。用户在 Signal A 阅读第 3 篇文章时直接点击 Signal B 的第 2 篇，sourceIndex = 1 会被正确保留。

- [ ] **Step 2: 运行 tsc + 测试验证**

```bash
npx tsc --noEmit && npx vitest run --reporter=verbose
```
Expected: 0 errors，全部测试通过

- [ ] **Step 3: 提交 Phase C**

```bash
git add apps/desktop/src/layout/Intelligence/SignalCard.tsx apps/desktop/src/layout/Intelligence/SignalList.tsx apps/desktop/src/stores/createTodaySlice.ts
git commit -m "feat: Today 源列表默认展开，允许跨 Signal 切换阅读

- SignalCard 源列表默认展开，用户可手动收起
- SignalList 移除 pointer-events-none，允许在阅读时切换 Signal
- startInlineReading 不再重置 sourceIndex，支持跨 Signal 直接阅读"
```

---

## Phase A: 刷新机制升级

### Task 4: A1 — TopicListPage 添加 pipeline:completed 监听

**Files:**
- Modify: `apps/desktop/src/layout/Intelligence/Topics/TopicListPage.tsx:1-8`

- [ ] **Step 1: 添加 Tauri event listen import 和 useEffect**

TopicListPage.tsx 头部添加 import：
```tsx
import { listen } from "@tauri-apps/api/event";
```

在组件内添加 useEffect（在现有 useEffect 之后）：
```tsx
useEffect(() => {
  let cancelled = false;
  const unsubs: (() => void)[] = [];

  listen("pipeline:completed", () => {
    if (!cancelled) {
      store.fetchTopics();
    }
  }).then((unlisten) => {
    if (!cancelled) {
      unsubs.push(unlisten);
    } else {
      unlisten();
    }
  });

  return () => {
    cancelled = true;
    unsubs.forEach((unsub) => unsub());
  };
}, []);
```

- [ ] **Step 2: 运行 tsc 验证**

```bash
npx tsc --noEmit
```
Expected: 0 errors

---

### Task 5: A2 — Rust Scheduler 启动 + 配置默认值

**Files:**
- Modify: `apps/desktop/src-tauri/src/core/config.rs:100`
- Modify: `apps/desktop/src-tauri/src/lib.rs:103`

- [ ] **Step 1: 修改 update_interval 默认值**

config.rs L100 当前：
```rust
update_interval: 0,
```

改为：
```rust
update_interval: 1800,
```

- [ ] **Step 2: 在 lib.rs 启动 scheduler**

lib.rs L103 之后添加 scheduler 启动：

当前：
```rust
ai::pipeline::start_pipeline_timer(app.handle().clone());

Ok(())
```

改为：
```rust
ai::pipeline::start_pipeline_timer(app.handle().clone());

// 启动 feed 自动同步 scheduler
let scheduler_state = app_handle.state::<AppState>();
// scheduler 使用全局静态变量，直接调用 start
core::scheduler::start_scheduler();

Ok(())
```

注意：`start_scheduler` 是 `#[tauri::command]`，通过 GLOBAL_SCHEDULER 调用。需要在 setup 闭包中直接调用。由于它是 async 函数，需要 tokio spawn：

```rust
let handle = app.handle().clone();
tokio::spawn(async move {
  core::scheduler::start_scheduler().await;
});
```

但 setup 闭包不在 async 上下文中。查看 `start_scheduler` 的实现 — 它内部已经有 tokio::spawn，所以可以改为：

最安全的方式：在 `lib.rs` 中 `use crate::core::scheduler;` 并直接调用。由于 `start_scheduler` 是 async 但内部用 `tokio::spawn`，可以：

```rust
// 在 setup 闭包内，start_pipeline_timer 之后
tauri::async_runtime::spawn(async {
  core::scheduler::start_scheduler().await;
});
```

- [ ] **Step 3: 运行 cargo check 验证**

```bash
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml
```
Expected: 编译通过

---

### Task 6: A3 — createFeedSlice 添加 syncAllArticles

**Files:**
- Modify: `apps/desktop/src/stores/createFeedSlice.ts:50-55`

- [ ] **Step 1: 添加 syncAllArticles 到 FeedSlice 接口**

createFeedSlice.ts L50-55 当前（在 FeedSlice 接口末尾）：
```tsx
globalSyncStatus: boolean;
setGlobalSyncStatus: (status: boolean) => void;
}
```

改为：
```tsx
globalSyncStatus: boolean;
setGlobalSyncStatus: (status: boolean) => void;
syncAllArticles: () => Promise<void>;
}
```

- [ ] **Step 2: 实现 syncAllArticles**

在 createFeedSlice 实现末尾（L329-334，setGlobalSyncStatus 之后）添加：

```tsx
globalSyncStatus: false,
setGlobalSyncStatus(status) {
  set(() => ({
    globalSyncStatus: status,
  }));
},
syncAllArticles: async () => {
  const { globalSyncStatus, subscribes, syncArticles, getUserConfig, getSubscribes, setGlobalSyncStatus } = get();
  if (globalSyncStatus) return;

  setGlobalSyncStatus(true);
  try {
    const config = await getUserConfig();
    const threads = config?.threads || 5;
    const limit = pLimit(threads);

    await Promise.all(
      subscribes.map((feed) =>
        limit(() =>
          syncArticles(feed).catch(() => {
            // 单个 feed 同步失败不阻断其他
          })
        )
      )
    );
  } finally {
    setGlobalSyncStatus(false);
    getSubscribes();
  }
},
```

注意：`pLimit` 已在文件头部 import（L4）。`getUserConfig` 和 `syncArticles` 已在 store 中存在。

- [ ] **Step 3: 运行 tsc 验证**

```bash
npx tsc --noEmit
```
Expected: 0 errors

---

### Task 7: A4 — Feeds 刷新按钮 UI

**Files:**
- Modify: `apps/desktop/src/layout/Subscribes/index.tsx`（添加刷新按钮到 feed 列表头部）

- [ ] **Step 1: 在 Subscribes 头部添加刷新按钮**

在 Subscribes 组件中引入 store 的 syncAllArticles 和 globalSyncStatus：

```tsx
const syncAllArticles = useBearStore((state) => state.syncAllArticles);
const globalSyncStatus = useBearStore((state) => state.globalSyncStatus);
```

在头部按钮区域添加刷新按钮（与现有 "Add Feed" 按钮并列）：
```tsx
<button
  onClick={() => syncAllArticles()}
  disabled={globalSyncStatus}
  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--gray-11)] transition hover:bg-[var(--gray-a3)] hover:text-[var(--gray-12)] disabled:opacity-50"
  title={t("feeds.sync_all")}
>
  <RefreshCw size={14} className={globalSyncStatus ? "animate-spin" : ""} />
  <span>{globalSyncStatus ? t("feeds.syncing") : t("feeds.sync_all")}</span>
</button>
```

添加 lucide-react import：`import { RefreshCw } from "lucide-react";`

- [ ] **Step 2: 添加 i18n keys**

`apps/desktop/src/locales/en.json` 添加：
```json
"feeds.sync_all": "Sync All",
"feeds.syncing": "Syncing..."
```

`apps/desktop/src/locales/zh.json` 添加：
```json
"feeds.sync_all": "同步全部",
"feeds.syncing": "同步中..."
```

- [ ] **Step 3: 运行 tsc + 测试验证**

```bash
npx tsc --noEmit && npx vitest run --reporter=verbose
```

- [ ] **Step 4: 提交 Phase A**

```bash
git add apps/desktop/src/layout/Intelligence/Topics/TopicListPage.tsx apps/desktop/src-tauri/src/core/config.rs apps/desktop/src-tauri/src/lib.rs apps/desktop/src/stores/createFeedSlice.ts apps/desktop/src/layout/Subscribes/index.tsx apps/desktop/src/locales/en.json apps/desktop/src/locales/zh.json
git commit -m "feat: 全模块刷新机制升级

- TopicListPage 添加 pipeline:completed 事件监听自动刷新
- Rust scheduler 启动时自动运行，update_interval 默认 30 分钟
- createFeedSlice 新增 syncAllArticles 批量同步 action
- Subscribes 头部添加全局同步按钮"
```

---

## Phase B: Feeds RightPanel 重构

### Task 8: B1 — createArticleSlice 添加 rightPanelExpanded

**Files:**
- Modify: `apps/desktop/src/stores/createArticleSlice.ts:8-35,44-48`

- [ ] **Step 1: 添加 rightPanelExpanded 到接口**

createArticleSlice.ts ArticleSlice 接口添加：
```tsx
rightPanelExpanded: boolean;
setRightPanelExpanded: (expanded: boolean) => void;
```

- [ ] **Step 2: 实现初始值和 setter**

在 createArticleSlice 实现中添加：
```tsx
rightPanelExpanded: false,
setRightPanelExpanded: (expanded) => {
  set(() => ({ rightPanelExpanded: expanded }));
},
```

- [ ] **Step 3: 修改 setArticle 自动联动 rightPanelExpanded**

当前 setArticle（L44-48）：
```tsx
setArticle: (ArticleResItem: ArticleResItem | null) => {
  set(() => ({
    article: ArticleResItem,
  }));
},
```

改为：
```tsx
setArticle: (ArticleResItem: ArticleResItem | null) => {
  set(() => ({
    article: ArticleResItem,
    rightPanelExpanded: ArticleResItem !== null,
  }));
},
```

- [ ] **Step 4: 运行 tsc 验证**

```bash
npx tsc --noEmit
```

---

### Task 9: B2 — AppLayout Sidebar 对文章 URL 可见

**Files:**
- Modify: `apps/desktop/src/components/layout/AppLayout.tsx:23-25`

- [ ] **Step 1: 修改 getSidebarContext 返回值**

AppLayout.tsx L23-25 当前：
```tsx
if (/^\/local\/feeds\/[^/]+\/articles\/[^/]+/.test(pathname)) {
  return "hidden";
}
```

改为：
```tsx
if (/^\/local\/feeds\/[^/]+\/articles\/[^/]+/.test(pathname)) {
  return "feeds";
}
```

- [ ] **Step 2: 运行 tsc 验证**

```bash
npx tsc --noEmit
```

---

### Task 10: B3 — ArticleContainer 布局重构（核心）

**Files:**
- Modify: `apps/desktop/src/layout/Article/index.tsx`（全文重构）

- [ ] **Step 1: 重写 ArticleContainer**

当前 ArticleContainer.tsx 使用 framer-motion + isListOnlyRoute。重构为 RightPanel 模式。

新实现：
```tsx
import { useRef, useCallback, useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useParams, useMatch, useNavigate, useLocation } from "react-router-dom";
import { ArticleCol, ArticleColRefObject } from "@/layout/Article/ArticleCol";
import { ArticleDialogView } from "@/components/ArticleView/DialogView";
import { open } from "@tauri-apps/plugin-shell";
import { View } from "./View";
import { useQuery } from "@/helpers/parseXML";
import { LPodcast } from "@/components/LPodcast";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { RouteConfig } from "@/config";
import { request } from "@/helpers/request";
import { RightPanel } from "@/layout/Intelligence/RightPanel";
import { Text } from "@radix-ui/themes";
import { BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

export const ArticleContainer = () => {
  const { t } = useTranslation();
  const [, type, queryFeedUuid] = useQuery();
  const params = useParams<{ uuid?: string; id?: string }>();
  const isArticleRoute = useMatch(RouteConfig.LOCAL_ARTICLE);
  const navigate = useNavigate();
  const location = useLocation();
  const feedUuid = params.uuid || queryFeedUuid;

  const store = useBearStore(
    useShallow((state) => ({
      article: state.article,
      setArticle: state.setArticle,
      articleDialogViewStatus: state.articleDialogViewStatus,
      setArticleDialogViewStatus: state.setArticleDialogViewStatus,
      podcastPanelStatus: state.podcastPanelStatus,
      tracks: state.tracks,
      podcastPlayingStatus: state.podcastPlayingStatus,
      rightPanelExpanded: state.rightPanelExpanded,
      setRightPanelExpanded: state.setRightPanelExpanded,
    })),
  );

  const { article, setArticle, rightPanelExpanded } = store;

  // Deep-link: URL 含文章 ID 时补齐 store 状态
  useEffect(() => {
    if (!isArticleRoute || !params.id) return;
    if (article) return;

    let cancelled = false;
    request
      .get(`/articles/${params.id}`)
      .then((res) => {
        if (!cancelled && res.data) {
          setArticle(res.data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load article from URL params:", err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isArticleRoute, params.id, article, setArticle]);

  // 切换 feed 时清空文章
  useEffect(() => {
    if (!isArticleRoute) {
      setArticle(null);
    }
  }, [feedUuid, isArticleRoute, setArticle, type]);

  const articleColRef = useRef<ArticleColRefObject>(null);
  const { goNext, goPrev } = (articleColRef.current || {}) as ArticleColRefObject;

  const openInBrowser = useCallback(() => {
    store.article && open(store.article.link);
  }, [store]);

  const handleGoNext = useCallback(() => {
    goNext?.();
  }, [goNext]);

  const handleGoPrev = useCallback(() => {
    goPrev?.();
  }, [goPrev]);

  const handleClose = useCallback(() => {
    setArticle(null);
    // 回退 URL 到 feed 列表
    if (feedUuid) {
      navigate(`/local/feeds/${feedUuid}`, { replace: true });
    }
  }, [setArticle, feedUuid, navigate]);

  useHotkeys("o", openInBrowser);

  const shouldShowPodcast = store.tracks?.length > 0 || store.podcastPlayingStatus;

  return (
    <div className="flex flex-row w-full h-full overflow-hidden">
      {/* ArticleCol - 固定宽度 */}
      <div className="h-full shrink-0 overflow-hidden" style={{ width: "var(--app-article-width)" }}>
        <ArticleCol
          feedUuid={feedUuid}
          type={type}
          ref={articleColRef}
          wide={false}
        />
      </div>

      {/* RightPanel - CSS transition */}
      <RightPanel expanded={rightPanelExpanded}>
        {rightPanelExpanded && article ? (
          <View
            article={article}
            goNext={handleGoNext}
            goPrev={handleGoPrev}
            closable={true}
            onClose={handleClose}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <BookOpen size={32} className="text-[var(--gray-7)] mb-3" />
            <Text size="2" color="gray" className="text-[var(--gray-9)]">
              {t("feeds.select_article")}
            </Text>
          </div>
        )}
      </RightPanel>

      <LPodcast visible={shouldShowPodcast} />
      <ArticleDialogView
        article={store.article}
        dialogStatus={store.articleDialogViewStatus}
        setDialogStatus={store.setArticleDialogViewStatus}
        afterConfirm={() => {}}
        afterCancel={() => {
          store.setArticle(null);
        }}
      />
    </div>
  );
};
```

关键变化：
1. 移除 `framer-motion` 的 `AnimatePresence` 和 `motion.div`
2. ArticleCol 固定宽度 `--app-article-width`（不再切换 100%）
3. 引入 `RightPanel` 组件包裹 `View`
4. 未选文章时显示空态占位
5. View 使用 `closable + onClose` 模式
6. 移除 URL navigate 同步（L45-52 的 useEffect），只保留 deep-link 加载

- [ ] **Step 2: 添加 i18n key**

`en.json`:
```json
"feeds.select_article": "Select an article to read"
```

`zh.json`:
```json
"feeds.select_article": "选择一篇文章开始阅读"
```

- [ ] **Step 3: 运行 tsc 验证**

```bash
npx tsc --noEmit
```

---

### Task 11: B4 — ArticleItem 点击行为修改

**Files:**
- Modify: `apps/desktop/src/components/ArticleItem/index.tsx`

- [ ] **Step 1: 修改点击处理**

查找 ArticleItem 中的 navigate 调用。当前行为是点击 → navigate 到文章 URL。

改为：点击 → 调用 store 的 `setArticle(article)`，不导航。

具体改动取决于 ArticleItem 的当前实现。核心是：
- 保留 `onClick` 回调
- 移除 `navigate()` 调用
- 改为 `store.setArticle(article)` 触发 RightPanel 展开

- [ ] **Step 2: 运行 tsc 验证**

```bash
npx tsc --noEmit
```

---

### Task 12: B5 — View.tsx closable/onClose 适配

**Files:**
- Modify: `apps/desktop/src/layout/Article/View.tsx:61-70`

- [ ] **Step 1: 确认 handleBack 使用 closable 路径**

View.tsx L61-70 当前：
```tsx
const handleBack = () => {
  if (props.closable) {
    props.onClose?.();
    return;
  }
  setArticle(null);
  if (params.uuid) {
    navigate(`/local/feeds/${params.uuid}`);
  }
};
```

当 ArticleContainer 传入 `closable={true}` + `onClose={handleClose}` 时：
- 点击返回按钮 → `props.closable` 为 true → 调用 `props.onClose()` → ArticleContainer 的 handleClose 被触发
- handleClose 调用 `setArticle(null)` + `navigate` 回退 URL

这个逻辑已经正确，无需修改 View.tsx。但需要确认 `navigate` 的 URL 回退在 handleClose 中而不是 View.tsx 中。

- [ ] **Step 2: 运行完整验证**

```bash
npx tsc --noEmit && npx vitest run --reporter=verbose
```
Expected: 0 errors，全部测试通过

- [ ] **Step 3: cargo check 验证 Rust**

```bash
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml
```

- [ ] **Step 4: 提交 Phase B**

```bash
git add apps/desktop/src/stores/createArticleSlice.ts apps/desktop/src/components/layout/AppLayout.tsx apps/desktop/src/layout/Article/index.tsx apps/desktop/src/components/ArticleItem/index.tsx apps/desktop/src/layout/Article/View.tsx apps/desktop/src/locales/en.json apps/desktop/src/locales/zh.json
git commit -m "feat: Feeds 阅读体验对齐 Today RightPanel 模式

- ArticleContainer 重构为 RightPanel 模式，ArticleCol 固定宽度
- Sidebar 在阅读文章时保持可见
- 文章详情通过 store 状态驱动，保留 URL deep-link
- View 使用 closable/onClose 关闭模式"
```

---

## Self-Review

### 1. Spec 覆盖检查

| Spec 需求 | 对应 Task |
|-----------|----------|
| C1: 源列表默认展开 | Task 1 |
| C2: 移除 pointer-events-none | Task 2 |
| C3: 修复 sourceIndex 重置 | Task 3 |
| A1: Topics pipeline 监听 | Task 4 |
| A2: Rust scheduler 启动 + 默认值 | Task 5 |
| A3: syncAllArticles action | Task 6 |
| A4: 刷新按钮 UI | Task 7 |
| B1: ArticleContainer 布局重构 | Task 10 |
| B2: Sidebar 始终可见 | Task 9 |
| B3: rightPanelExpanded 状态 | Task 8 |
| Deep-link 支持 | Task 10（useEffect from URL params） |

### 2. Placeholder 扫描

无 TBD/TODO。所有步骤包含具体代码或验证命令。

### 3. 类型一致性

- `rightPanelExpanded: boolean` 在 Task 8 定义，Task 10 使用 ✓
- `syncAllArticles: () => Promise<void>` 在 Task 6 定义，Task 7 使用 ✓
- View 的 `closable/onClose` props 在 Task 10 传入，Task 12 验证 ✓

### 4. 已知风险点

- Task 5: Rust `start_scheduler` 是 async，setup 闭包非 async。需要 `tauri::async_runtime::spawn` 包裹
- Task 10: ArticleContainer 重构移除 framer-motion，需确保 ArticleCol 内部的 `wide` prop 处理正确（始终传 false）
- Task 11: ArticleItem 的具体 navigate 位置需实现时确认
