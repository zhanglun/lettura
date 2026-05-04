# Lettura 全量修改方案和实现计划

> 基于 `prd/full-gap-analysis.md` 审计结果
> 覆盖 10 模块 70 项 gap（P0=10, P1=40, P2=20）
> 日期：2026-05-03
> 自审修正：SE-8 从 P1 降级为 P2（Settings Dialog→Route 是独立重构）

---

## 执行顺序

```
Phase 1: P0 全部（10 项）→ 核心功能缺失
Phase 2: P1 按模块 → Today → Topics → Feeds → Search → Starred → Settings → Article Reader → Navigation → Onboarding → Visual
Phase 3: P2 收尾
```

---

# Phase 1: P0 修复方案

## 1.1 Today P0

### T-H1: 新建 TodayHeader 组件

**目标**：Today 页面顶部展示标题 + 副标题 + Status Pill

**新建文件**：
- `apps/desktop/src/layout/Intelligence/TodayHeader.tsx`

**实现方案**：
```tsx
// TodayHeader.tsx 结构
<div className="flex items-center justify-between px-6 py-4">
  <div>
    <h1 className="text-xl font-semibold">Today</h1>
    <p className="text-sm text-gray-500">你的每日判断入口</p>
  </div>
  <StatusPill status={pipelineStatus} lastUpdated={overview.updatedAt} sourceCount={overview.sourceCount} />
</div>
```

**修改文件**：
- `TodayPage.tsx`：import TodayHeader，放在页面顶部（TodayOverview 之前）

**StatusPill 逻辑**：
- idle: 隐藏
- syncing: "同步中..."
- analyzing: "分析中..."
- ready: "✓ 已更新 · 基于 {N} 个来源"
- error: "⚠ 更新失败 · 点击重试"
- stale: "最后更新 {timeAgo}"

**验收**：
- [ ] TodayHeader 显示在 Today 页顶部
- [ ] Status Pill 反映 pipeline 实际状态
- [ ] 不暴露内部 stage 名

---

### T-H2: Signal 时间戳修复

**目标**：Signal 显示真实的 pipeline 分析时间

**修改文件**：
- `apps/desktop/src-tauri/src/ai/pipeline.rs`

**方案**：
- 当前：`created_at: Utc::now()` 在 `build_signal` 中
- 修改：传入 `pipeline_completed_at: DateTime<Utc>` 参数，Signal 的 `created_at` 使用 pipeline 完成时间
- 前端 SignalCard 显示：`formatDistanceToNow(signal.created_at)` → "2 小时前"

**验收**：
- [ ] Signal 时间戳反映 pipeline 完成时间
- [ ] 前端显示相对时间

---

### T-H3: PipelineIndicator 用户友好文案

**目标**：用户只看"分析中/已更新"，不看 embedding/clustering

**修改文件**：
- `apps/desktop/src/layout/Intelligence/PipelineIndicator.tsx`

**方案**：
```ts
const stageLabelMap: Record<string, string> = {
  fetching: "同步中...",
  embedding: "分析中...",
  deduplication: "分析中...",
  clustering: "分析中...",
  signal_title: "生成判断...",
  topic: "识别主题...",
  topic_summary: "生成主题摘要...",
  article_summary: "分析文章...",
  ranking: "排序中...",
  wim: "生成解释...",
  // done/error 由 Status Pill 处理
};
```

**验收**：
- [ ] Pipeline 进度显示用户友好文案
- [ ] 不暴露 embedding/clustering 等技术术语

---

### T-H4: 反馈 toast + 禁用按钮

**目标**：点击反馈后高亮+禁用其余+toast确认

**修改文件**：
- `SignalCard.tsx`：反馈后 disabled 其余按钮
- `createTodaySlice.ts`：添加 toast 通知逻辑

**方案**：
1. 点击反馈按钮 → 乐观更新 `feedbackMap[signalId]`
2. 所有反馈按钮检查 `feedbackMap[signalId]` → 有值则 disabled
3. 已选按钮高亮样式
4. 显示 toast（使用现有 toast 或新增简单 toast）
5. API 失败 → 回滚 feedbackMap + 错误 toast

**i18n 新增**：
- `en`: `feedback_useful_toast`: "Marked as useful", `feedback_irrelevant_toast`: "Marked as irrelevant", `feedback_follow_toast`: "Will keep tracking"
- `zh`: 对应中文

**验收**：
- [ ] 点击反馈后其余按钮 disabled
- [ ] 已选按钮高亮
- [ ] 显示 toast
- [ ] 失败时回滚

