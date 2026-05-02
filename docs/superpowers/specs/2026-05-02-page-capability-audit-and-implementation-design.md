# Lettura 页面能力审计与实施计划

**日期**: 2026-05-02
**状态**: 已复审，最新执行计划见 `docs/superpowers/plans/2026-05-02-page-capability-finding-fix-plan.md`
**范围**: 全部 9 个页面/对话框的能力审计 + 未实现功能的实施设计

---

## 最新修订（2026-05-02 Review Findings）

本文件保留原始七阶段审计结构。最新代码状态已经发生变化：Search 筛选参数和 Starred 后端 schema/API 已经部分实现，因此后续执行不再从原 Phase 1-7 线性开始，而是优先修复最新 review 中确认的 5 个能力断点。

最新执行计划：

1. 修复 `add_tag_to_article` 新建标签后可能绑定错误标签的问题。
2. 为 starred article 查询补上 `collection_uuid`、`tag_uuid`、`is_archived`、`has_notes` 过滤闭环。
3. 让 StarredPage 的收藏夹/标签/read_later/archived/notes 控件触发真实筛选。
4. 让 TopicDetail 支持 `/local/topics/:uuid` 直达和刷新。
5. 让 SearchPage 直达时主动加载并派生 related topics。

详细计划、自审、验收标准见：

- `docs/superpowers/plans/2026-05-02-page-capability-finding-fix-plan.md`
- `docs/superpowers/specs/2026-05-02-progress.md`

---

## 一、审计结果总览（第三次复审，2026-05-02 最新）

| 页面 | 路由 | 实现度 | 关键问题 |
|------|------|--------|----------|
| TodayPage | `/local/today` | ⚠️ 85% | InlineReader star 无 onClick; 3 处硬编码中文; DailyStatus 数据错误 |
| ArticleContainer | `/local/all`, `/local/feeds/:uuid` | ⚠️ 90% | goNextArticle 边界 bug; View.tsx 硬编码"返回"; MoreHorizontal 死按钮; 5 处 console.log |
| StarredPage | `/local/starred` | ⚠️ 25% | 仅列表拉取可用; 收藏夹/标签/筛选器/导出全部硬编码假数据; 整页 30+ 处硬编码中文 |
| SearchPage | `/search` | ⚠️ 35% | 搜索核心可用; 筛选器/保存搜索/右侧面板全部假数据; 25+ 处硬编码中文; 3 个死代码文件 |
| TopicListPage | `/local/topics` | ⚠️ 80% | sortMode 未连接到 fetch; TopicEmptyPreview 15+ 处硬编码中文 |
| TopicDetailPage | `/local/topics/:uuid` | ⚠️ 90% | i18n key 路径错误; TopicCard 假置信度 |
| FreshRSSPage | `/service/freshrss` | ✅ 基础 | DnD 布局正常 |
| Settings Dialog | 热键 `s` | ✅ 100% | 6 个标签页全部可用 |
| Onboarding | — | ✅ 100% | 4 步引导完整 |

### 跨页面问题

| 类别 | 数量 | 说明 |
|------|------|------|
| 硬编码中文/英文（未走 i18n） | ~80+ | Starred 30+, Search 25+, TopicEmpty 15+, InlineReader 3, Sidebar 3, View 1 |
| console.log/warn 残留 | 17 处 / 11 文件 | ArticleCol 4, Search/Result 2, Settings/Proxy 3, etc. |
| 死代码 | 6 文件 | Search/Result.tsx, ResultItem.tsx, useInfiniteScroll.ts; Article/ToolBar.tsx; Sidebar onToggle |
| TypeScript 类型错误 | 2 文件 | SubscribeItem/ItemView 用 `Boolean`/`String` 而非 `boolean`/`string` |
| 主题色硬编码 | 1 处 | Rail.tsx `#6366f1` 不跟随暗色主题 |

---

## 二、实施计划：七阶段渐进式

### Phase 1: Quick Fixes（纯前端 Bug 修复）

预估工作量：**1.5h**

