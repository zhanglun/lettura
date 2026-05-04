# Lettura 全量 PRD 合规审计 — Gap Analysis

> 审计日期：2026-05-03
> 覆盖范围：`prd/ui/` 全部 19 个 spec 文件
> 规则：重复合并；PRD vs Mockup 矛盾以 Mockup 为准
> 实现基线：tsc 0 errors, 271 tests pass

---

## 审计总览

| 模块 | spec 文件 | 已实现 | 待修复(P0) | 待修复(P1) | 待修复(P2) |
|------|----------|--------|-----------|-----------|-----------|
| Today | 3 files | 85% | 4 | 6 | 3 |
| Topics | 2 files | 80% | 1 | 4 | 1 |
| Feeds | 2 files | 75% | 2 | 5 | 2 |
| Search | 2 files | 60% | 1 | 4 | 2 |
| Starred | 1 file | 65% | 0 | 4 | 2 |
| Settings | 2 files | 40% | 2 | 6 | 2 |
| Article Reader | 1 file | 70% | 0 | 3 | 2 |
| Navigation | 2 files | 80% | 0 | 3 | 2 |
| Onboarding | 2 files | 70% | 0 | 3 | 1 |
| Visual System | 2 files | 75% | 0 | 3 | 2 |

**总计**：P0=10, P1=41, P2=19

---

## 模块一：Today

> spec 文件：today-page-spec.md, today-interaction-spec.md, component-language-spec.md
> 实现文件：TodayPage.tsx, SignalCard.tsx, SignalList.tsx, TodayOverview.tsx, TodayEmptyState.tsx, PipelineIndicator.tsx, InlineReader.tsx, createTodaySlice.ts

**已完成修复**（详见 prd/progress.md）：SignalCard emoji→文字, 置信度移除%, validate_overview bug, i18n, Tracked/Discovered, RecentChanges, StartHere, recent_changes Rust, relevance_score 动态化, TopicRightPanel 删除, topic badge→detail, 内联阅读, source list 默认展开, Feeds 刷新+RightPanel 重构

### 🔴 P0

| ID | 问题 | spec 来源 | 文件 |
|----|------|----------|------|
| T-H1 | 缺失 TodayHeader 组件（标题+副标题+Status Pill） | today-interaction-spec §1 | TodayPage.tsx |
| T-H2 | Signal 时间戳无意义（created_at=Utc::now()） | today-interaction-spec §3 | pipeline.rs |
| T-H3 | PipelineIndicator 暴露内部 stage 名 | today-interaction-spec §2 | PipelineIndicator.tsx |
| T-H4 | 反馈按钮无 toast 确认 + 无禁用其余按钮 | today-interaction-spec §5 | SignalCard.tsx, createTodaySlice.ts |

### 🟡 P1

| ID | 问题 | spec / Mockup 来源 | 文件 |
|----|------|-------------------|------|
| T-H5 | 无信号级别标签（Top Signal/Watch/Signal） | Mockup: "Top Signal · 5 sources" | SignalCard.tsx, pipeline.rs |
| T-H6 | Sidebar Tracked Topics 缺状态标签+摘要 | navigation-interaction-spec §5 | SidebarToday.tsx |
| T-H7 | 置信度需**加回百分比**（Mockup 明确有 "88%"） | Mockup vs PRD 矛盾 | SignalCard.tsx |
| T-H8 | TodayPage 未接入 load_error 空态 | today-interaction-spec §2 | TodayPage.tsx |
| T-H9 | 无离线检测空态 | today-interaction-spec §2 | TodayEmptyState.tsx |
| T-H10 | 反馈失败无 UI 回滚 | today-interaction-spec §5 | createTodaySlice.ts |

### 🟢 P2

| ID | 问题 | 文件 |
|----|------|------|
| T-H11 | 低置信度无"证据有限"提示 | SignalCard.tsx |
| T-H12 | Sidebar Today Focus 缺说明文字 | SidebarToday.tsx |
| T-H13 | 动画 timing 未校准 (200/300/150ms) | SignalCard.tsx, SignalList.tsx |

---

## 模块二：Topics

> spec 文件：topics-page-spec.md, topics-interaction-spec.md
> 实现文件：TopicListPage.tsx, TopicDetailPage.tsx, TopicCard.tsx, TopicArticleItem.tsx, SourceGroup.tsx, topicSlice.ts

