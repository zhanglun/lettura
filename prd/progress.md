# PRD 合规审计 & Gap Analysis — 合并文档

> 最后更新：2026-05-03
> 审查规则：重复内容已合并精简；PRD 与 Mockup 矛盾处以 **Mockup 为准**。

---

## 一、已完成修复 ✅

以下问题已在之前的实现会话中修复并验证（tsc 0 errors, 271 tests pass）。

| 原ID | 问题 | 修复说明 |
|------|------|---------|
| G1 | TopicDetailPage 缺少 RecentChanges + StartHere | 添加 RecentChanges 时间线 + StartHere 推荐阅读 |
| S1 | Rust `recent_changes` 始终 None | 新增 RecentChange struct，按 pub_date 分组 top 5 |
| S2 | Rust `validate_overview` if/else 同值 | else 分支改为返回 fallback 格式 |
| G2 | TopicListPage tab → Tracked/Discovered 双区 | 重写为双区布局 |
| G3 | SignalCard 反馈按钮 emoji | 改为纯文字标签 |
| Q1 | TopicListPage 硬编码中文 | → i18n keys |
| S3 | link_articles_to_topic 硬编码 0.7 | 改为动态 base_relevance（0.55/0.70/0.85） |
| S4 | TopicDetail recent_changes 无渲染 | 前端渲染框架已实现 |
| Q2 | TopicRightPanel 死代码 | 已删除 |

**备注**：
- Q3 `compute_topic_relevance`（5 维）保留，有测试覆盖
- 同期还修复了：G7（SignalCard topic badge → 详情页）、G8（Today 内联阅读）、Q4（TopicEmptyPreview i18n）、Signal 时间戳 `excerpt` 为 None、Feeds 刷新机制、Feeds RightPanel 重构等

---

## 二、待修复项（按优先级）

### 🔴 P0 — 核心功能缺失

| ID | 问题 | Mockup 参考 | 涉及文件 |
|----|------|------------|---------|
| **H1** | 缺失 TodayHeader 组件（标题 + 副标题 + Status Pill） | 浅色 Mockup："Today" + "你的每日判断入口" + "已更新到 10:42" + "基于 5 个来源" | TodayPage.tsx |
| **H2** | Signal 时间戳无意义（`created_at = Utc::now()`） | Mockup："2 小时前更新" — 应为真实 pipeline 完成时间 | pipeline.rs |
| **H3** | PipelineIndicator 暴露内部 stage 名 | PRD: 用户只看 "分析中"/"已更新"，不看 embedding/clustering | PipelineIndicator.tsx |
| **H4** | 反馈按钮无 toast + 无禁用其余按钮 | PRD: 反馈后高亮已选 + 禁用其余 + toast 确认 | SignalCard.tsx, createTodaySlice.ts |

### 🟡 P1 — 体验差距

| ID | 问题 | Mockup 参考 | 涉及文件 |
|----|------|------------|---------|
| **H5** | 无信号级别标签（Top Signal / Watch / Signal） | Mockup: "Top Signal · 5 sources" / "Watch · 3 sources" | SignalCard.tsx, pipeline.rs |
| **H6** | Sidebar Tracked Topics 缺少状态标签 + 摘要 | Mockup: "AI Coding Agents" + "High" + "今天新增 3 条来源，正在升温" | SidebarToday.tsx |
| **H7** | 右侧面板 DailyStatus ≠ PipelineStatus | Mockup: Pipeline Status 卡片显示各阶段状态 | DailyStatus.tsx → 重构 |
| **H8** | 置信度显示需**加回百分比** | ⚡ Mockup 明确显示 "置信度 88%" / "Confidence 88%"（PRD 说不要，但 **Mockup 为准**） | SignalCard.tsx |
| **H9** | TodayPage 未使用 load_error 空态 | TodayEmptyState 支持 but TodayPage 未接入 | TodayPage.tsx |
| **H10** | 无离线检测空态 | PRD §8: 离线提示 + 缓存最后结果 | TodayEmptyState.tsx |

### 🟢 P2 — 可优化

| ID | 问题 | 说明 |
|----|------|------|
| **H11** | 低置信度无 "证据有限" 提示 | PRD: <50% 置信度应显示提示 |
| **H12** | Sidebar Today Focus 缺说明文字 | Mockup: "今天先判断，再决定是否阅读" |
| **H13** | 动画 timing 未校准 | PRD 有精确 ms 值（200ms/300ms/150ms），需逐项验证 |

---

## 三、Mockup vs PRD 矛盾决议

以下为 Mockup 与 PRD 存在矛盾的项目，均以 **Mockup 为准**：

| 矛盾点 | PRD 说法 | Mockup 表现 | 决议 |
|--------|---------|------------|------|
| 置信度百分比 | "NO explicit percentage, visual hints only" | "置信度 88%" / "Confidence 88%" | **显示百分比**（H8） |
| 信号级别标签 | 未明确要求 | "Top Signal · 5 sources" / "Watch · 3 sources" | **添加级别标签**（H5） |
| WIM 默认状态 | "default collapsed" | Mockup 静态图显示 WIM 可见 | **保留折叠**（Mockup 为展示态，PRD 交互逻辑更合理） |

---

## 四、执行日志

### 2026-05-03 第一轮审计 + 全量修复

- Phase 1 (T1-T4): SignalCard emoji→文字、置信度移除%、validate_overview bug、i18n
- Phase 2 (T5-T8, T10): Tracked/Discovered、RecentChanges、StartHere、recent_changes 逻辑、relevance_score 动态化
- Phase 3 (T9): 删除 TopicRightPanel 死代码
- 补充修复: G7 topic badge→detail、G8 内联阅读、Q4 TopicEmptyPreview i18n
- 补充修复: Feeds 刷新机制(scheduler+syncAllArticles)、Feeds RightPanel 重构(RightPanel+ArticleContainer)

### 2026-05-03 第二轮 Mockup 对照 Gap Analysis

- 完成 3 张 Mockup 图片分析（浅色/深色/空态）
- 完成 Today 模块全量 PRD 对照
- 完成 Navigation/Layout/Onboarding 模块 PRD 对照
- 完成 Search/Starred/Settings/Article Reader 模块摸底
- 产出合并文档（本文档）