| # | 修复项 | 文件 | 问题 | 方案 |
|---|--------|------|------|------|
| 1.1 | InlineReader 收藏 onClick | `Intelligence/InlineReader.tsx:89` | Star 按钮无 onClick | 添加 onClick 调用 dataAgent star API |
| 1.2 | ArticleCol goNext 边界 | `Article/ArticleCol.tsx:157` | `i === articles.length` 永远为 false | 改为 `i === articles.length - 1` |
| 1.3 | DailyStatus 数据错误 | `Intelligence/DailyStatus.tsx:41` | analyzed 显示 article_count | 改用 signal_count 或新增字段 |
| 1.4 | TopicDetailPage i18n key | `Topics/TopicDetailPage.tsx:142` | `t("topic_summary")` key 不存在 | 改为 `t("layout.topics.detail.topic_summary")` |
| 1.5 | View.tsx "返回" 硬编码 | `Article/View.tsx:95` | 中文"返回"未走 i18n | 改为 `t("article.view.back")` |
| 1.6 | Rail.tsx 主题色 | `components/layout/Rail.tsx:111` | `#6366f1` 硬编码 | 改为 `var(--accent-9)` |
| 1.7 | TopicList sortMode | `Topics/TopicListPage.tsx:148` | sortMode 未传入 fetchTopics | 将 sortMode 加入 useEffect 依赖和 fetch 调用 |
| 1.8 | SignalCard ref 重置 | `Intelligence/SignalCard.tsx:60` | openedArticlesRef 永不重置 | 添加信号切换时的清空逻辑 |

### Phase 2: i18n 国际化

预估工作量：**3h**

#### 2.1 StarredPage i18n（~30 个字符串）
- 文件：`layout/Starred/index.tsx`
- 新增 ~30 个 i18n key 到 `locales/en.json` 和 `locales/zh.json`
- 命名空间：`starred.*`

#### 2.2 SearchPage i18n（~25 个字符串）
- 文件：`layout/Search/index.tsx`
- 新增 ~25 个 i18n key
- 命名空间：`search.*`

#### 2.3 TopicEmptyPreview i18n（~15 个字符串）
- 文件：`layout/Intelligence/Topics/TopicListPage.tsx`
- 新增 ~15 个 i18n key
- 命名空间：`topics.empty.*`

#### 2.4 其他小文件 i18n
- `InlineReader.tsx` 3 个字符串
- `Sidebar.tsx` 3 个 headerCopy desc
- `PlayList.tsx` 2 个字符串

### Phase 3: 代码质量

预估工作量：**1.5h**

#### 3.1 死代码清理
- 删除 `Search/Result.tsx`、`Search/ResultItem.tsx`、`Search/useInfiniteScroll.ts`
- 移除 `Article/ToolBar.tsx`（已被注释掉）
- 移除 `components/ArticleView/DialogView.tsx` 中空 afterConfirm 回调
- 移除 Sidebar `onToggle` dead prop + AppLayout `toggleSidebar` dead code

#### 3.2 console.log 清理
清理所有 17 处 console.log/warn（保留 console.error 用于错误处理）：
- `Article/ArticleCol.tsx`: L108, L186, L191, L193
- `Article/index.tsx`: L142
- `Search/Result.tsx`: L26
- `Search/ResultItem.tsx`: L31
- `Setting/Proxy/*`: L45, L115, L135, L144
- `Setting/Content/FolderList.tsx`: L85
- `Setting/Content/DialogDeleteFolder.tsx`: L28
- `Setting/ImportAndExport/index.tsx`: L61 (console.error, 保留)

#### 3.3 TypeScript 类型修复
- `SubscribeItem.tsx`: `Boolean` → `boolean`, `String` → `string`, `any` → `ReactNode`
- `ItemView.tsx`: 同上
- `TopicArticleItem.tsx`: 移除未使用的 useTranslation import

#### 3.4 其他
- `View.tsx:105` MoreHorizontal 按钮：添加 onClick 或移除
- `Article/index.tsx` afterConfirm 空回调修复

### Phase 4: StarredPage 后端

预估工作量：**8h**

#### 4.1 数据库 Schema 变更

**新建表**:

```sql
CREATE TABLE collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#6366f1',
    icon VARCHAR(50) DEFAULT 'folder',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE article_collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id, collection_id)
);

CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE article_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id, tag_id)
);
```

**扩展 articles 表**:

