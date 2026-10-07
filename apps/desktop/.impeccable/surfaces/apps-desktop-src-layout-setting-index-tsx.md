---
version: 1
slug: "apps-desktop-src-layout-setting-index-tsx"
primary_target: "src/layout/Setting/index.tsx"
related_targets: [".impeccable/mocks/decision/settings.html"]
---

# Surface Brief · 设置 + 订阅管理

## Scope & Mode
- 路由：设置（面板内第三视图）与订阅管理（其子视图）；`apps/desktop/src/layout/Setting/`
- 模式：Operate（任务面：改配置、管订阅，不逗留）

## Audience / Job / Action
- 用户即作者本人：中文技术读者，每天开一次
- 任务：调外观（即时可见）、调同步、备份 OPML、增删分组订阅源
- 动作：⌘K「打开设置」进入；esc 直达退回到进入前页面（2026-10-01 起：订阅管理是内联锚点段非子视图，无逐级链），位置保留；更改即时生效无保存钮

## Chosen Direction & Memorable Moment
- 定稿：面板内第三视图，非浮层非独立窗口（用户 2026-02 轮选定）
- 难忘时刻：校准台——外观段尾预览块实时反映列表密度，拖动即显影（字号/行高滑杆与宋体预览已随 2026-10-05 排版精简移除，阅读排版为固定值）
- 参考：`.impeccable/mocks/decision/settings.html`（含 ?view=/?focus= 直链；校准台宋体段为历史稿状态）；语法表在 DESIGN.md「设置视图」

## Unresolved
- 通知 = 开关+级别捏合为单一分段，实现时需对齐 userConfig 两个字段
- 行为与数据段 9 行偏重，待真实使用后决定是否拆分
- 视觉评审未做：本会话无图像阅读能力，QA 为机械验证（几何/对比度/功能/检测器）；首次落地前应跑一次眼审
- 深色「夜读本」未进本面
