---
version: 1
slug: "src-layout-article-view-tsx"
primary_target: "src/layout/Article/View.tsx"
related_targets: [".impeccable/mocks/decision/reading/reading-tunnel.html"]
---

# Surface Brief · 阅读面（三形态详情视图）

## Scope & Mode
- 路由：`/local/feeds/:uuid/articles/:id`（文章/播客/平台三形态共用壳 `src/layout/Article/View.tsx`）
- 模式：Read（理解与沉浸；读完就走）

## Audience / Job / Action
- 受众：不限语言与技术背景的 RSS 深度用户（2026-10-01 拍板放宽）
- 任务：每天精读少数几篇长文；播客单集听 + 看 show notes；平台视频外跳
- 动作：j/k 滚动、esc 逐级返回、f 星标、space 播放、⌘K 全局

## Chosen Direction & Memorable Moment
- 定稿（2026-10-01 三选一锁定）：**打字机隧道**（seed 360afa8e，掷中 #4）+ **信封双轴 TOC 捐赠**
- 结构：chrome 退场（下滚藏/上滚唤）· 焦带（中央全亮、上下渐隐降灰）· 右缘覆盖进度轨 · margin 大纲（≥3 标题且 ≥1280px）
- 难忘时刻：滚过标题幕后界面消失，只剩文字与一条右缘细线
- 对照稿：`.impeccable/mocks/decision/reading/`（tunnel/sections/margin 同内容三 mock + index）

## Unresolved
- 播客章节时间轴替代右缘轨刻度（mock 三形态卡已描述，未实现）
- 大纲在 h3 层级的缩进密度待真实长文检验
- 焦带降灰地板值 0.3 与衰减斜率未做用户实测校准
