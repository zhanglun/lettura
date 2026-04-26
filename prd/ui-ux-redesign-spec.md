# Lettura UI/UX 重设计方案（收敛版）

> **⚠️ 审查前置要求：在开始执行本方案中的任何设计或开发任务之前，必须先完整审查本文件，并与 `prd/` 下相关文档逐项对照，确认信息架构、产品目标、技术边界、版本节奏一致后再开始实施。若本文件与既有 PRD 有冲突，应先修正文档，再推进实现。**

---

## 1. 文档目的

这份文档定义 Lettura 在 **2.x 阶段** 的收敛版 UI / UX 重设计方向。

它不追求把产品做成一个陌生的"AI 控制台"，也不继续停留在"更漂亮的 RSS Reader"。
它的目标是：

- 保留 Lettura 作为桌面阅读工具的熟悉骨架
- 重新排列页面优先级与交互顺序
- 把产品重心从"刷文章"迁移到"先判断，再阅读"
- 为后续 Today / Topic / Signal / Ask 的连续演进建立统一的界面基础

**配套拆分文档：**

本总纲已拆分为以下页面级规范文档，详细交互规则、组件规格、视觉参数均在对应文档中：

- `prd/ui/today-page-spec.md` — Today 页面规范
- `prd/ui/topics-page-spec.md` — Topics 页面规范
- `prd/ui/feeds-page-spec.md` — Feeds 页面规范
- `prd/ui/search-page-spec.md` — Search 页面规范
- `prd/ui/settings-page-spec.md` — Settings 页面规范
- `prd/ui/navigation-layout-spec.md` — 全局导航与布局规范
- `prd/ui/component-language-spec.md` — 组件语言规范
- `prd/ui/visual-system-spec.md` — 视觉系统规范
- `prd/ui/onboarding-trust-spec.md` — Onboarding 与信任建立规范

> **Starred 页面说明**：Starred（收藏）页面在本次重设计中保持现有功能不变（用户主动收藏的文章列表），不涉及交互重构。因此未单独拆分页面规范文档。如后续版本需要增强 Starred 能力（如收藏 Signal / Topic），届时再补充规范。

---

## 2. 设计结论摘要

### 2.1 核心判断

Lettura 应该长成：

> **一个熟悉的桌面阅读器，被重新排出了优先级：先判断，再决定读什么。**

它不是：
- 传统 RSS 首页 + 一些 AI 附件
- 暗色监控台 / 驾驶舱
- 杂志化内容产品
- 典型 SaaS 后台

它应该是：
- **亮色基调**
- **克制的信息工具**
- **Today 作为第一入口**
- **Topics 作为理解层**
- **Feeds 保留为控制层**
- **Search 不再只搜文章，而是搜判断、主题和证据**
- **Settings 负责建立系统信任**

### 2.2 产品气质

用户确认的整体气质：

- **1 + 2**
- 以 **冷静的专业情报台** 为主
- 吸收 **每日决策助手** 的轻量与可读性
- 不走"杂志化高品质阅读器"路线

因此新版应当同时具备：

- 专业、冷静、可信
- 结构清晰、优先级明确
- 阅读阻力低，不压迫
- 不炫技，不过度展示 AI 感

---

## 3. 设计原则

### 3.1 先判断，再阅读

Today 的首要任务不是"快速浏览"，也不是"快速进入深读"，而是：

> **快速判断今天最值得注意的事情是什么。**

所以界面必须先给：
1. 判断结果
2. 解释
3. 证据
4. 深读入口

而不是先给来源和文章标题，再逼用户自己归纳。

### 3.2 在现有 Lettura 上长出来

重设计要尽量让用户感觉：

- 这还是 Lettura
- 结构更清楚了
- 重点被重排了
- 不需要重新学习一套陌生系统

所以采用 **两栏 / 三栏演进**，而不是激进四栏控制台。

### 3.3 Feeds 降级，但不弱化

Feeds 不再是品牌首页，但仍然是核心控制层。
它从"主入口"退回到"数据源管理页"，但不会被隐藏，也不会变成后台配置。