---

## 1.2 Topics P0

### TP-1: Mute/Unmute Topic

**目标**：支持静音/恢复 Topic

**Rust 端修改**：
- `src-tauri/src/ai/topic.rs`：新增 `mute_topic(uuid)` / `unmute_topic(uuid)`
- 数据库：`topic_follows` 表需支持 status 字段（tracked/discovered/muted）
  - 若已有 status 列则复用；若无则新建 migration 000008
  - `mute_topic`: INSERT OR UPDATE topic_follows SET status='muted'
  - `unmute_topic`: DELETE from topic_follows (回到 discovered)
- `src-tauri/src/cmd.rs`：注册 `mute_topic` / `unmute_topic` 命令
- `get_topics_list` SQL 添加 muted 过滤

**前端修改**：
- `topicSlice.ts`：添加 `muteTopic`/`unmuteTopic` actions
- `TopicCard.tsx`：添加 Mute 按钮（右键或 hover 显示）
- `TopicListPage.tsx`：添加 Muted 筛选 tab

**验收**：
- [ ] Mute 后 Topic 从默认列表隐藏
- [ ] Muted 筛选可查看已静音 Topic
- [ ] Unmute 后恢复到 discovered
- [ ] 保存失败回滚 UI

---

## 1.3 Feeds P0

### F-1: Feed 健康状态指示器

**目标**：每个 Feed 旁显示 🟢🟡🔴 状态

**Rust 端修改**：
- `src-tauri/src/feed/sync.rs` 或新文件 `health.rs`：
  - 新增 `get_feed_health(feed_id)` → 计算最近 5 次同步成功率
  - 返回 `FeedHealth { status: "healthy"|"warning"|"broken", success_rate: f32, last_sync: DateTime }`
- `src-tauri/src/cmd.rs`：注册 `get_feed_health` 命令
- 或直接在 `get_feed_tree` 返回中包含 health_status 字段

**前端修改**：
- `ChannelList/FeedItem`：在 Feed 名称旁添加状态点
  - 🟢 绿色 = healthy (≥80%)
  - 🟡 黄色 = warning (40-80%)
  - 🔴 红色 = broken (<40%)
- 样式：8px 圆点，tooltip 显示成功率

**验收**：
- [ ] 每个 Feed 旁显示健康状态色点
- [ ] Hover 显示成功率
- [ ] 从未同步的 Feed 无状态点

---

### F-2: Feed 删除确认增强

**目标**：删除 Feed 时提供"保留/删除历史文章"选项

**修改文件**：
- 删除确认弹窗逻辑（可能在 ChannelList 中）

**方案**：
当前删除弹窗添加两个选项：
```
删除此订阅源
○ 仅删除订阅源，保留已下载的文章
○ 删除订阅源及所有相关文章（不可恢复）
[取消] [确认删除]
```

**Rust 端**：`delete_feed(feed_id, delete_articles: bool)` 参数

**验收**：
- [ ] 删除弹窗有两个选项
- [ ] 默认选中"保留文章"
- [ ] 选择"删除文章"时有二次警告

---

## 1.4 Search P0

### S-1: Signal 搜索结果分区

**目标**：搜索结果分三区 Signals / Topics / Articles

**Rust 端修改**：
- `src-tauri/src/server/handlers/` 搜索接口：
  - 搜索 signals 表（匹配 title/summary）
  - 返回结构添加 `signals: Vec<SignalSearchResult>`
- 或新增 IPC 命令 `search_signals(query)`

**前端修改**：
- `Search/index.tsx`：
  - 结果区域分三区：Signals（新）→ Topics → Articles
  - Signal 结果卡片：title + summary + confidence + source_count
  - 点击 Signal → 跳转 Today 页面（如需定位则扩展路由参数）
  - 某分区无结果时折叠该区

**验收**：
- [ ] 搜索结果包含 Signals 分区
- [ ] 点击 Signal 结果跳转到 Today
- [ ] 无结果分区自动折叠

---

## 1.5 Settings P0

### SE-1: Settings Tab 结构重构

**目标**：6 tabs → 4 tabs (AI/Sources/Appearance/Behavior)

**当前结构**：
- General: update_interval, threads, cleanup_days, language
- Appearance: color_scheme, accent_color, custom_styles
- Proxy: SOCKS5
- Shortcuts: reference list
- Import & Export: OPML
- AI: API key, models, pipeline, dedup

