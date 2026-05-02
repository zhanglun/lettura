# Lettura 页面能力 Review Finding 修复计划

**日期**: 2026-05-02
**状态**: 已输出、已自审、已更新进度
**范围**: 将最新 5 个 review findings 转成可执行实施计划。

## 背景

当前工作区不是从零开始。页面能力相关代码已经有一部分落地：

- `SearchPage` 已经向 `/api/search` 发送 `start_date`、`end_date`、`feed_uuid`、`is_starred`、`min_relevance`。
- Rust `handle_search` 和 `Common::global_search` 已经接收这些搜索过滤参数。
- `StarredPage` 已经通过现有 `/api/articles?is_starred=1` 拉取收藏文章，并通过新增 HTTP handlers 拉取 collections/tags。
- starred feature 的数据库结构已经存在：`collections`、`article_collections`、`tags`、`article_tags`，以及 `articles.starred_at`、`articles.is_archived`、`articles.notes`。

剩余问题不是“完全没实现”，而是若干页面控件表达了能力，但还没有端到端闭环。

## Review Findings

| ID | 优先级 | 区域 | 问题 | 必须达到的结果 |
|----|--------|------|------|----------------|
| F1 | P1 | Starred | 收藏夹和标签筛选是空操作 | 选择 collection/tag 后文章列表真实变化 |
| F2 | P1 | Topics | Topic 详情页不能直接打开 | `/local/topics/:uuid` 刷新或直达都能加载 |
| F3 | P1 | Tags 后端 | 新建标签后可能绑定到错误标签 | `add_tag_to_article` 总是关联请求中的标签 |
| F4 | P2 | Starred | `read_later` 筛选暴露但未实现 | 该筛选有明确语义并真实生效，或移除 |
| F5 | P2 | Search | 右侧 related topics 不主动加载 | 不需要先访问 Topics，Search 右栏也有内容 |

## 实施策略

先修数据正确性，再修路由直达，再闭合 Starred 筛选，最后补 Search 右栏。这个顺序能把风险压低：后端数据完整性优先，页面可达性其次，最后处理体验型能力。

## Phase 1: 后端正确性

### 1.1 修复 tag 创建和绑定

**涉及文件**

- `apps/desktop/src-tauri/src/feed/tag.rs`
- 如果已有合适测试入口，补 Rust 测试。

**计划**

1. 在 `add_tag_to_article` 中安全保留请求传入的 `tag_name`。
2. 如果 tag 不存在，先插入该 tag。
3. 插入后必须用同一个 `tag_name` 查询 tag id，不能从 tags 表取第一条 name。
4. 用正确 tag id 写入 `article_tags`，继续保持 `insert_or_ignore` 的幂等行为。
5. 增加测试：先创建两个已有 tag，再给文章添加一个全新的第三 tag，断言文章关联的是第三 tag。

**验收标准**

- 添加全新 tag 时，文章关联到这个新 tag。
- 添加已有 tag 时，文章关联到已有 tag。
- 重复添加同一 tag 不报错、不重复写入。

### 1.2 为 starred article 查询补 collection/tag 过滤

**涉及文件**

- `apps/desktop/src-tauri/src/feed/article.rs`
- `apps/desktop/src-tauri/src/server/handlers/article.rs`
- `apps/desktop/src/db.ts`

**计划**

1. 扩展 `ArticleFilter`：新增 `collection_uuid`、`tag_uuid`、`is_archived`、`has_notes`。
2. 在 `Article::get_article` 的 SQL 中增加条件：
   - collection: `A.id` 存在于 `article_collections`，并关联到对应 `collections.uuid`。
   - tag: `A.id` 存在于 `article_tags`，并关联到对应 `tags.uuid`。
   - archived: `A.is_archived = ?`。
   - notes: `TRIM(A.notes) != ''`。
3. 查询结果补齐 `A.starred_at`、`A.is_archived`、`A.notes`，让前端筛选和导出使用真实字段。
4. 保持现有 `/api/articles` 响应兼容，不破坏 All/Feed/Article 页面。

**验收标准**

- `/api/articles?is_starred=1&collection_uuid=...` 只返回该 collection 的收藏文章。
- `/api/articles?is_starred=1&tag_uuid=...` 只返回该 tag 的收藏文章。
- `/api/articles?is_starred=1&is_archived=1` 只返回已归档收藏文章。
- `/api/articles?is_starred=1&has_notes=1` 只返回有 notes 的收藏文章。

## Phase 2: Topic 详情直达

### 2.1 通过 uuid 加载 Topic detail

**涉及文件**

- `apps/desktop/src/stores/topicSlice.ts`
- `apps/desktop/src/layout/Intelligence/Topics/TopicDetailPage.tsx`
- Rust topic command 文件，如果目前没有 uuid 查询命令。

**计划**

1. 在 `TopicSlice` 增加 `fetchTopicDetailByUuid(uuid: string)`，或把 `fetchTopicDetail` 扩展为支持 id/uuid。
2. 后端优先增加 `get_topic_detail_by_uuid`，避免为了直达详情先拉完整 topic list。
3. `TopicDetailPage` 中，如果 `store.topics` 已经有 uuid 对应项，沿用 id 查询。
4. 如果列表为空或找不到对应项，直接按 URL 中的 uuid 查询详情。
5. 区分三种状态：加载中、未找到、后端错误。

**验收标准**

- 直接打开 `/local/topics/:uuid` 可以加载详情。
- 在 Topic 详情页刷新后仍能加载详情。
- follow/unfollow 仍能更新当前详情；如果列表状态存在，也同步更新列表。

## Phase 3: Starred 页面闭环

