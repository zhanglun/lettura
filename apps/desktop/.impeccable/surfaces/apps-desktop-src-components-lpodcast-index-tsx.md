---
version: 1
slug: "apps-desktop-src-components-lpodcast-index-tsx"
primary_target: "apps/desktop/src/components/LPodcast"
related_targets: ["apps/desktop/.impeccable/mocks/decision/podcast.html", "apps/desktop/src/stores/createPodcastSlice.ts", "apps/desktop/src/helpers/podcastDB.ts"]
---

# Surface Brief · 播放器三态（条 / 沉浸页 / 收起圆钮）

## Scope & Mode
- 入口：单集详情大播放钮、列表行 ▶ 起播后自动出现；不是独立路由，是壳层常驻物
- 模式：Operate + 持续状态（播客是这台阅读仪器上唯一的时间媒体，播放中它一直在）
- 面：`podcast.html`（`?state=bar|full|min`，`&panel=playlist|sleep` 直达浮层态）

## Audience / Job / Action
- 用户想边读边听一集播客：起播 → 继续读列表（条在底下走）→ 想精听时放大看队列 / 拖时间轴 → 想专注时收成右下圆钮 → 睡前设睡眠定时
- 任务：不打断阅读的前提下完成「听」的全部控制；进度不丢（换集、重启都能续）
- 动作：起播 → 读 → 拖/切/倍速/定时 → 收起或停播

## Chosen Direction & Memorable Moment
- 定稿：**三态同一材质同一 accent**（条 68px 玻璃卡 / 盖满面板的沉浸页 / 40px 环形进度圆钮），用户 2026-09 指定「可收起、可放大、收起后有入口」
- 难忘时刻：收起时右下那枚圆钮的环形进度在走——播放永不失联
- 关键决定（实现期收敛）：
  - **条浮在内容上**：给条留占位会把列表截短一条（2026-09-24 用户反馈「占据了空间」）→ 改为不给容器占位，只在**滚动内容末尾**留 102px 让位空白（`--fusion-player-inset` + `.fusion-inset-tail::after`，滚动容器：列表 / 阅读面 / 订阅浏览 / 设置）；列表因此从玻璃条下穿过，最后一行也能完全翻出
  - **队列入口两处**：列表钮（整队含当前集，380px 浮层）+ 沉浸页 UP NEXT（除当前集）；两者共用同一行组件 `QueueRow`
  - **库是队列的唯一真相**：`podcasts` 表即队列（`progress` 续播 / `duration` 首播回填），`currentTrack` 必须始终是队列成员
  - **esc 逐级**：浮层（睡眠菜单 / 播放列表 / ⌘K / 帮助）先关，裸按才把沉浸页收回到条

## Unresolved
- 清空整队：队列即 `podcasts` 表，清空会一并抹掉续播进度，需要 `--warn` 二次确认态才敢上（见 HANDOFF §6）
- 系统媒体键 / 锁屏控件（MediaSession）：已实现，如判定越出 0.2.0 范围可整段移除（见 HANDOFF §6）
- 章节（时间码）：feed 不提供 chapters，播客详情页已跳过；若将来接章节，队列行与时间轴要多一层刻度语法
- 进度回写粒度：`timeupdate` 5s 节流是折中值，未按真实磁盘写放大实测调优
