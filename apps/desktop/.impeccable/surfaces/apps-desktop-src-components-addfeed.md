---
version: 1
slug: "apps-desktop-src-components-addfeed"
primary_target: "src/components/AddFeed"
related_targets: [".impeccable/mocks/decision/add.html"]
---

# Surface Brief · 添加订阅（渐进式面板）

## Scope & Mode
- 路由：⌘K「添加订阅」命令 + 订阅管理页入口 + 空状态引导钮，三处归一
- 模式：Operate（粘贴→检测→订阅，一步完成，不逗留）

## Audience / Job / Action
- 用户想订阅一个来源，手头只有一个地址（可能是 RSS，更可能是 B站/知乎/微博主页或 Newsletter 订阅页）
- 任务：把任意地址变成已订阅的 feed，平台源经 RSSHub/Kill the Newsletter 生成，运维门槛挡在界面后面
- 动作：粘贴 → 预览卡长出 → ⏎ 订阅；esc 随时离开

## Chosen Direction & Memorable Moment
- 定稿：640px 渐进式面板（⌘K 同位同材质），否决第四视图与系统弹窗（用户 2026-02 轮选定）
- 2026-09-25 重梳理（用户）：**发现优先**（HTML `<link rel=alternate>` + 常见路径，后端 `resolve_feed_input`）→ 生成器只是回退；**平台清单不写死**（内置便利匹配 + 设置里的自定义路由 + 面板手填路由，实例是设置项；路由行可三段式 `匹配 => 路由 => 载体`，载体缺省 text）；预览卡补回**最近条目**；**一次抓取**（预览结果缓存给订阅）；**完成即跳**该订阅的源队列，不做"再加一个"循环
- 难忘时刻：检测在输入框内显影为类型徽章，预览卡向下长出（grow 220ms 缓出，全场唯一动效）
- 参考：`.impeccable/mocks/decision/add.html`；语法在 DESIGN.md「添加订阅」

## Unresolved
- ~~知乎/微博生成规则的真实 RSSHub 路由未验证~~ → 2026-09-25 定：不做固定路由清单，改数据表 + 用户自定义 + 手填（`helpers/feedGenerators.ts`）
- ~~Newsletter 的 Kill the Newsletter 实例~~ → 2026-09-25 定：走「RSSHub 实例」设置项（substack 另有原生 `/feed` 直连）
- ~~检测中 520ms 是演示值~~ → 已按真实网络，慢站点由行内 spinner 承担
- 新：多候选 feed 的 chips 只在 `candidates.length > 1` 时出现；候选项上限 6 条（超过截断）