**目标结构**：
```
AI 配置 ← 现有 AI tab 内容 + 验证连接 + AI 状态卡
Sources 管理 ← 新增 (Packs/健康/同步策略) + OPML import 从现有 Import-Export 移入
外观阅读 ← Appearance + reader_mode/line_height/card_density/即时预览 + Proxy 移入此处(可选)
应用行为 ← General 内容重组 + launch_at_login/background_sync/notifications/cache/data_retention
```

**迁移映射**：
| 现有 | 迁移到 |
|------|--------|
| AI tab → AI 配置 tab (保留+增强) |
| Import-Export OPML → Sources 管理 tab 的 OPML 子区 |
| General (update_interval, threads) → Sources 管理 tab 的同步策略子区 |
| General (cleanup_days, language) → 应用行为 tab |
| Appearance → 外观阅读 tab (增强预览) |
| Proxy → 外观阅读 tab (底部网络设置) 或应用行为 tab |
| Shortcuts → 保留为独立页或在应用行为 tab 内 |

**修改文件**：
- `Setting/Content.tsx`：从 6 tab 改为 4 tab
- 新增 `Setting/Sources.tsx`：Sources 管理页面
- 新增 `Setting/Behavior.tsx`：应用行为页面
- 重构 `Setting/Appearance.tsx`：增强即时预览
- `Setting/General.tsx`：拆分内容到其他 tab

**验收**：
- [ ] Settings 有 4 个 tab：AI/Sources/Appearance/Behavior
- [ ] 原有设置项全部保留（无功能丢失）
- [ ] Tab 切换流畅

---

### SE-2: Sources 管理 tab

**目标**：新建完整的 Sources 管理功能

**新建文件**：
- `Setting/Sources.tsx`：Sources 管理主页面
- 包含 4 个子区：
  1. Starter Packs 浏览/安装/卸载
  2. 源健康列表（名称/健康状态/最近同步/成功率/操作）
  3. 失效源修复（错误信息/重试/编辑URL/停用）
  4. 同步策略（频率/并发/超时）

**Rust 端需新增**：
- `get_source_health_list()` → 返回所有源健康状态
- `get_starter_packs()` → 返回 Pack 列表
- `install_starter_pack(pack_id)` → 安装 Pack
- `disable_source(source_id)` → 停用源
- 现有 `sync_feed` 可复用为"重试单个源"

**验收**：
- [ ] Sources 管理 tab 展示 Pack + 健康列表 + 同步策略
- [ ] 失效源可重试/停用
- [ ] 同步频率支持 0=禁用

---

# Phase 2: P1 修改方案

## 2.1 Today P1

### T-H5: 信号级别标签

**方案**：
- Rust `pipeline.rs`：根据 Signal 置信度+文章数+来源数计算 level:
  - `top_signal`: confidence ≥ 0.8 && article_count ≥ 5
  - `watch`: confidence ≥ 0.6 || (topic_id 存在)
  - `signal`: 其余
- 添加 `level: Option<String>` 到 Signal struct
- 前端 SignalCard：在 title 旁显示 "Top Signal · {N} sources" 标签

### T-H6: Sidebar Tracked Topics 增强

**方案**：
- `SidebarToday.tsx`：每个 tracked topic 显示 status badge + 最近摘要
- 需要 topic summary 数据（已有 `topic_summary` 字段）

### T-H7: 置信度加回百分比

**方案**：
- `SignalCard.tsx`：恢复 `{confidence}%` 显示（之前 T2 移除了，Mockup 明确要求显示）

### T-H8: TodayPage 接入 load_error 空态

**方案**：
- `TodayPage.tsx`：添加 error 状态分支，使用 `TodayEmptyState` 的 load_error 模式
- catch fetchSignals/fetchOverview 异常 → 设置 error state → 显示重试

### T-H9: 离线检测空态

**方案**：
- 检测 `navigator.onLine` 或 API 请求失败模式
- 显示"离线模式" + 缓存结果 + 离线 pill

### T-H10: 反馈失败 UI 回滚

**方案**：
- 与 T-H4 一起实现：catch API error → revert feedbackMap → 显示错误 toast

---

## 2.2 Topics P1

### TP-2: TopicCard 添加 definition

**方案**：
- Rust `topic.rs` `get_topics_list`：返回中包含 `definition` 字段（已存在于 topics 表）
- `TopicCard.tsx`：在 name 下方显示 definition（一行截断）

### TP-3: TopicCard status badge