### 3.1 collection/tag 选择触发真实文章查询

**涉及文件**

- `apps/desktop/src/layout/Article/useArticle.ts`
- `apps/desktop/src/layout/Starred/index.tsx`

**计划**

1. 扩展 `UseArticleProps`：新增 `collectionUuid`、`tagUuid`、`isArchived`、`hasNotes`。
2. StarredPage 将 active collection/tag/filter 传入 `useArticle`。
3. 确保 SWR key 包含这些过滤条件，选择 collection/tag 时会重新请求。
4. 移除已经能由后端处理的本地过滤，只保留 Today/Earlier 分组逻辑。
5. 如果当前打开的 `selectedArticle` 不在新结果里，自动关闭或清空选中态。

**验收标准**

- 点击 collection 后列表变化。
- 点击 tag 后列表变化。
- 清除筛选后回到全部 starred articles。
- 翻页时仍然尊重当前筛选条件。

### 3.2 定义并实现 `read_later`

**涉及文件**

- `apps/desktop/src/layout/Starred/index.tsx`
- 如需要服务端过滤，同步涉及 article handler/filter。

**决策**

`read_later = starred && is_archived = 0`。这符合当前已有字段，不新增额外 schema。

**计划**

1. active filter 为 `read_later` 时，请求 `is_archived=0`。
2. active filter 为 `archived` 时，请求 `is_archived=1`。
3. active filter 为 `notes` 时，请求 `has_notes=1`。
4. 如文案暗示独立队列，则同步调整 i18n 文案。

**验收标准**

- `read_later`、`archived`、`notes` 三个筛选都能产生不同且可解释的结果。

### 3.3 让 collection/tag 管理可从 UI 验证

**涉及文件**

- `apps/desktop/src/layout/Starred/index.tsx`
- `apps/desktop/src/helpers/starredApi.ts`

**计划**

1. 保留现有创建 collection 能力。
2. 增加文章操作入口，至少支持：
   - 添加文章到 collection。
   - 给文章添加 tag。
   - 如果 UI 展示已有 tag/collection，则支持移除。
3. 所有 API 失败要通过 `showErrorToast` 暴露，不能继续静默 `catch`。

**验收标准**

- 用户能创建 collection，并从 UI 把一篇 starred article 放进去。
- 用户能创建或应用 tag。
- 请求失败时用户能看到错误反馈。

## Phase 4: Search Related Topics

### 4.1 Search 页面主动加载 topics

**涉及文件**

- `apps/desktop/src/layout/Search/index.tsx`
- 如有必要，调整 `apps/desktop/src/stores/topicSlice.ts`。

**计划**

1. SearchPage 不再 `useBearStore()` 订阅整个 store，只选择 `topics`、`fetchTopics`、loading/error 等必要字段。
2. 页面 mount 后，如果 `topics.length === 0`，调用 `fetchTopics("active", "relevance")`。
3. related topics 先在前端派生：用 query 匹配 topic `title` 和 `description`。
4. query 为空时显示 top active topics。
5. 暂不新增后端 topic search API，除非本地派生效果明显不足。

**验收标准**

- 直接进入 `/search`，右侧 related topics 可以出现内容。
- 搜索词会影响 related topics 的排序或筛选。
- SearchPage 不因为订阅整个 Zustand store 产生不必要重渲染。

## Phase 5: 测试与验证

### 前端测试

需要新增或更新：

- Starred collection/tag filter 会改变请求参数。
- Starred `read_later`、`archived`、`notes` 会映射为正确请求参数。
- Topic detail 在 topic list 为空时会触发 uuid 加载。
- SearchPage 直达 mount 时会加载 topics。

### 后端测试

需要新增或更新：

- `add_tag_to_article` 会关联请求中的新 tag。
- article query 支持 collection uuid。
- article query 支持 tag uuid。
- article query 支持 archived 和 notes metadata。

### 验证命令

至少运行：

```bash
pnpm test
pnpm build
cargo test
```

如果完整 `cargo test` 太慢或被环境阻塞，先跑 targeted tests，并在最终记录限制。

## 自审

### 依赖关系审查

- F3 必须先修，因为错误 tag 绑定会污染后续 UI 操作产生的数据。
- F2 与 Starred/Search 独立，可以并行，但不应被 Starred 后端阻塞。
- F1 应优先使用服务端过滤；如果只做前端过滤，分页结果会不正确。
- F5 应避免在 SearchPage 订阅整个 Zustand store。

### 范围审查

本计划不包含完整 notes editor、导出弹窗重做、collection 排序、批量管理。这些能力有价值，但不是解决本轮 5 个 findings 的必要条件。

### 风险审查

| 风险 | 缓解 |
|------|------|
| `Article::get_article` 使用 raw SQL，新增参数绑定容易出错 | 小步添加条件，并用请求参数测试覆盖 |
| Topic detail uuid 命令可能复制 id 查询逻辑 | 抽一个共享 helper，通过 id 或 uuid 进入同一详情组装逻辑 |
| Search topics 加载可能重复触发 | 仅在 `topics.length === 0` 时加载，并使用窄 selector |
| Starred 筛选后右侧仍打开已不在列表中的文章 | 筛选结果变化后检查 selectedArticle，必要时清空 |

## 更新后的执行顺序

1. 修复 `add_tag_to_article`。
2. 增加 collection/tag/archive/notes 的 article 后端过滤。
3. 将 Starred filters 接入 `useArticle`。
4. 实现 Topic detail 按 uuid 直达加载。
5. SearchPage 主动加载并派生 related topics。
6. 补 focused tests。
7. 跑构建和测试，并继续更新 `2026-05-02-progress.md`。
