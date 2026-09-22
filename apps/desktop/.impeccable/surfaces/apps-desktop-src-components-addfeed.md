---
version: 1
slug: "apps-desktop-src-components-addfeed"
primary_target: "apps/desktop/src/components/AddFeed"
related_targets: ["apps/desktop/.impeccable/mocks/decision/add.html"]
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
- 难忘时刻：检测在输入框内显影为类型徽章，预览卡向下长出（grow 220ms 缓出，全场唯一动效）
- 参考：`.impeccable/mocks/decision/add.html`；语法在 DESIGN.md「添加订阅」

## Unresolved
- 知乎/微博生成规则的真实 RSSHub 路由未验证（mock 用 rsshub.app/{kind}/… 占位）
- Newsletter 的 Kill the Newsletter 实例地址：自建 or 公共，实现时定
- 检测中 520ms 是演示值，实现按真实网络