**方案**：
- 根据 follow 状态显示 badge：
  - tracked: 蓝色 pill "追踪中"
  - discovered: 灰色 pill "已发现"
  - muted: 灰色 pill "已静音"

### TP-4: Follow/Unfollow 失败回滚

**方案**：
- 乐观更新 → API 调用 → 失败时回滚 follow 状态 + toast 错误

### TP-5: TopicCard confidence + newCount

**方案**：
- `get_topics_list` 返回 confidence 和 recent_articles_count
- TopicCard 右下角显示置信度条 + "N 条新文章"

---

## 2.3 Feeds P1

### F-3: 右键上下文菜单

**方案**：
- Folder 右键：重命名 / 新建 Feed / 删除
- Feed 右键：编辑 / 刷新 / 标记已读 / 删除
- 使用 Radix ContextMenu 或自定义实现

### F-4: OPML 导入预览+重复检测

**方案**：
- 导入前先解析 OPML → 显示预览列表
- 与现有 feeds 对比 → 标注重复源
- 用户选择导入范围

### F-5: 筛选未读 toggle

**方案**：
- Feeds 文章列表顶部添加 Unread filter toggle
- 前端过滤 `article.read === false`

### F-6: 全部已读按钮

**方案**：
- 添加 "Mark all read" 按钮
- 调用 Rust `mark_all_read(feed_id)` IPC

### F-7: Feed 行最近同步时间

**方案**：
- `get_feed_tree` 返回每个 feed 的 `last_synced_at`
- ChannelList FeedItem 显示相对时间

---

## 2.4 Search P1

### S-2: 最近搜索

**方案**：
- Rust 新增 `recent_searches` 表 + CRUD 命令
- 前端 Search 页面：空 query 时显示最近搜索列表
- 支持单条删除和全部清空

### S-3: 键盘导航

**方案**：
- `/` 全局快捷键聚焦搜索框
- `↑↓` 在结果间移动（高亮当前项）
- `Enter` 打开当前高亮结果
- `Esc` 清空输入或退出

### S-4: 时间范围筛选

**方案**：
- 添加时间范围下拉：今天/本周/本月/全部
- 传递参数到 Rust 搜索 API

### S-5: 类型筛选

**方案**：
- 添加类型多选：Signals / Topics / Articles
- 与 S-1 配合，控制显示哪些分区

---

## 2.5 Starred P1

### ST-1: 时间分组

**方案**：
- 按 starredAt 分组：今天 / 本周 / 更早
- 分组 header + 折叠

### ST-2: 取消收藏撤销 toast

**方案**：
- 取消收藏 → 从列表临时移除 → 显示 undo toast (3s)
- 超时或用户不撤销 → 调用 API
- 用户撤销 → 恢复列表

### ST-3: Inline 笔记编辑器

**方案**：
- Starred item 添加笔记图标 → 点击展开 inline textarea
- 自动保存 (debounce 500ms)
- 显示笔记摘要

### ST-4: Markdown 导出

**方案**：
- 在现有 JSON 导出旁添加 Markdown 导出选项
- 格式：标题/来源/链接/笔记/标签

---

## 2.6 Settings P1

### SE-3: 全局状态 pills

**方案**：
- Settings 顶部添加 3 个 pill：
  - 本地配置状态
  - 活跃来源数
  - 最近分析时间

### SE-4: API Key 掩码

**方案**：
- 已配置时显示 `sk-••••••••7F2a`
- 点击"更换"显示空输入框
- 空保存不覆盖已有 key

### SE-5: AI 状态卡

**方案**：
- AI tab 顶部显示状态卡片：
  - 连接状态 / 最近分析时间 / 来源数 / 文章数 / Signals 数 / Embedding 开关

### SE-6: 即时预览

**方案**：
- 外观 tab 右侧添加预览区域
- 字号/行高/reader mode 修改后实时反映

### SE-7: 应用行为 tab

**方案**：
- 新建 Behavior tab 包含：
  - 开机启动 toggle
  - 后台同步 toggle
  - 通知模式 select
  - 缓存清理 button + 数据保留 select

### SE-8: Settings 改为路由页面（P2 — 独立重构）

> ⚠️ 自审修正：从 P1 降级为 P2。Settings Dialog→Route 是独立结构性重构，
> 与 P0 tab 内容重组有冲突，应先完成 tab 内容后再考虑布局变更。

**目标**：从 Dialog 改为独立路由页面

**方案**：
- 从 Dialog 改为独立路由页面 `/local/settings`
- 使用 Rail + Main 布局（无 sidebar）
- 保留关闭按钮返回上一页
- 前置条件：SE-1 tab 重构完成