### 🔴 P0

| ID | 问题 | spec 来源 | 文件 |
|----|------|----------|------|
| TP-1 | 无 Mute/Unmute Topic 功能 | topics-interaction-spec §3,§5 | topicSlice.ts, TopicListPage.tsx, Rust topic.rs |

### 🟡 P1

| ID | 问题 | spec / Mockup | 文件 |
|----|------|--------------|------|
| TP-2 | TopicCard 缺 definition 字段 | topics-interaction-spec §2 (definition 必须) | TopicCard.tsx, topicSlice.ts |
| TP-3 | TopicCard 缺 status badge (tracked/discovered/muted) | topics-interaction-spec §5 | TopicCard.tsx |
| TP-4 | Follow/Unfollow 失败无 UI 回滚 | topics-interaction-spec §5 "状态保存失败时必须回滚 UI" | TopicDetailPage.tsx, topicSlice.ts |
| TP-5 | TopicCard 缺 confidence 和 newCount | topics-interaction-spec §2 | TopicCard.tsx |

### 🟢 P2

| ID | 问题 | 文件 |
|----|------|------|
| TP-6 | Discovered 为空时应只展示 Tracked 区域 | TopicListPage.tsx |

---

## 模块三：Feeds

> spec 文件：feeds-page-spec.md, feeds-interaction-spec.md
> 实现文件：Feeds/, ChannelList/, ArticleItem/, Article/, createFeedSlice.ts, createArticleSlice.ts

### 🔴 P0

| ID | 问题 | spec 来源 | 文件 |
|----|------|----------|------|
| F-1 | Feed 无健康状态指示器（🟢🟡🔴） | feeds-interaction-spec §2,§9 | ChannelList/FeedItem |
| F-2 | 删除 Feed 无"保留/删除历史文章"选项 | feeds-interaction-spec §6 | 删除确认逻辑 |

### 🟡 P1

| ID | 问题 | spec / Mockup | 文件 |
|----|------|--------------|------|
| F-3 | 无右键上下文菜单（重命名/编辑/刷新/标记已读/删除） | feeds-interaction-spec §3 | ChannelList/ |
| F-4 | OPML 导入无预览和重复检测 | feeds-interaction-spec §7 | OPML import 逻辑 |
| F-5 | Feed 文章列表无"筛选未读"toggle | feeds-interaction-spec §8 | Feeds 页面 |
| F-6 | 无"全部已读"按钮（当前 Feed 未读清零） | feeds-interaction-spec §8 | Feeds 页面 |
| F-7 | Feed 行缺"最近同步时间"显示 | feeds-interaction-spec §2 | ChannelList/FeedItem |

### 🟢 P2

| ID | 问题 | 文件 |
|----|------|------|
| F-8 | Intelligence 轻状态预留位（未来功能） | ChannelList/ |
| F-9 | Folder 展开折叠状态未持久化 | feeds-interaction-spec §11 |

---

## 模块四：Search

> spec 文件：search-page-spec.md, search-interaction-spec.md
> 实现文件：Search/index.tsx (695 lines)

### 🔴 P0

| ID | 问题 | spec 来源 | 文件 |
|----|------|----------|------|
| S-1 | 无 Signal 类型搜索结果分区 | search-interaction-spec §4 (三类型：Signals/Topics/Articles) | Search/index.tsx, Rust API |

### 🟡 P1

| ID | 问题 | spec / Mockup | 文件 |
|----|------|--------------|------|
| S-2 | 无最近搜索（记录/删除/清空） | search-interaction-spec §6 | Search/index.tsx, 需新增 store/Rust |
| S-3 | 无键盘导航（/, ↑↓, Enter, Esc） | search-interaction-spec §7 | Search/index.tsx |
| S-4 | 缺时间范围筛选（今天/本周/本月/全部） | search-interaction-spec §5 | Search/index.tsx |
| S-5 | 缺类型筛选（Signals/Topics/Articles） | search-interaction-spec §5 | Search/index.tsx |

### 🟢 P2

| ID | 问题 | 文件 |
|----|------|------|
| S-6 | 无 debounce 300ms（需验证当前实现） | Search/index.tsx |
| S-7 | 点击 Signal 结果未跳转到 Today 并定位 | Search/index.tsx |