```sql
ALTER TABLE articles ADD COLUMN starred_at TIMESTAMP;
ALTER TABLE articles ADD COLUMN is_archived BOOLEAN DEFAULT 0;
ALTER TABLE articles ADD COLUMN notes TEXT;
```

#### 4.2 Rust 后端 API

新增 HTTP 端点：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/collections` | 获取所有收藏夹（含文章计数） |
| POST | `/api/collections` | 创建收藏夹 |
| PUT | `/api/collections/:uuid` | 更新收藏夹 |
| DELETE | `/api/collections/:uuid` | 删除收藏夹 |
| POST | `/api/articles/:uuid/collections` | 文章添加到收藏夹 |
| DELETE | `/api/articles/:uuid/collections/:collection_uuid` | 文章移出收藏夹 |
| GET | `/api/tags` | 获取所有标签（含文章计数） |
| POST | `/api/tags` | 创建标签 |
| DELETE | `/api/tags/:id` | 删除标签 |
| POST | `/api/articles/:uuid/tags` | 文章添加标签 |
| DELETE | `/api/articles/:uuid/tags/:tag_id` | 文章移除标签 |
| GET | `/api/articles/starred` | 获取收藏文章列表（支持筛选） |
| GET | `/api/articles/starred/export` | 导出收藏文章 |
| PATCH | `/api/articles/:uuid` | 更新文章属性（archive/notes） |

### Phase 5: StarredPage 前端

预估工作量：**5h**（依赖 Phase 4）

- 左侧栏收藏夹 → 从 `/api/collections` 获取数据
- 左侧栏标签 → 从 `/api/tags` 获取数据
- 筛选器 → 绑定到 `/api/articles/starred` 查询参数
- 导出 → 调用 `/api/articles/starred/export`
- 创建收藏夹 → 弹窗 + `POST /api/collections`
- 新建组件：CollectionSelector, TagSelector, ArticleNotesEditor, ExportDialog

### Phase 6: SearchPage 增强

预估工作量：**5h**

#### 6.1 后端搜索 API 增强
在 `GlobalSearchQuery` 新增 `starred: Option<i32>`, `min_relevance: Option<f32>` 参数

#### 6.2 前端改动
- 筛选器 chip「已收藏」→ `starred=1`
- 筛选器 chip「高信号」→ `min_relevance=0.7`
- 保存的搜索 → localStorage `lettura:saved-searches`
- 最近搜索历史 → localStorage `lettura:search-history`，最多 20 条
- 右侧面板「相关 Topic」→ 调用 `/api/topics` 基于搜索词筛选

### Phase 7: 最终审查

预估工作量：**1h**

- 运行所有测试
- LSP diagnostics 全项目检查
- i18n key 完整性验证（en/zh 对等）
- 构建验证

---

## 三、执行顺序与依赖关系

```
Phase 1 (Quick Fixes) ─── 全部无依赖，可并行
Phase 2 (i18n) ─────────── 全部无依赖，可并行
Phase 3 (Code Quality) ─── 全部无依赖，可并行
  ↑ Phase 1-3 完全独立，可交叉并行

Phase 4 (StarredPage Backend)
  ├── 4.1 DB migration
  └── 4.2 Rust API  [依赖 4.1]

Phase 5 (StarredPage Frontend) [依赖 Phase 4]

Phase 6 (SearchPage Enhancement)
  ├── 6.1 后端 API [无依赖]
  ├── 6.2 前端筛选器 [依赖 6.1]
  ├── 6.3 localStorage [无依赖]
  └── 6.4 右侧面板 [无依赖]

Phase 7 (Final Review) [依赖全部]
```

---

## 四、总工作量预估

| 阶段 | 前端 | 后端 | 合计 |
|------|------|------|------|
| Phase 1: Quick Fixes | 1.5h | 0h | 1.5h |
| Phase 2: i18n | 3h | 0h | 3h |
| Phase 3: Code Quality | 1.5h | 0h | 1.5h |
| Phase 4: StarredPage 后端 | 0h | 8h | 8h |
| Phase 5: StarredPage 前端 | 5h | 0h | 5h |
| Phase 6: SearchPage 增强 | 3h | 2h | 5h |
| Phase 7: Final Review | 1h | 0h | 1h |
| **总计** | **15h** | **10h** | **25h** |