### 3.4 Intelligence 要克制地可见

AI 能力应该存在，但不应压过产品本身。
用户看到的应该是：

- 更好的判断结果
- 更清楚的解释
- 更可追溯的来源
- 更稳定的工作流

而不是到处写着 AI、Pipeline、Embedding、Clustering。

### 3.5 信任感比炫目感重要

Today、Topics、Settings、Onboarding 的共同目标，是建立以下信任：

- 这个判断有依据
- 这些依据来自我的源
- 我可以调整输入
- 我可以反馈结果
- 我可以理解系统在做什么

---

## 4. 信息架构重排

### 4.1 一级导航

新版一级导航固定为：

| 位置 | 名称 | 职责 |
|------|------|------|
| 第 1 位 | **Today** | 今天先该看什么（判断入口） |
| 第 2 位 | **Topics** | 这些变化到底在讲什么（理解层） |
| 第 3 位 | **Feeds** | 输入源是否健康、是否该调整（控制层） |
| 第 4 位 | **Search** | 回找判断、主题或证据（统一检索） |
| 第 5 位 | **Starred** | 主动保存的长期价值内容 |
| 第 6 位 | **Settings** | 为什么可以信任这个系统（信任层） |

### 4.2 设计含义

这不是简单换顺序，而是把整个产品从"功能导航"改成"认知路径导航"：

- **Today**：我今天先该看什么
- **Topics**：这些变化到底在讲什么
- **Feeds**：我的输入源是否健康、是否该调整
- **Search**：我想回找某个判断、主题或证据
- **Starred**：我主动保存的长期价值内容
- **Settings**：我为什么可以信任这个系统

### 4.3 与现状的关键差异

只做两个关键改变：

1. **Today 提到第一位，成为绝对默认入口**
2. **Feeds 回到控制层，不再承担首页职责**

其余结构尽可能保持用户熟悉度。

---

## 5. 页面职责重构

### 5.1 Today：轻判断页

> **Today 给判断，不给文章流。**

Today 不是控制台，也不再是"今日文章过滤页"。它是一个 **轻判断页**，负责回答：

> 今天最值得注意的变化是什么？

详细规范见 `prd/ui/today-page-spec.md`。

### 5.2 Topics：理解层

> **Topics 给理解，不给堆叠。**

Topics 不是分类页，不是第二个首页，也不是"标签集合"。它是 Today 的延长线，用来回答：

> 这些事情到底是什么、怎么变化、值不值得持续跟踪？

详细规范见 `prd/ui/topics-page-spec.md`。

### 5.3 Feeds：控制层

> **Feeds 给控制，不给首页。**

Feeds 仍然是核心页面，但职责被重新定义：

> 不再负责告诉用户今天看什么，而是负责让用户控制系统看什么。

详细规范见 `prd/ui/feeds-page-spec.md`。

### 5.4 Search：统一检索层

> **Search 先搜判断，再搜主题，最后搜文章。**

新版 Search 第一阶段就应该支持三类结果并列：Signals、Topics、Articles。默认优先级：Signals > Topics > Articles。

详细规范见 `prd/ui/search-page-spec.md`。

### 5.5 Settings：信任层

> **Settings 给信任，不给杂项堆叠。**

Settings 分为 4 个块：AI 配置、Sources 管理、外观与阅读、应用行为。

详细规范见 `prd/ui/settings-page-spec.md`。

---

## 6. 收敛版布局方案

### 6.1 整体布局

采用 **更接近当前产品的三段式收敛布局**：

1. **左侧窄 rail**：一级导航（Today / Topics / Feeds / Search / Starred / Settings）
2. **中间 sidebar**：品牌、Today Focus、Tracked Topics、轻量上下文信息
3. **右侧主内容区**：Today / Topics / Feed 管理等主页面

不采用四栏控制台。

详细规范见 `prd/ui/navigation-layout-spec.md`。

### 6.2 Today 的收敛布局

- 顶部：标题 + 状态 pill
- 中部：Today Summary
- 主体：Signal 列表
- 证据层：卡片内展开 / 轻抽屉 / 轻侧面板

