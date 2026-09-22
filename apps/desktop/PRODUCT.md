# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

作者本人及同类读者：中文技术读者/开发者，在 Mac 上使用桌面应用。典型场景是每天打开一次，扫完未读列表，精读少数几篇，听一两期播客，然后关闭。全天混合使用，浅色为设计基准，深色做适配。

## Product Purpose

Lettura 是一个本地优先（Tauri + SQLite）的开源订阅阅读器。它存在的理由：把「未读」当作唯一队列——打开即列表，读完就走。成功标准：用户每天愿意打开它，并且能在一次会话里把当天的阅读处理完。

## Positioning

- 打开即未读列表，读完就走（不制造停留义务，不用 AI 替用户判断）
- 订阅你想看的，包括没有 RSS 的来源（经 RSSHub / Kill the Newsletter 生态的平台源生成器，把运维门槛挡在界面后面）
- 播客即文章：带音频附件的条目就是一篇文章，行内 ▶ + 底部迷你播放条
- 本地优先、免费开源、无服务端依赖

## Operating Context

- 桌面 app（Tauri v2，macOS 为主）：React/Vite/TS 前端 + Rust 后端 + SQLite(Diesel)
- 订阅：RSS/Atom、OPML 导入导出、平台源（B站/知乎/微博/Newsletter）
- 键盘优先（j/k、Enter/o、m/M、f、v、space、R、`/` 或 ⌘K、`?` 帮助）
- 中英双语界面（i18n，zh/en locale）
- 后台定时同步已有（scheduler）；正文只渲染 feed 自带内容，不自动抓全文

## Capabilities and Constraints

0.2.0 能力清单（已确认）：

- 订阅管理（添加/分组/退订，含平台源生成器）
- 未读列表（跨源、时间倒序、纯文本行）
- 单栏阅读（渲染 feed 全文；`v` 打开原文）
- 星标、已读历史
- 播客播放（保留：enclosure 检测 → 列表「播」徽章 + 全局浮动播放卡 + 单集详情）
- 搜索（⌘K 命令面板统一入口：文章/来源/命令混合）
- 一页极简设置（面板内第三视图，三段：外观与阅读/同步与来源/行为与数据，含 OPML 进出；订阅管理为子视图）

明确的非目标（0.2.0 不做）：

- AI 层（Signal/Topic/问答，已决定移除）
- 卡片流、多面板并列、复杂设置
- 收藏夹/标签 UI（数据保留，界面不进 0.2.0）
- 自动抓取摘要 feed 的全文

## Brand Commitments

- 名字：Lettura（意大利语「阅读」）
- 免费开源，不商业化
- 用户选择的绑定约束：「界面消失，内容即界面」
- 视觉世界：现代软件工艺谱系（Linear / Things 3 / Arc / Raycast 为参照）。方向轮中「线装刻本 / 报纸索引 / 翻牌时刻表 / 标准三栏」已试并整体否决，不再提案复古或材质隐喻
- 已定视觉方向：静密 × 聚光（契约与参考实现见 `.impeccable/mocks/decision/fusion.html`，令牌见 `DESIGN.md`）

## Evidence on Hand

- 既有代码：apps/desktop（feed 同步/OPML/调度器/迁移已就绪，复用不重写）
- 设置面参考实现：`.impeccable/mocks/decision/settings.html`（可交互：esc 逐级返回 · 实时校准台 · 订阅分组/右键菜单 · ?view=subs 直链）
- 播放器组件已存在：components/LPodcast、components/PodcastPlayer、podcastDB(Dexie)
- starter pack 数据：src-tauri/src/sources/packs/ai.json
- i18n locale：src/locales/{en,zh}.json
- 旧 PRD 与 mockup：prd/、src/mockup/index.html（仅历史证据，0.2.0 不受其约束）
- 无真实用户数据可用于演示；演示内容需自拟并标注 synthetic

## Product Principles

1. 读完就走：打开的唯一理由是处理未读，处理完关闭，不制造停留义务
2. 界面消失，内容即界面：排版即设计，无 chrome 与内容争夺注意力
3. 改进现有功能优先于增加新功能；roadmap 默认 no
4. 每个功能都要为「轻量阅读器」辩护，辩护不了不做
5. 本地优先：断网可用，数据属于用户
