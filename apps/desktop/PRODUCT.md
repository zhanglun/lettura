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
- 订阅你想看的：有 feed 的站点直接订阅（含 Newsletter 这类自带 feed 的来源）
- 播客即文章：带音频附件的条目就是一篇文章，行内 ▶ + 底部迷你播放条
- 本地优先、免费开源、无服务端依赖

## Operating Context

- 桌面 app（Tauri v2，macOS 为主）：React/Vite/TS 前端 + Rust 后端 + SQLite(Diesel)
- 订阅：RSS/Atom、OPML 导入导出、邮件订阅（IMAP 直读）、B站动态
- 键盘优先（j/k、Enter/o、m/M、f、v、space、R、`/` 或 ⌘K、`?` 帮助）
- 中英双语界面（i18n，zh/en locale）
- 后台定时同步已有（scheduler）；正文只渲染 feed 自带内容，不自动抓全文

## Capabilities and Constraints

0.2.0 能力清单（已确认）：

- 订阅管理（添加/分组/退订）
- 未读列表（跨源、时间倒序、纯文本行）
- 单栏阅读（渲染 feed 全文；`v` 打开原文）
- 星标、已读历史
- 播客播放（保留：enclosure 检测 → 列表预设色缩略图 + 播放器三态——底部条/沉浸页/收起圆钮，audio 单例）；队列/进度/时长持久在本地库（续播），含整队播放列表浮层、睡眠定时、倍速、系统媒体键
- 搜索（⌘K 命令面板统一入口：文章/来源/命令混合）
- 一页极简设置（面板内第三视图，三段：外观与阅读/同步与来源/行为与数据，含 OPML 进出；订阅管理为子视图；来源账户/订阅规则区块）
- 多源订阅（fetcher 家族）：RSS 发现层 / IMAP 邮件 / B站动态（wbi 签名 + SESSDATA）；同步按源级节奏到期调度并推送 sync 事件（原站点规则引擎与 `/api/generated` 对外供应已移除，见非目标）

明确的非目标（0.2.0 不做）：

- AI 层（Signal/Topic/问答，已决定移除）
- 卡片流、多面板并列、复杂设置
- 收藏夹/标签 UI（数据保留，界面不进 0.2.0）
- 自动抓取摘要 feed 的全文
- 依赖公共转换实例（RSSHub/Nitter 公共实例）：2026-09-26 决策移除固定依赖——公共实例不可靠（Cloudflare 拦截/超时）。转为本地原生适配器（`packages/fetcher-*`）；用户自建桥接实例设置项亦已移除（2026-10-01，仅服务一种粘贴习惯，已有订阅存的是解析后完整 URL 不受影响）；X/Twitter 仍不做（无可靠路径，留 provider 口子）
- 站点规则引擎（TOML 抓取：内置包 / 用户目录热加载 / `/api/rules`·`/api/generated` 对外接口）：2026-09-30 定为入口隐藏，2026-10-01 整体移除（包 + 前端区块 + 对外接口）——定位 power-user 自助不进产品界面。回归条件：决定运营个人/社区站点目录，回归时从 git 历史取 `38471dbd^` 整块恢复

## Brand Commitments

- 名字：Lettura（意大利语「阅读」）
- 免费开源，不商业化
- 用户选择的绑定约束：「界面消失，内容即界面」
- 视觉世界：现代软件工艺谱系（Linear / Things 3 / Arc / Raycast 为参照）。方向轮中「线装刻本 / 报纸索引 / 翻牌时刻表 / 标准三栏」已试并整体否决，不再提案复古或材质隐喻
- 已定视觉方向：静密 × 聚光（契约与参考实现见 `.impeccable/mocks/decision/fusion.html`，令牌见 `DESIGN.md`）

## Evidence on Hand

- 既有代码：apps/desktop（feed 同步/OPML/调度器/迁移已就绪，复用不重写）
- 多源订阅实现：根 Cargo workspace 的 `packages/fetcher-{core,rss,mail,bilibili}`（探测分发在 `src-tauri/src/fetchers/mod.rs`，凭据在 `source_accounts` 表）
- 设置面参考实现：`.impeccable/mocks/decision/settings.html`（可交互：esc 逐级返回 · 实时校准台 · 订阅分组/右键菜单 · ?view=subs 直链）
- 其余面参考实现：detail.html（阅读面，?size=&lh= 直达排版）、feeds.html（订阅浏览，?state=browse|feed）、add.html（渐进式订阅面板）、empty.html（空状态即引导）、help.html（? 键帮助）、dark.html（夜读本，?state=list|detail|cmd）
- 播放器组件已存在：components/LPodcast、components/PodcastPlayer、podcastDB(Dexie)
- i18n locale：src/locales/{en,zh}.json
- 旧 PRD 与 mockup：prd/、src/mockup/index.html（仅历史证据，0.2.0 不受其约束）
- 无真实用户数据可用于演示；演示内容需自拟并标注 synthetic

## Product Principles

1. 读完就走：打开的唯一理由是处理未读，处理完关闭，不制造停留义务
2. 界面消失，内容即界面：排版即设计，无 chrome 与内容争夺注意力
3. 改进现有功能优先于增加新功能；roadmap 默认 no
4. 每个功能都要为「轻量阅读器」辩护，辩护不了不做
5. 本地优先：断网可用，数据属于用户