---

## 模块五：Starred

> spec 文件：starred-interaction-spec.md
> 实现文件：Starred/index.tsx (551 lines), StarredOrganizeBar.tsx (300 lines), starredApi.ts

### 🟡 P1

| ID | 问题 | spec / Mockup | 文件 |
|----|------|--------------|------|
| ST-1 | 列表无时间分组（今天/本周/更早） | starred-interaction-spec §3 | Starred/index.tsx |
| ST-2 | 取消收藏无撤销 toast | starred-interaction-spec §6 | Starred/index.tsx |
| ST-3 | 无 inline 笔记编辑器 | starred-interaction-spec §5 | Starred/index.tsx |
| ST-4 | 缺 Markdown 导出（仅有 JSON） | starred-interaction-spec §8 | starredApi.ts |

### 🟢 P2

| ID | 问题 | 文件 |
|----|------|------|
| ST-5 | 缺筛选：有笔记 / 高信号 / 按标签 | Starred/index.tsx |
| ST-6 | 无阅读进度 (readProgress) 显示 | Starred/index.tsx |

---

## 模块六：Settings

> spec 文件：settings-page-spec.md, settings-interaction-spec.md (629 lines)
> 实现文件：Setting/ (6 tabs), createUserConfigSlice.ts

### 🔴 P0

| ID | 问题 | spec 来源 | 文件 |
|----|------|----------|------|
| SE-1 | Tab 结构错误：spec 要求 4 tabs (AI/Sources/Appearance/Behavior)，实际 6 tabs (General/Appearance/Proxy/Shortcuts/Import-Export/AI) | settings-interaction-spec §2 | Setting/ 目录重构 |
| SE-2 | 缺 Sources 管理功能（Pack/健康列表/失效修复/同步策略） | settings-interaction-spec §5 | 需新增整个 tab |

### 🟡 P1

| ID | 问题 | spec / Mockup | 文件 |
|----|------|--------------|------|
| SE-3 | 无全局状态 pills（本地配置/活跃来源/最近分析） | settings-interaction-spec §3.1 | Setting 顶部 |
| SE-4 | API Key 无掩码显示（sk-••••） | settings-interaction-spec §4.2 | AI tab |
| SE-5 | 无 AI 状态卡（连接状态/最近分析/统计数据） | settings-interaction-spec §4.5 | AI tab |
| SE-6 | 无即时预览（字号/行高/reader mode/card density） | settings-interaction-spec §6.2 | Appearance tab |
| SE-7 | 缺应用行为设置（开机启动/后台同步/通知/缓存清理/数据保留） | settings-interaction-spec §7 | 需新增 Behavior tab |
| SE-8 | Settings 为 Dialog 弹窗而非独立页面 | settings-interaction-spec §1 "Rail + Main" | 需改为路由页面 |

### 🟢 P2

| ID | 问题 | 文件 |
|----|------|------|
| SE-9 | 保存失败无 toast + dirty 回滚 | Setting/ 各 tab |
| SE-10 | 危险操作无二次确认 | Setting/ 危险操作 |

---

## 模块七：Article Reader

> spec 文件：article-reader-interaction-spec.md
> 实现文件：Article/View.tsx, Detail.tsx, ContentRender.tsx, adapters/, ToolBar.tsx, StarAndRead.tsx

### 🟡 P1

| ID | 问题 | spec / Mockup | 文件 |
|----|------|--------------|------|
| AR-1 | 无 ReaderContext 保存（source, articleIds, activeArticleId） | article-reader-interaction-spec §2 | View.tsx / createArticleSlice.ts |
| AR-2 | 无阅读位置保存/恢复（debounce scroll） | article-reader-interaction-spec §6.1 | Detail.tsx |
| AR-3 | 无 Search 命中高亮 | article-reader-interaction-spec §7 (Search: 命中片段高亮) | ContentRender.tsx |

### 🟢 P2

| ID | 问题 | 文件 |
|----|------|------|
| AR-4 | 无来源上下文辅助展示（Today: 同 Signal 其他来源） | Detail.tsx |
| AR-5 | 双渲染方式不一致（ContentRender vs InlineReader） | 内容渲染统一 |

