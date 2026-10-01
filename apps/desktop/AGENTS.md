# AGENTS.md

面向 AI 编码代理的项目专属指引。

<!-- ASTRYX:START -->
Astryx v0.6.3 · 164 个组件
CLI：所有命令以 `pnpm exec astryx <cmd>` 执行（下文简写为 `astryx ...`）。

初始化（一次，写在应用入口如 main.tsx）——缺了这些组件将无样式渲染：
  import "@astryxdesign/core/reset.css";
  import "@astryxdesign/core/astryx.css";

工作流——先发现、别猜。写 UI 之前：
1. `astryx build "<idea>"` — 从这里开始：返回一组匹配的 [page] + [block] + [component]。不带参数 = 完整手册。
2. `astryx template <name> [--skeleton]` — 脚手架它点名的 [page]/[block]，或研读其布局。模板即参考代码。
3. `astryx component <Name>` — 用到的每个组件的 props 与示例。

规则：
- 不用 <div>——布局/间距全部交给组件，页面框架也是。
- 先搭框架：写任何页面/屏幕前先读 `astryx docs layout`——页面框架、区域宽度、断点行为。
- 密集数据用行（Table、List/Item），列表项禁止用 Card 包裹；Card 只用于独立部件。状态用 StatusDot/Token；Badge 只放数量。
- 自定义样式：先试组件 props；否则用 style/className 配令牌——var(--color-*|--spacing-*|--radius-*)。禁止裸写 hex/px。（本项目没有 StyleX/Tailwind 编译器——不要用 xstyle/工具类。）
- 所有取值用令牌（`astryx docs tokens`）。品牌色/强调色归主题管（`astryx theme list` / `theme add <slug>`，或 `astryx theme template` 自定义）——禁止在 :root 覆盖 --color-*。
- 收尾自检：重读文件，把裸 <div>/<span> 布局、导入的 .css/@apply、硬编码值（#hex、16px）替换为组件或令牌（var(--color-*|--spacing-*|…)）。不确定组件/prop 是否存在，先跑 `astryx component <Name>` / `astryx search "<thing>"`，不要手搓 CSS。

更多 CLI：
  search "<query>"   查找任意组件 / hook / 文档 / 模板 / block
  component --list   按分类列出 164 个组件
  template --list    page + block 配方
  docs <topic>       browser-support, cli-integrations, color, elevation, getting-started, icons, illustrations, internationalization, layout, migration, motion, principles, shape, spacing, styling-libraries, styling, theme, tokens, typography, working-with-ai
  swizzle <Name>     弹出组件源码做深度定制
  upgrade --apply    任何 Astryx 或集成依赖升级后执行
<!-- ASTRYX:END -->
