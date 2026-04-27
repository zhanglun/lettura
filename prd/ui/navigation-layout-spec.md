# 全局导航与布局规范

> **⚠️ 审查前置要求：在开始执行本文档中的任何设计或开发任务之前，必须先完整审查本文件，并与 `prd/ui-ux-redesign-spec.md` 总纲及 `prd/versions/` 下相关版本文档逐项对照，确认一致性后再开始实施。**

---

## 1. 布局方案

### 1.1 三段式收敛布局

```
┌──────┬───────────────┬────────────────────────────────────┐
│      │               │                                    │
│ Rail │   Sidebar     │         Main Content               │
│ 48px │   240px       │         flex-1                     │
│      │               │                                    │
│ [T]  │  Lettura      │  ┌──────────────────────────────┐  │
│ [Tp] │  ──────────   │  │                              │  │
│ [F]  │  Today Focus  │  │   页面内容                    │  │
│ [S]  │  - Signal 1   │  │                              │  │
│ [★]  │  - Signal 2   │  │                              │  │
│ [⚙]  │               │  │                              │  │
│      │  Tracked      │  │                              │  │
│      │  - Topic A    │  │                              │  │
│      │  - Topic B    │  │                              │  │
│      │               │  │                              │  │
│      │               │  └──────────────────────────────┘  │
│      │               │                                    │
└──────┴───────────────┴────────────────────────────────────┘
```

### 1.2 三栏职责

| 栏 | 宽度 | 职责 | 内容 |
|----|------|------|------|
| Rail | 48px | 一级导航 | 图标导航项 |
| Sidebar | 240px | 品牌与上下文 | Logo + Today Focus + Tracked Topics |
| Main | flex-1 | 主内容 | 各页面内容 |

---

## 2. 左侧 Rail 规范

### 2.1 导航项

| 图标 | 名称 | 路由 | 说明 |
|------|------|------|------|
| ☀ | Today | `/today` | 默认入口，Active 状态最突出 |
| 📂 | Topics | `/topics` | 理解层 |
| 📡 | Feeds | `/feeds` | 控制层 |
| 🔍 | Search | `/search` | 统一检索 |
| ★ | Starred | `/starred` | 收藏内容 |
| ⚙ | Settings | `/settings` | 信任层 |

### 2.2 交互规则

- 点击切换页面
- 当前页面高亮
- Hover 显示 tooltip（页面名称）
- 不做嵌套二级菜单
- 不做可折叠/展开

### 2.3 视觉

- Active：强调色背景 + 白色图标
- Inactive：透明背景 + 灰色图标
- Hover：浅灰背景
- 无文字标签，纯图标

---

## 3. 中间 Sidebar 规范

### 3.1 顶部品牌区

- Lettura Logo（小尺寸）
- 不需要重复显示导航

### 3.2 Today Focus 区

展示 Today 的 2-3 条最新 Signal 的标题摘要，让用户在任意页面都能快速感知 Today 状态。

```
Today Focus
──────────
· OpenAI 发布 GPT-4o Mini
· Rust 1.78 发布
· ...
```

### 3.3 Tracked Topics 区

展示用户跟踪的 Topic 列表，可点击直接跳转。

```
Tracked
───────
· AI Agent 工具链  (3)
· Rust 生态        (1)
· ...
```

### 3.4 可折叠性

- Sidebar 可以收起/展开
- 收起后只保留 Rail
- 状态记忆（用户偏好）

---

## 4. 主内容区规范

### 4.1 基本规则

- 页面内容占满 Main 区域
- 各页面独立负责自己的内部布局
- 不做固定头部/尾部
- 滚动在 Main 区域内部

### 4.2 页面切换

- 无动画过渡（v2.x 阶段）
- 直接切换，保持简洁
- 保持滚动位置记忆

---

## 5. 响应式策略

### 5.1 窗口最小宽度

Lettura 是桌面应用，最低宽度支持 1024px。

### 5.2 窄窗口处理

- 窗口 < 1024px：自动收起 Sidebar，只保留 Rail + Main
- 窗口 < 768px（如未来支持移动端）：收起 Rail 为 hamburger menu

### 5.3 宽窗口处理

- 无上限
- Sidebar 和 Main 按比例分配
- Main 内容区最大宽度建议 1200px（居中）

---

## 6. 全局组件

### 6.1 顶部区域

各页面的顶部由页面自己负责，不做全局固定 header。

### 6.2 状态栏

不做全局状态栏。Pipeline 状态信息在各页面内以轻量 pill 形式展示。

### 6.3 通知

使用系统原生通知（macOS Notification Center / Windows Toast），不在应用内做通知栏。

---

## 7. 与现状的差异

| 现有 | 新版 |
|------|------|
| 顶部 tab 导航 | 左侧 Rail 导航 |
| 无中间 sidebar | 新增 Sidebar（品牌 + Today Focus + Tracked） |
| Feeds 为默认入口 | Today 为默认入口 |
| 文章列表为主内容 | 各页面独立布局 |

---

## 8. 对应版本任务

| 版本 | 范围 | 说明 |
|------|------|------|
| v2.2 | 导航优先级调整 | Today 提升为侧栏第一项（见 `prd/versions/v2.2-today-entry-refactor.md`） |
| v2.10 | 三段式布局重构 | Rail + Sidebar + Main 完整三段式布局（见 `prd/versions/v2.10-layout-migration.md`） |