---

## 2.7 Article Reader P1

### AR-1: ReaderContext 保存

**方案**：
- `createArticleSlice.ts` 新增 `readerContext` state
- 打开文章时写入 context (source, articleIds, activeArticleId)
- View.tsx 返回时使用 context.sourceRoute

### AR-2: 阅读位置保存/恢复

**方案**：
- Detail.tsx 监听 scroll → debounce 500ms → 保存到 store
- 重新打开时恢复 scroll position

### AR-3: Search 命中高亮

**方案**：
- 从 Search 打开文章时传递 query 参数
- ContentRender.tsx 对 query 关键词添加 `<mark>` 标签

---

## 2.8 Navigation P1

### N-1: Search Sidebar

**方案**：
- 新增 `SidebarSearch.tsx`：最近搜索 + 筛选 + 相关 Topics
- AppLayout.tsx Search 路由启用 sidebar

### N-2: Starred Sidebar

**方案**：
- 新增 `SidebarStarred.tsx`：收藏夹列表 + 标签列表 + 阅读队列
- AppLayout.tsx Starred 路由启用 sidebar

### N-3: 滚动位置恢复

**方案**：
- 各页面组件 `useEffect` cleanup 时保存 scroll position
- 页面 mount 时恢复

---

## 2.9 Onboarding P1

### O-1: 选择兴趣步骤

**方案**：
- 新增 `InterestStep.tsx`：7 个兴趣标签 (AI/Developer/Startup/Product/Design/Business/Science)
- 至少选 1 个才能继续
- 插入 Welcome → **Interest** → SelectPack 流程

### O-2: AI 配置引导步骤

**方案**：
- Pack 安装完成后检查 AI 配置
- 未配置 → 显示 AI config CTA ("现在配置" / "稍后再说")
- 现在配置 → 打开 Settings AI tab

### O-3: 空状态复用

**方案**：
- 各模块 EmptyState 添加 CTA 按钮引导到 Onboarding 子流程
- Today: "选择 Starter Pack"
- Feeds: "Add Feed / Import OPML"
- Topics: "先同步文章生成 Today Signals"

---

## 2.10 Visual System P1

### V-1: 页面密度等级

**方案**：
- tailwind.config.js 添加 density presets
- Today 页面: `density-low` (更多留白)
- Topics 页面: `density-medium`
- Feeds 页面: `density-high` (紧凑)

### V-2: 动画 timing 统一

**方案**：
- 全局 CSS 变量定义动画时间
- 确保 ≤200ms, ease-out
- 添加 `@media (prefers-reduced-motion: reduce)` 禁用动画

### V-3: 阴影层级统一

**方案**：
- tailwind.config.js 添加 `shadow-0`, `shadow-1`, `shadow-2` 级别
- 卡片使用 shadow-1, 弹出层使用 shadow-2

---

# Phase 3: P2 修改方案

P2 项目为优化级，方案简述：

| ID | 方案 |
|----|------|
| T-H11 | 置信度 <50% 时在 SignalCard 显示 "⚠ 证据有限" 提示 |
| T-H12 | SidebarToday 添加 "今天先判断，再决定是否阅读" 说明 |
| T-H13 | 校准动画：card enter 200ms/50ms stagger, WIM 200ms, source 300ms, feedback 150ms |
| TP-6 | Discovered 列表为空时隐藏 Discovered 区域，只展示 Tracked |
| F-8 | Feed 行预留 Intelligence badge 位置（暂不实现） |
| F-9 | Folder 展开状态保存到 localStorage 或 Rust config |
| S-6 | 验证 Search debounce 是否已有 300ms |
| S-7 | Signal 搜索结果点击后传递 signalId 参数到 Today 页面定位 |
| ST-5 | 添加 has_notes / high_signal / tag 筛选 tab |
| ST-6 | Starred item 显示阅读进度条 |
| SE-9 | Settings 保存失败 toast + dirty 状态回滚 |
| SE-10 | 危险操作（删除源/清理缓存/数据保留缩短）添加二次确认 Modal |
| AR-4 | Reader 侧边栏显示来源上下文（Today: 同 Signal 其他来源） |
| AR-5 | 统一 InlineReader 和 ContentRender 渲染方式 |
| N-4 | Rail item 添加 aria-label + aria-current="page" |
| N-5 | Tab 顺序管理：Rail → Sidebar → Main |
| O-4 | Pack 安装前可展开预览源列表 |
| V-4 | 审查并替换硬编码色值为 CSS 变量 |
| V-5 | 统一圆角：卡片 8px / 按钮 6px / Pill 9999px |

