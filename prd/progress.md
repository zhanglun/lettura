# Today & Topic 模块 PRD 合规审计 - 2026-05-03

## 审计结论

### 🔴 P0 - 产品方向偏移（必须修复）

| ID | 问题 | PRD来源 | 文件 |
|----|------|---------|------|
| G1 | Topic详情页缺少 RecentChanges + StartHere 两个section | topics-page-spec §3.1 | TopicDetailPage.tsx |
| S1 | Rust `recent_changes` 始终返回 None | topics-page-spec §3.2 | topic.rs:454 |
| S2 | Rust `validate_overview` if/else同值，验证无效 | component-language-spec | overview.rs:155-159 |

### 🟡 P1 - PRD不合规（应该修复）

| ID | 问题 | PRD来源 | 文件 |
|----|------|---------|------|
| G2 | Topic列表用tab filter替代Tracked/Discovered双区 | topics-page-spec §2.3 | TopicListPage.tsx |
| G3 | SignalCard反馈按钮用emoji而非纯文字 | today-page-spec §6.2 | SignalCard.tsx:308-330 |
| G4 | SignalCard置信度显示百分比数字 | component-language-spec §5.2 | SignalCard.tsx:248-253 |
| G5 | 缺失TodayHeader（标题+副标题+状态pill） | today-page-spec §2.2 | TodayPage.tsx |
| G6 | PipelineIndicator显示内部stage名 | today-page-spec §7.1/7.2 | PipelineIndicator.tsx |
| Q1 | TopicListPage硬编码中文字符串 | i18n规范 | TopicListPage.tsx:119-126 |
| S3 | link_articles_to_topic 硬编码 relevance_score=0.7 | ranking规范 | topic.rs:139 |
| S4 | 前端TopicDetail有recent_changes字段但无渲染 | topics-page-spec §3.2 | TopicDetailPage.tsx |

### 🟢 P2 - 代码质量（低优先级）

| ID | 问题 | 文件 |
|----|------|------|
| Q2 | TopicRightPanel 文件存在但无引用（死代码） | TopicRightPanel.tsx |
| Q3 | compute_topic_relevance (5维) 完全未使用 | ranking.rs:32-54 |

---

## 执行计划

### Phase 1: 基础修复（不影响结构）

- **T1**: SignalCard反馈按钮 emoji→纯文字标签
- **T2**: SignalCard置信度 移除百分比数字，只保留视觉条
- **T3**: 修复 Rust `validate_overview` bug
- **T4**: TopicListPage硬编码中文→i18n

### Phase 2: 结构性改动（前端+后端联动）

- **T5**: TopicListPage 实现 Tracked/Discovered 双区布局
- **T6**: TopicDetailPage 添加 RecentChanges section（前端渲染框架）
- **T7**: TopicDetailPage 添加 StartHere section（前端渲染框架）
- **T8**: Rust `recent_changes` 生成逻辑（后端实现）
- **T10**: link_articles_to_topic 使用 compute_relevance_score

### Phase 3: 清理

- **T9**: 清理未使用代码（TopicRightPanel, compute_topic_relevance）

---

## 执行日志

（执行过程中持续更新）