不做的事：
- 不做大面积固定右侧证据栏
- 不做过重的监控感布局
- 不做复杂数据面板
- 不让 Today 重新变成文章列表

---

## 7. 视觉系统与组件语言

### 7.1 整体视觉基调

亮色主基调，避免：
- 资讯网站式热闹
- 后台系统式僵硬
- 暗色终端式压迫

### 7.2 页面视觉等级

- **Today 最轻**：留白最多，强调判断，卡片最完整
- **Topics 最清**：中等密度，更结构化，更像解释页
- **Feeds 最实**：最工具化，密度可更高，更强调控制感

### 7.3 组件语言

三种主组件语言：
- **A. Signal Card**：新版最核心组件，承担判断、解释、证据、反馈的最小闭环
- **B. Structured List**：用于 Topics、Feeds、Search 结果，统一列表语言
- **C. Lightweight Drawer / Inline Expand**：用于证据层、补充层、状态层

### 7.4 信息层级原则

所有核心页面都要服从同一层级：主判断 → 解释 → 证据 → 动作

详细规范见 `prd/ui/visual-system-spec.md` 和 `prd/ui/component-language-spec.md`。

---

## 8. Onboarding、冷启动与信任建立

### 8.1 Onboarding 的真正目标

不是教用户点按钮，而是重排预期。完成三件事：

1. 让用户明白：首页先看判断，不是先刷文章
2. 让用户相信：判断来自自己选的源
3. 让用户知道：自己仍然拥有控制权

### 8.2 冷启动四步

1. **欢迎**：Lettura 会先帮你判断今天什么重要
2. **选择 Pack**：展示"你希望系统代表性观察什么"
3. **安装与分析**：等待的是"判断工作台准备好"
4. **进入 Today**：心智切换页，告诉用户新版正确的第一动作

### 8.3 信任建立的交互顺序

1. **Today Summary**：用户先接受整体判断语气
2. **Why It Matters**：用户确认这个判断讲得通
3. **Evidence / Original Source**：用户再验证依据

### 8.4 第一周使用路径

- **Day 1**：完成一条完整闭环（Today Summary → Signal → Why → 来源 → 原文）
- **Day 2–3**：明确感受到反馈会改变排序结果
- **Day 4–7**：自然带进 Topics（从一次判断进入持续理解）

详细规范见 `prd/ui/onboarding-trust-spec.md`。

---

## 9. 这次重设计真正要改变什么

如果把这次重设计收成一句最终判断，它不是：

- 界面更现代了
- 首页更好看了
- AI 功能更明显了

而是：

> **用户会逐渐学会：先看 Today 的判断，再进 Topic 理解，再按需回到原文。**

这才是 2.x 真正的 UI / UX 迁移目标。

---

## 10. 最终产品定义

新版 Lettura 应该被感知为：

- 比现在更整洁
- 比 RSS 阅读器更有判断层
- 比资讯网站更克制
- 比 SaaS 后台更有阅读感
- 比控制台方案更熟悉、更可信

一句话总结：

> **它还是 Lettura，还是桌面信息工具；只是现在它终于会先告诉用户什么重要，再让用户决定读什么。**

---

## 11. 版本拆分建议

| 版本 | 范围 | 对应详细文档 |
|------|------|------------|
| v2.2 | Today 页面重构 + SignalCard | `prd/versions/v2.2-today-entry-refactor.md` |
| v2.3 | SignalCard 结构完善 | `prd/versions/v2.3-top-signals-mvp.md` |
| v2.4 | Why It Matters 交互 | `prd/versions/v2.4-why-it-matters.md` |
| v2.5 | 来源透明与证据层 | `prd/versions/v2.5-source-transparency.md` |
| v2.6 | 去重与压缩 | `prd/versions/v2.6-dedup-compression.md` |
| v2.10 | 三段式布局迁移 | `prd/versions/v2.10-layout-migration.md` |
| v2.11+ | Topics 引入与信息层 | `prd/versions/v2.11-topic-introduction.md` |