---

## 模块八：Navigation / Layout

> spec 文件：navigation-interaction-spec.md, navigation-layout-spec.md
> 实现文件：Rail.tsx, Sidebar.tsx, SidebarToday.tsx, SidebarFeeds.tsx, AppLayout.tsx, config.ts

### 🟡 P1

| ID | 问题 | spec / Mockup | 文件 |
|----|------|--------------|------|
| N-1 | Search 页面缺 Sidebar（spec 要求有最近搜索+筛选+相关 Topic） | navigation-interaction-spec §5 | AppLayout.tsx, 新增 SidebarSearch |
| N-2 | Starred 页面缺 Sidebar（spec 要求有收藏夹+标签+阅读队列） | navigation-interaction-spec §5 | AppLayout.tsx, 新增 SidebarStarred |
| N-3 | 切换页面无滚动位置恢复 | navigation-interaction-spec §4 | 各页面组件 |

### 🟢 P2

| ID | 问题 | 文件 |
|----|------|------|
| N-4 | Rail 无 aria-label / aria-current | Rail.tsx |
| N-5 | 无键盘 Tab 顺序管理（Rail → Sidebar → Main） | AppLayout.tsx |

---

## 模块九：Onboarding

> spec 文件：onboarding-trust-spec.md, onboarding-interaction-spec.md
> 实现文件：Onboarding/ (OnboardingDialog, WelcomeStep, SelectPackStep, InstallingStep, CompleteStep)

### 🟡 P1

| ID | 问题 | spec / Mockup | 文件 |
|----|------|--------------|------|
| O-1 | 缺"选择兴趣"步骤（AI/Developer/Startup 等） | onboarding-interaction-spec §3.2 | 新增 InterestStep |
| O-2 | 缺 AI 配置引导步骤 | onboarding-interaction-spec §3.5 | OnboardingDialog |
| O-3 | 缺空状态复用（各页面无数据时引导回 Onboarding 子流程） | onboarding-interaction-spec §5 | TodayEmptyState 等 |

### 🟢 P2

| ID | 问题 | 文件 |
|----|------|------|
| O-4 | 无 Pack 预览功能 | SelectPackStep |

---

## 模块十：Visual System

> spec 文件：visual-system-spec.md, component-language-spec.md
> 实现文件：tailwind.config.js, styles/, cn.tsx

### 🟡 P1

| ID | 问题 | spec / Mockup | 文件 |
|----|------|--------------|------|
| V-1 | 无页面密度等级实现（Today 低/Topics 中/Feeds 高） | visual-system-spec §4.2 | tailwind.config.js + 页面 CSS |
| V-2 | 动画 timing 未统一（spec: ≤200ms ease-out, prefers-reduced-motion） | visual-system-spec §6 | 全局 CSS |
| V-3 | 阴影层级未统一（Level 0-2） | visual-system-spec §5 | tailwind.config.js |

### 🟢 P2

| ID | 问题 | 文件 |
|----|------|------|
| V-4 | 颜色可能有硬编码值（非 CSS 变量） | 各组件 |
| V-5 | 圆角未统一（卡片 8px / 按钮 6px / Pill 9999px） | 各组件 |

---

## Mockup vs PRD 矛盾决议

| 矛盾点 | PRD 说法 | Mockup 表现 | 决议 |
|--------|---------|------------|------|
| 置信度百分比 | "NO explicit percentage" | "置信度 88%" | **显示百分比** (T-H7) |
| 信号级别标签 | 未要求 | "Top Signal · 5 sources" | **添加级别标签** (T-H5) |
| WIM 默认状态 | collapsed | 静态图可见 | **保留折叠** |
| Settings 布局 | spec: 4 tabs (AI/Sources/Appearance/Behavior) | — | **按 spec 重构** (SE-1) |

---

## 下一步

本文档为全量审计结论。每个模块需输出详细的修改方案和实现计划，然后按优先级顺序执行。

优先执行顺序建议：
1. **P0 全部**（10 项）— 核心功能缺失
2. **Settings 重构**（SE-1/SE-2）— 影响最大的结构性改动
3. **P1 按模块** — Today → Topics → Feeds → Search → Starred → Article Reader → Navigation → Onboarding → Visual
4. **P2 收尾**