---

# 验收 Checklist 汇总

按模块汇总 spec 中的验收清单，标记状态：

## Today
- [x] Summary 不超过 2 句话 → 已实现
- [x] 默认展示 3-5 张 Signal → 已实现
- [x] Why/Sources 可展开 → 已实现
- [x] 来源可进入 Reader 并返回 Signal → 已实现
- [ ] Feedback 可保存、失败回滚 → **T-H4 待实现**
- [x] AI 未配置和无数据状态完整 → 已实现
- [ ] Pipeline 状态用户可读 → **T-H3 待实现**

## Topics
- [x] Topic List 分区正确 → Tracked/Discovered 已实现
- [ ] Topic 卡片字段完整 → **TP-2/3/5 待实现**
- [x] Detail 顺序符合定义→变化→来源→推荐 → 已实现
- [ ] Follow/Unfollow/Mute 可保存和回滚 → **TP-1/4 待实现**
- [x] 从 Today Topic tag 可进入详情 → G7 已实现
- [x] Start Here 可打开 Reader → 已实现

## Feeds
- [ ] Folder 展开/折叠状态持久化 → **F-9**
- [x] Feed CRUD 完整 → 已实现
- [ ] 删除有二次确认 → **F-2**
- [x] 拖拽排序持久化 → 已实现
- [ ] OPML 导入有预览和重复检测 → **F-4**
- [x] Feed 文章点击进入 Reader → 已实现
- [ ] 健康状态可见 → **F-1**

## Search
- [ ] debounce 300ms → **S-6 验证**
- [ ] 三类结果分区 → **S-1**
- [x] 点击结果跳转正确 → 部分实现
- [ ] 筛选项可组合 → **S-4/S-5**
- [ ] 最近搜索可删除/清空 → **S-2**
- [x] 无结果和失败状态完整 → 已实现
- [ ] 键盘操作可用 → **S-3**

## Starred
- [ ] 列表分组和筛选正确 → **ST-1/5**
- [x] 点击项进入 Reader 并可返回 → 已实现
- [ ] 取消收藏可撤销 → **ST-2**
- [x] Read Later 与 Starred 独立 → 已实现
- [ ] 笔记可新增、编辑、删除 → **ST-3**
- [x] 标签可新增、移除、筛选 → 部分实现
- [ ] 导出当前筛选和全部收藏 → **ST-4**

## Settings
- [ ] 4 tab 结构 → **SE-1**
- [ ] AI 配置完整 → **SE-4/5**
- [ ] Sources 管理 → **SE-2**
- [ ] 外观即时预览 → **SE-6**
- [ ] 应用行为设置 → **SE-7**
- [ ] 危险操作确认 → **SE-10**

## Article Reader
- [x] 从所有入口可打开 Reader → 已实现
- [ ] 返回上下文正确 → **AR-1**
- [ ] 上一篇/下一篇按上下文切换 → 部分实现
- [ ] 阅读位置可恢复 → **AR-2**
- [x] 星标、稍后读、已读可保存 → 已实现
- [ ] Search 命中可高亮 → **AR-3**
- [x] 加载失败有重试和打开原文 → 已实现

## Navigation
- [x] 6 个 Rail item 均可跳转 → 已实现
- [x] 详情页和阅读态 active 归属正确 → 已实现
- [x] Settings 无 Sidebar → 已实现
- [x] Topics/Topic Detail 无 Sidebar → 已实现
- [ ] Sidebar 内容随页面变化 → **N-1/N-2**
- [ ] 返回上下文不丢失 → **AR-1**
- [ ] 切换页面恢复滚动位置 → **N-3**
- [ ] Rail 支持键盘和屏幕阅读器 → **N-4**

## Onboarding
- [x] 首次启动自动进入 Onboarding → 已实现
- [ ] 兴趣至少选择 1 个 → **O-1**
- [x] Pack 可安装 → 已实现
- [x] 安装和同步有进度 → 已实现
- [ ] AI 未配置可跳 Settings → **O-2**
- [x] 完成后进入 Today → 已实现

## Visual System
- [ ] 页面密度等级 → **V-1**
- [ ] 动画 ≤200ms ease-out → **V-2**
- [ ] 阴影层级统一 → **V-3**
- [ ] 颜色无硬编码 → **V-4**
- [ ] 圆角统一 → **V-5**
