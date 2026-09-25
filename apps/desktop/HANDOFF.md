# Design Handoff — Lettura 0.2.0「静密 × 聚光」

> 交付给实现者的设计交接。Ground truth 链：**mock（可执行规格）> DESIGN.md（语法记录）> 本文档（落地地图）**。
> 任何冲突以 mock 为准；mock 变了要同步 DESIGN.md。

## 0. 怎么用

- **总入口：`index.html`**——8 张面的目录 + 交互态直达 + 一条完整动线，从这里点进任何面
- 每个 mock 都是独立 HTML，浏览器直接开：`apps/desktop/.impeccable/mocks/decision/<name>.html`
- 交互态用 URL 参数直达（见下表），不用手点
- mock 之间已互链：logo → index；导航 未读/星标(`?view=starred`)/历史(`?view=history`) → fusion，订阅 → feeds；源队列 ⏎ → detail；detail 返回按来路退回
- 已落地代码里搜 `契约` 注释（如 `add.html 契约`）可找到对应实现的出处
- 设计迭代流程：改 mock → 同步 DESIGN.md → 改本表状态；新面先写 mock 再写码

## 1. 世界规则（硬约束，不可协商）

1. **一个玻璃仪器**：主面板 inset 22px / radius 16 / blur 22 saturate 1.5；其余一切（⌘K、添加面板、帮助、播放卡）都是同材质浮层，不出现新容器类型
2. **单强调色**：`--accent` 是唯一的彩色；warn/amber/pink 只用于既定语义（失败/星标/B站），不做装饰
3. **发丝线做分隔**：`--hair` / `--hair2`，永远 1px；禁止彩色粗边框、渐变文字
4. **esc 是回家的路**：任何浮层/子视图 esc 逐级退回，列表位置永远保留
5. **无保存钮**：设置即改即生效；动效只允许 150–220ms 的状态反馈（行 hover、圆钮 scale、预览卡 grow），禁止入场动画全家桶

令牌定义：`DESIGN.md` 色板/字体/夜读本令牌表；CSS 实现在 `src/styles/fusion.css`（`--fusion-*` 前缀）。

## 2. Mock 清单与落地状态

| Mock | 面 | URL 参数 | 落地状态 | 代码位置 |
|---|---|---|---|---|
| `index.html` | 总入口：8 面目录 + 动线 + 世界规则 | — | —（demo 基建） | — |
| `fusion.html` | 未读列表 / 详情骨架 / ⌘K / 播放卡 | `?view=starred\|history` 列表变体 | ✅ 已落地 | `components/layout/AppLayout.tsx` + `styles/fusion.css`（第二刀）；列表行 `components/ArticleItem`、徽章 `components/KindBadge`、详情适配器 `components/ArticleView/adapter/{Common,Podcast,Platform}` |
| `detail.html` | 阅读面（排版要素 + 完读） | `?size=17&lh=2.2` 直达排版 | ✅ 已落地 | `components/ArticleView/Detail.tsx` + `layout/Article/View.tsx`（进度发丝线/引文/代码块语言标/「· 完 ·」+下一篇卡均已落地；语言标注入在 `helpers/articleContent.ts`） |
| `feeds.html` | 订阅浏览 + 源队列 | `?state=browse\|feed` | ✅ 已落地 | 浏览帧 `layout/Feeds/index.tsx`（分组源列表/键盘队列跳过零未读/折叠/位置保留）；源队列源头栏+未读/全部过滤条在 `layout/Article/ArticleView.tsx`（`readStatus` 覆盖经 `hooks/useArticle.ts`） |
| `settings.html` | 设置（三段+锚点导航+校准台）+ 订阅管理 | `?view=subs`、`?focus=sync` | ✅ 已落地 | `layout/Setting/index.tsx`（左锚点导航 + 校准台参数写入令牌已实现）；订阅管理 `layout/Setting/Subscriptions` |
| `add.html` | 渐进式订阅面板（发现优先 + 生成器回退） | `?q=<url>` 直达预览/失败/生成器态 | ✅ 已落地（2026-09-25 重梳理） | `components/AddFeed/index.tsx`；生成器表 `helpers/feedGenerators.ts`（内置 + 用户自定义）；发现层 `src-tauri/src/feed/mod.rs`（`resolve_feed_input`）；一次性抓取缓存 `parse_feed_cached`；实例/路由设置 `core/config.rs` + `layout/Setting` |
| `empty.html` | 空状态即引导 / 读完收尾 | `?s=first\|clear` | ✅ 已落地 | `layout/Article/EmptyFace.tsx`（`mode: "first" \| "clear"`） |
| `help.html` | ? 键帮助浮层 | — | ✅ 已落地 | `components/layout/HelpOverlay.tsx` |
| `dark.html` | 夜读本（深色令牌层） | `?state=list\|detail\|cmd` | ✅ 已落地 | `styles/fusion.css`（`body.dark-theme` 覆写全部 `--fusion-*`）；切换在 `App.tsx`（跟随配置或系统） |
| `podcast.html` | 播放器三态（条/沉浸页/收起圆钮）+ 播放列表 / 睡眠定时 | `?state=bar\|full\|min`，`&panel=playlist\|sleep` | ✅ 已落地 | `stores/createPodcastSlice.ts`（`playerMode`/`sleepTimer`/`playTrack`/队列按 `currentTrack` 推导）；条 `LPodcast/MiniPlayer` · 沉浸页 `LPodcast/FullPlayer`（UP NEXT）· 圆钮 `LPodcast/MiniPill` · 播放列表 `LPodcast/PlayList`+`PlayListPopover`（共用行 `LPodcast/QueueRow`）· 睡眠定时 `LPodcast/SleepControl`；三态动效 `LPodcast/utils.ts`（`PLAYER_MOTION`）；audio 模块级单例 + MediaSession `LPodcast/useAudioPlayer.ts`；队列/进度/时长持久化 `helpers/podcastDB.ts`；条的让位空白 `--fusion-player-inset` + `.fusion-inset-tail`（`fusion.css` + `AppLayout.tsx`） |

截图证据：`apps/desktop/.impeccable/review/*.png`（每帧一图，1180×738 = mock 原尺寸，headless Chrome 渲染 mock）。帧 ↔ 状态出处：

| 帧 | mock · 状态 | 帧 | mock · 状态 |
|---|---|---|---|
| `list` | fusion.html（默认） | `podcast-bar` / `podcast-full` / `podcast-min` | podcast.html `?state=bar\|full\|min` |
| `detail-top` / `detail-end` | detail.html（顶 / 滚到底） | `podcast-playlist` / `podcast-sleep` | podcast.html `?state=bar&panel=playlist\|sleep` |
| `feeds-browse` / `feeds-queue` | feeds.html `?state=browse\|feed` | `empty-first` | empty.html `?s=first` |
| `subs` | settings.html `?view=subs` | `help` | help.html |
| `set-appearance` | settings.html（默认） | `set-sync` | settings.html 同步段贴顶（rail 点亮同步与来源） |
| `set-system` | settings.html `?focus=system` | `set-rail-sync` | settings.html 同步段居中（滚动侦测未达 90px 阈值，rail 停在上一段） |
| `add-preview` / `add-fallback` / `add-generator` | add.html `?q=sspai.com`（发现）/ `?q=example.com/no-feed`（失败→手填路由）/ `?q=space.bilibili.com/…`（经生成器） | `dark-list` / `dark-detail` / `dark-cmd` | dark.html `?state=list\|detail\|cmd` |

重出时机：**mock 变了就重出**（本轮因「条不再占位、面板铺到窗口下缘」全量重出 21 帧）。

## 3. 待落地清单（按优先级）

**P1 — 补阅读体验闭环 ✅ 本轮已完成（2026-09-23）**
1. ✅ `Detail.tsx`/`View.tsx`/`fusion.css`/`articleContent.ts`：进度发丝线、引文（1px 发丝左线+宋体+`--sub`+字号减1）、代码块（白玻璃+hair 边+SF Mono 12.5+右上语言标，`processArticleHtml` 注入 `.code-lang`）、行内码（mono+.05 底+hair 边）、链接（accent 下划线 offset 3px+`--accent-line` 装饰线）、「· 完 ·」→ 下一篇卡+「已读并返回 m」
2. ✅ `layout/Feeds/index.tsx`：浏览帧——分组源列表（源行 46px、未读数右对齐靛蓝加粗、零未读 `is-muted` 转灰退出键盘队列、组头折叠+小计）、`RouteConfig.LOCAL_FEEDS` 渲染浏览帧、会话记忆（焦点/滚动/折叠跨队列往返保留）；源队列帧源头栏（返回+源名+全部已读/同步/去管理）+ 未读/全部过滤条（`useArticle.readStatus` 覆盖）在 `ArticleView.tsx`
3. ✅ `AppLayout.tsx`：导航「订阅」→ 浏览帧；章节标题「订阅 · 源名」、浏览帧计数药丸=源总数；设置章节改「设置」/「设置 · 订阅」（DESIGN.md 顶栏契约）

**P1.5 — 体验修正轮 ✅（2026-09-23，用户走查反馈）**
1. ✅ 顶栏左上改**产品名「Lettura」**（logo + 名 + 常驻未读药丸；浏览帧药丸=源数）；当前位置由导航高亮表达，不再放视图名（DESIGN.md 已同步）
2. ✅ 删除未读列表冗余视图头（feed 名 +「N 篇未读」+「已加载 N 篇」+「当前筛选」行）；同步/全部已读移入过滤条右侧图标钮——也顺带修掉了离开源队列后 viewMeta 残留 feed 名的 bug
3. ✅ **真实总数**：后端 `/articles` 返回同条件 `total`（`feed/article.rs` COUNT）；过滤条「全部」与源队列「全部」用服务端总数（`useArticle.total`）
4. ✅ 列表行重设计：行首 56×34 缩略图（banner/预览图，无图落类型预设色块）、源列 14px feed 图标（`feed_logo`）、时间列 `nowrap`、行尾动作常显（`.62` 透明度 hover 全显）——mock（fusion/feeds/detail/dark/help/settings 预览行）已同步
5. ✅ 订阅管理按 settings.html 契约重建（`Subscriptions/index.tsx`）：搜索/新建分组/添加订阅工具条、分组折叠+悬停组动作、44px 订阅行（图标/题+未读药丸/域名/时间/悬停动作）、右键菜单=命令面板浮层语法；旧管理界面（KPI 卡/详情面板/拖拽）退役
6. ✅ 设置段题去英文大写后缀（APPEARANCE/SYNC/SYSTEM/PREVIEW），单语章节字

**P1.6 — 强调色契约闭合轮 ✅（2026-09-23，impeccable critique 双代理评审驱动，快照 `.impeccable/critique/2026-09-23T02-13-51Z__*.md`，19/36）**
1. ✅ P0 换色链单源化：`helpers/accent.ts`（五色板 + `applyAccent` 只写种子变量）；fusion.css 的 soft/line/阴影/环境光靛侧全部 `color-mix` 从 `--fusion-accent` 派生（清掉 11 处硬编码靛蓝字面量，含暗色块误用浅色基色的笔误）；持久化 `userConfig.accent_color`（Rust `config.rs` 新字段）；夜读本变体 = 与白 28% 混合派生（种子 `--fusion-accent-dark-hex`，indigo 不设回落契约值）；App.tsx 启动从 cfg 应用，localStorage 通道删除——harness 亮/暗双帧验证全苔绿零靛蓝
2. ✅ P1 订阅子视图 esc 注册（订阅管理→设置）；头部语义对调（返回钮=「设置」，标题=「订阅管理」）
3. ✅ P1 设置 scroll spy（rAF 节流 + 末段触底兜底）；色板选中环 userConfig 驱动随点击移动，环色改 `accent-line`，tooltip/aria 用中文色名
4. ✅ P2 文案：INTERVALS 补 zh 译（消「手动 / 1 hour」混排）；全库「文件夹」→「分组」；health 词汇对齐 mock（「同步失败」/「健康正常」）；folder_meta 补量词；校准台宋体样张回填全文；出口箭头文本字形换 SVG
5. ✅ DESIGN.md 色板表改写：accent 五色板 + 派生规则 + 夜读本提亮规则入档（偿还「唯一强调色 vs 五色板」的文档债）；settings mock 换色演示同步为种子变量方案 + `?accent=%23hex` 直链
6. ⏸ 未做（用户裁定留下轮）：P2 控件词汇重制——玻璃菜单浮层（替代原生 select）、分段胶囊化（radius 999 对齐 fusion-tab）、滑杆白环旋钮；P3 校准台密度显影

**P1.7 — 去竖线轮 ✅（2026-09-23，用户指出彩色竖侧线＝AI 味）**
1. ✅ 焦点语法 v2（无侧线）：列表焦点行＝洗色 `.055` + 圆点 3px 光环（`--accent-line`，原 accent-soft 提亮）；浏览帧源行焦点＝洗色 + 源名 600 字重；设置导航当前段＝tab 选中语法（`.07` 底 + 600，与过滤条/顶栏导航同一套）——`fusion.css` 三处 `inset 2px 0 0` 全部移除，暗色覆写同步
2. ✅ mock 同步：fusion/feeds/dark 的 `.focus`、settings 的 `.snav.on` 同方案改写；dark 圆点光环对齐 accent-line
3. ✅ 旧层死样式清理：`custom-components.css` 的 `.today-signal-why` / `.starred-article-note`（3px side-tab callout，零引用）删除
4. ✅ 进度发丝线 width 过渡改 `transform: scaleX`（契约等价，detector 全绿）
5. ✅ DESIGN.md：焦点行状态表改写；设置导航语法改 tab 选中；禁令明确「彩色竖侧线（border-left/right >1px 或 inset 侧影做状态记号）」，状态一律用洗色+字重+光环表达
6. 验证：harness 亮/暗双帧截图确认焦点可读性不降；detector 0 findings；164 测试 + build 全绿。保留：引文 1px 中性发丝左线（契约语法，非彩色）与发丝线分隔（世界规则 3）

**P1.8 — 缩略图与行距轮 ✅（2026-09-23，用户反馈「左边图片还是文 / 时间与操作栏间隔太小」）**
1. ✅ 根因：`articles` 表无 image 列（og:image 仅实时代理用于详情），列表 `article.image` 恒空 → 全部落「文」占位。修复：`pickThumbUrl`（`helpers/articleContent.ts`）客户端取图——description 首图 > media_object 图片附件；RowThumb 三级退化：**内容首图（cover）> feed 图标（16px 居中）> 安静类型色块（无字符）**，`.ph` 字符占位样式删除
2. ✅ 间距：操作列 44→56px（原 44px 装不下两个 24px 命中区、左溢挤到时间列——「间隔太小」的真凶），时间列右距 6→12px
3. ✅ mock 同步：fusion/feeds/dark/help 行网格与时间右距对齐；thumb 去字符（有图行演示中性渐变、无图行类型色块）；detail 下一篇卡与 settings 校准台预览行同步去字符；settings `.fi` 源图标字母退化保留（源身份，非缩略图）
4. 验证：harness 三态截图 + 167 测试 + build + Rome + detector（0 findings）全绿。后续可选：sync 时落 image 列入库（迁移 + 同步管线改造，当前客户端取图已覆盖 feed 自带图）

**P1.9 — 无限滚动卡死修复 ✅（2026-09-23，用户反馈「列表页无法加载更多」）**
1. 根因：`ArticleListVirtual` 的 `isScrolled` 状态机——触底置 true 后，新内容增高**不触发 scroll 事件**、标志无机会重置；「拖滚动条一次跳到底」的路径不途经非底区（无中间 scroll 事件），`atBottom && !isScrolled` 永远挡住下一页。滚轮渐进滚动因途经非底区能侥幸重置，故此前未暴露
2. 修复：删掉 isScrolled 状态机，触底判定直接由「1s 冷却 ref + isLoading + isReachingEnd」三门闩防抖——任何滚到底的姿势（滚轮/触控板/拖滚动条/键盘 End）都能连续触发
3. 验证（浏览器实测 localhost:9527）：后端分页接口 3 页正常（排除服务端）；修复前跳底路径 40→60 即卡死；修复后跳底连续 4 轮 20→40→60→80，渐进滚动不受影响；167 测试 + Rome + tsc 全绿

**P2.0 — 播放器三态 + 行徽章移除 ✅（2026-09-24）**
1. ✅ 行内类型徽章移除（图片与标题之间的「文」）：类型信息由缩略图预设色承载，`.fusion-row` 六列；mock（fusion/feeds/dark/help/detail/settings）同步
2. ✅ 播放器三态（新面 podcast.html，`?state=bar|full|min`）：bar 条（传输簇 2px 紧凑 + 右簇 倍速/放大/收起）/ full 沉浸页（168px 封面 + 大时间轴 + 48px 传输 + UP NEXT 发丝行队列，esc 收回）/ min 右下 40px 环形进度圆钮（hover 显影，点击回条）——右簇后两颗钮（睡眠定时/播放列表）与队列入口在 P2.1 补齐
3. ✅ 双 bug 修复：「多 audio 实例同播」＝useAudioPlayer 每消费者各建 Audio → 改模块级单例（`getAudio`/`stopSharedAudio`）；「Failed to play audio」误报＝第二实例 play() 打断第一实例的 AbortError 被当错误 → AbortError 静默；另修：无曲目卸载时单例残响 → `stopSharedAudio` + 状态复位；进度写库 5s 节流；selector 加 useShallow
4. ✅ esc 优先级：沉浸页开启时 AppLayout esc 收回条，四个视图（ArticleView/Setting/Subscriptions/FeedsBrowse）esc handler gate；bar 态才给内容区留 90px 底距
5. ✅ 验证：浏览器实测真实音频播放（进度推进、无 toast）、bar/full 截图核对、布局度量（传输簇/右簇坐标）；167 测试 + build + tsc + Rome 全绿
6. 遗留：用户库暂无真实播客源（articles 无 audio enclosure）——测试用种子已清理；`PlayList{,Popover}` 当时不再被 bar 引用 → 已在 **P2.1** 改造成播放列表面复活，仅 `PlayList.css`（旧 Radix 皮肤）删除

**P2.1 — 播放器能力收口（播放列表 / 睡眠定时 / 三态动效）✅（2026-09-24）**
1. ✅ 睡眠定时：`createPodcastSlice` 里已备的 `SleepTimer`/`SLEEP_STEPS` 补上 UI（`LPodcast/SleepControl`，条与沉浸页共用）——静默态月亮钮 / 激活态 accent-soft chip 走剩余 `mm:ss`（每秒递减）；菜单浮层关闭·15·30·60，到点暂停并清空、重设或关闭作废旧定时
2. ✅ 播放列表：底条列表钮拉出 380px 浮层（整队含当前集）；与沉浸页 UP NEXT **共用行组件** `QueueRow`（缩略图/题/源/时长/悬停删除，当前行 accent-soft 洗色 + 「播放中」，⏎/space 可选中）；面板里题源叠两行避让窄列；点行即切（点当前集＝播放/暂停，走新增 `playTrack`）；空队列走引导态
3. ✅ 队列语义：索引由 `currentTrack` 推导（删当前集由接替者顶上、播完前进、越界回卷）；「库 → store」镜像幂等化，且 **currentTrack 必须始终是队列成员**——修掉「库行消失后播放器挂幽灵单集」与投影身份抖动引起的 `Maximum update depth` 循环
4. ✅ 持久化：`progress` 续播（5s 节流、播完归零）、`duration` 首播回填（队列行时长靠它）；`AudioTrack` 只投影 `duration`，不再冗余带 `progress`
5. ✅ 三态动效：`AnimatePresence` 保退出帧，150–200ms 缓出、位移 ≤10px（条/沉浸页自下缘长起，圆钮自右下弹入）；播放列表浮层 grow 200ms / out 140ms
5b. ✅ esc 逐级退回修正：壳层 `useHotkeys("escape")` 注册早于 Radix 浮层（后者在**捕获阶段** preventDefault），沉浸页开着浮层时一次 esc 会「关浮层 + 收底条」同时发生 → 壳层加 `e.defaultPrevented` gate（与 `HelpOverlay` 同一套写法）；同时修好了 ⌘K/添加/帮助在沉浸页下的同类抢跑。实机验证：①esc 关菜单（仍 full）→ ②esc 收回条
6. ✅ 系统媒体键 / 锁屏控件（MediaSession：play/pause、±30s、上一集/下一集，WebView 不支持时整段跳过）；顺带修掉「壳层 + 详情页各挂一份监听 → 播完连跳两集」（1s 去重窗，留 `ponytail:` 注释）
7. ✅ 死码清理：`PlayList.css`、`useAudioPlayer` 未被消费的返回面（volume/setVolume/playTrack/setProgress/playPrevious/playNext）、`STORAGE_KEYS` 三个废键、i18n 废键（`podcast.podcast.empty*` / `Playlist` / `ctl.open_detail`）、`createUserConfigSlice` 里重复的 podcast 状态及其测试
8. ✅ 规范对齐：两处新浮层回落同一材质（radius 14 / padding 6 / `.94` 白 + blur 28 / 与 `.fusion-float` 同一投影 / 菜单项 9px），`podcast.html` 同步；实机核对 computed style（面板 380px、行 9px、三态进出帧、chip 每秒递减）
9. 验证：192 测试（新增 `createPodcastSlice` 14 / `PlayList` 5 / `SleepControl` 3 / `LPodcast` 3 / 壳层 esc 分层 2）+ tsc + build 全绿；dev server 种子队列后浏览器逐一核对（computed style / 三态进出帧 / chip 每秒递减 / 两次 esc）
10. ⏸ 未做（等设计）：**清空整队**按钮——队列即 `podcasts` 表，清空会一并抹掉这些单集的续播进度，需 `--warn` 二次确认态，见 §6
11. ✅ mock 规格可执行性修复：`fusion.html` 的 `expandBtn` 在播放器三态落地时被拆成两钮后成了断链 → 脚本首行抛错、列表（0 行）根本没渲染；已删该行（修好后 11 行，本轮再加 3 行 → 14 行）。全量体检 10 份 mock 的 `getElementById` 引用：仅此一处失效
12. ✅ 播放器 mock 交互态直达：`podcast.html` 新增 `?panel=playlist|sleep`（与 `?state=` 同一套「URL 直达」约定）；`dark.html` 底条补齐到与 podcast 条同构（±30s/睡眠定时/播放列表/放大/收起，夜读态按钮 hover 用 `rgba(233,233,230,.06)`）；fusion/dark 列表各加 3 行，使内容真正穿到条下
13. ✅ 面内策略补 brief：`.impeccable/surfaces/apps-desktop-src-components-lpodcast-index-tsx.md`（含两条实现期决定：条不占位只留内容末尾空白、队列入口两处）
14. ✅ review 帧全量重出（21 帧，含 5 帧播放器面新增）+ 帧↔状态出处表（§2）

**P2.2 — 条改悬浮（不再占位）✅（2026-09-24，用户：现在占据了空间）**
1. ✅ 版式：条继续绝对定位浮着，但**不再给内容区留 padding 占位**（原 `AppLayout` 的 `paddingBottom: 90`）——列表内容从玻璃条下穿过；改由内层滚动容器在**内容末尾**留 102px 让位空白（= 条 68 + 底距 22 + 呼吸 12）
2. ✅ 实现：`AppLayout` 用 CSS 变量 `--fusion-player-inset`（仅 bar 态且播放器在场时为 102px，min/full/无音频为 0）传给子树；`.fusion-inset-tail::after` 在内容末尾生成真内容盒（不用滚动容器 padding——WebKit 对滚动 padding 的算入不一致）；挂到 4 个滚动容器：列表 `ArticleListVirtual`（空态不挂）、`ArticleView/ScrollBox`（阅读面）、`.fusion-browse`（订阅浏览）、`.fusion-set-body`（设置）
3. ✅ 实机核对（dev server + 真后端 3456，60 行真实列表）：列表容器底（963）低于条底（941）→ 内容确实穿到条下（条竖向范围内常驻 2 行）；滚到底：最后一行底 861 vs 条顶 873 → **留 12px 不遮**；`--fusion-player-inset`/`::after` 高度均 102px；无音频时变量为 0、零副作用
4. ✅ mock 全量同步同一版式：10 面 `.panel` 从 `inset:22px 22px 106px` 改为 `inset:22px` + 内容末尾 102px 让位（podcast/fusion/dark 的列表因此从条下穿过）；`DESIGN.md` 版式图与条行改写为「悬浮 + 内容末尾让位」

**P2.7 — 生成器与站点自带 feed 的关系收口 + 实例被拒可读 ✅（2026-09-25）**
1. ✅ **修我自己在 P2.6 引入的回归**：快通道让**站点自带 feed 的平台**也被生成器抢走——YouTube 频道页自己声明了 `feeds/videos.xml?channel_id=…`、Substack 页面声明了 `/rss/`。新增生成器表字段 **`nativeFeed`**：有它的（YouTube/Substack）**先走发现层**（一次请求、不依赖第三方实例），生成器只作回落；没有它的（B站空间/知乎/微博——这些平台确实不提供 feed）才走快通道
2. ✅ 顺带修 YouTube 路由：`/channel/UC…` 与 `/user|/c/…` 在 RSSHub 上是**两条不同路由**，原表一律拼 `youtube/user/$1`（对 channel 是错的）
3. ✅ 修一个自引入的死循环：发现失败后的生成器回退**必须用 `nativeFeed` 收口**，否则 B站 这类快通道地址会拿着同一个地址无限重试（被新增测试抓到）
4. ⚠️ **重要发现：`rsshub.app` 公共实例对我们返回 403**（响应体原话："Due to cost considerations, we will gradually restrict access to rsshub.app for some feed readers."）→ **我们当前默认值是个必然失败的默认**。已做：`fetch_body` 的非 2xx 错误串带上明确状态（`HTTP 403 Forbidden`，原来被笼统写成 "Not 200 OK (403)"），且当"地址走的是路由/实例却被 401/403 拒绝"时，路由行的 helper 文案直接换成**「实例拒绝访问…换成自建或镜像实例」**（提示放在唯一跟实例有关的位置，不新增控件/不新增行）。**待决定**：默认实例是否留空并在设置里引导（见 §3 遗留）

**P2.6 — 探测耗时收口（用户报"正在检测很久"）✅（2026-09-25）**
1. ✅ 根因不是"要不要检测"（发现层正是"粘任意地址"能成立的原因），而是三处实现缺陷：①`create_client` **既没有超时也没有 UA**——reqwest 默认无总超时，一个不回包的站点能让"正在检测"无限转圈（同步 worker 同样会被卡死）；②发现层是 **1 + N 个串行请求且无上限**（alternates + 6 条常见路径）；③前端探测**没有防串台**，慢响应回来会覆盖新状态、让 spinner 一直挂着
2. ✅ 修：客户端加 `timeout(12s)` + `connect_timeout(5s)` + UA；发现层加 `DISCOVERY_BUDGET=6s` 整体 deadline + 候选上限 3（常见路径按命中率排序，前三个已覆盖 `/feed` `/rss` `/feed.xml`）；前端拿 `probeRef` 令牌丢弃过期响应
3. ✅ **顺序也修了**：已知平台主页（B站空间/知乎/微博/YouTube/Substack）走**生成器快通道**——直接生成地址并预览，不再先花一轮"发现"（这类地址常见路径探测几乎必然全空）；发现层只服务"未知站点"。前端测试锁住：快通道下 `fetchFeed` 只被调用 **1 次**
4. ✅ 实测（`#[ignore]` 网络测试 `test_resolve_latency_is_bounded`）：`sspai.com` **1.0s** 发现 `/feed`；`example.com`（任何路径都没 feed）**3.8s** 报错；`10.255.255.1`（黑洞地址）**3.9s** 被连接超时截断（改前=无限等待）

**P2.5 — 媒体两轴（载体 × 来源，取代「文章/播客/平台」三桶）✅（2026-09-25）**
1. ✅ 动机：`platform` 是个混桶——B站视频、知乎/微博图文、Newsletter 邮件都塞在一起，UI 只好给每个平台写特例；而"能不能站内播 / 要不要外跳"其实是**载体**（条目级）的属性，"内容从哪来"是**来源**（源级）的属性
2. ✅ 数据：迁移 `2026-09-25-010000_carrier_origin`——`articles.kind → carrier`（text/audio/video/email，含 `articles_carrier` 索引）、`feeds.feed_type → origin`（native / generator:<route>）、新增 `feeds.carrier`（源级提示，源图标用）。**先在库副本上验过**，并与旧判定逐行对账：文章 0 差异、源 0 差异（纯重标签，无信息损失；实测 text 6722 / audio 101 / video 7）
3. ✅ 判定仍只有一处：`cmd.rs` 的 `classify_entry`（audio enclosure → audio；否则来源声明的载体）＋ `feed_carrier_hint`（源级）＋ `resolve_origin`；生成器路由表每条声明自己的载体（`helpers/feedGenerators.ts` 的 `carrier: text|audio|video|email`），自定义路由行支持三段式 `匹配 => 路由 => 载体`
4. ✅ 查询/接口：过滤参数 `carrier`、计数接口 `/api/articles/carrier-counts`（text/audio/video/email 四档）、列表与单篇回 `carrier`/`origin`/`feed_carrier`、`/api/subscribes` 回源的 `origin`/`carrier`
5. ✅ 前端：`helpers/mediaType.ts`（新，取代 `articleKind.ts`）只做"两轴 → 徽章/平台名"映射，并导出语义推导 `canPlayInApp` / `opensExternally`；`ArticleItem` 色块、`FeedIcon`、`CommandPalette`、`Detail` 适配器选择（audio→播客面 / video→外跳面 / 其余→阅读面）、`Platform` 适配器全部改读两轴；**不再有 URL 正则**
6. ✅ 过滤条改按载体分档：全部/文章/播客/视频（邮件档仅在真有邮件内容时出现）；mock（fusion/dark/podcast/add/settings）与 `DESIGN.md` 同步
7. ✅ 验证：cargo **39** 测试（`test_carrier_filter_and_counts`、`test_classify_entry_from_parsed_feed` 改写为两轴）、前端 **212** 测试（新增 `mediaType` 9 条）、tsc + build 全绿

**P2.4 — 订阅流程重梳理（发现优先 / 生成器数据化 / 完成即跳）✅（2026-09-25）**
1. ✅ 根因（用户反馈"只能支持 rss 地址""点确定就关了、没有后续交互"）：①后端只 `GET`+XML 解析，**没有 HTML feed 发现** → 粘 `sspai.com` 这类"有 feed 但不在 /feed 结尾"的站点直接失败；②平台只 4 条硬编码正则 + 写死公共 `rsshub.app`，且 brief 里"自建 or 公共"一直未定；③预览卡少了 mock 契约里的**最近条目**（根因是 `fetch_feed` 只回 feed 元信息、不回条目）；④订阅后再抓一次（两次网络往返）；⑤完成态只有"已订阅"然后 900ms 自动关闭
2. ✅ 发现层（`feed/mod.rs`）：`resolve_feed_input` —— 直接解析 → 是 HTML 就看 `<link rel="alternate" type="application/rss+xml|atom+xml">`（用 `scraper` 解析，相对地址自己补全）→ 再试 6 条常见路径；返回 **生效地址 + 候选列表**。实机/联网测试：粘 `https://sspai.com` 得到 `https://sspai.com/feed`（"少数派"，试了 6 个候选）
3. ✅ 一次抓取：`parse_feed_cached`（10 分钟 TTL 的内存缓存，只服务添加流程；同步路径不走缓存）——预览抓过的，`add_feed` 直接复用
4. ✅ 生成器**数据化、不写死清单**：`helpers/feedGenerators.ts`（内置便利表 + 用户自定义 `匹配 => 路由` + 目标 rsshub/native 两种）＋ 设置项「RSSHub 实例」与「自定义生成路由」＋ 面板里**手填路由**现生成现预览；类型记 `platform:<route>`（A 步的任意值轴接住了未知平台）。starter pack 里的 9 个 `rsshub.app` 源在安装时按设置实例改写
5. ✅ 预览卡补回契约：最近条目（6 条：标题 + 时长/日期，数据来自同一份解析）、多候选 chips、生效地址与路由/实例、分组下拉含「新建分组…」（内联输入 + 创建后自动选中）
6. ✅ 完成即走：toast「已订阅「X」· 已同步 N 篇」+ 关闭面板 + **跳到该订阅的源队列**；不做"再加一个"循环（用户决策）
7. ✅ 移除固定平台分段行（用户决策：清单不能固定）——输入框只表达"自动"，生成器是回退路径
8. ✅ 验证：cargo **39** 测试（新增发现层 4 条纯函数 + 1 条联网 `#[ignore]`）；前端 **212** 测试（新增 `feedGenerators` 7 条、`AddFeed` 面板状态机 6 条——测试抓出真 bug：生成器只用了用户表、漏了内置表）；tsc + build 全绿。mock `add.html` 重写（去分段、加候选 chips/生成器回退/完成跳转提示、`?q=` 直达），`settings.html` 加两行；栅格重出 `add-preview` `set-sync` `set-rail-sync` + 新增 `add-fallback` `add-generator`

**P2.3 — 类型落库（A 步：判定从读路径移到入库）✅（2026-09-25）**
1. ✅ 问题：同一谓词三份实现（TS `articleKind.ts` 正则 + SQL `ARTICLE_KIND_SQL` 镜像，注释自写"与 articleKind.ts 同一标准"），且全在读路径：你的库 6831 篇，每次类型筛选/计数都要对全表 `json_each(json_extract(...))`；`feeds.feed_type` 一直空置（33 空串 / 50 'rss'，无读取代码）；平台靠 URL 猜（自建 RSSHub 域名/镜像/转发失效，正文带 youtube 链接的普通源误判）
2. ✅ 数据：新迁移 `2026-09-25-000000_add_article_kind`——`articles.kind TEXT NOT NULL DEFAULT 'article'` + `articles_kind` 索引；用原 CASE 表达式回填历史数据（回填后与旧判定对账：`kind <> CASE` 差异 **0 行**）；并回填 `feeds.feed_type`（已知生成器域名 → `platform:bilibili|douyin|zhihu|weibo|youtube|newsletter`，其余按条目形态 → `platform|podcast|rss`；实测分布 rss 77 / podcast 3 / platform 2 / platform:newsletter 1）
3. ✅ 判定实现归一：`cmd.rs` 的 `classify_entry`（条目级：平台源优先，否则 audio enclosure → podcast）+ `resolve_feed_kind`（源级：客户端已知路由优先，否则看条目音频）；入库路径 `create_article_models` 一次写入；`sync_articles` 复用源的 `feed_type`；Rust 测试 `test_classify_entry_from_parsed_feed`（走真实 RSS XML 解析）
4. ✅ 查询：删掉 `ARTICLE_KIND_SQL`；筛选 → `A.kind = ?`（计划为 `SEARCH ... USING INDEX articles_kind`）；计数 → 按列聚合（旧全表 CASE 聚合 0.184s → 新 <0.005s）；列表与单篇接口都回 `kind`/`feed_type`；`/api/subscribes` 回源的 `feed_type`
5. ✅ 前端：`helpers/articleKind.ts` 只留「值 → 徽章/平台名」映射（URL 正则与 enclosure 解析全删）；`FeedIcon`/`CommandPalette`/`Platform` 适配器改读字段；`RowThumb` 色块读 `article.kind`；删掉无引用的 `KindBadge.tsx`（P2.0 撤行内徽章后的死件）；平台细分按**存下来的路由键**取，未知平台回落通用徽章
6. ✅ 验证：cargo 34 测试 + 前端 199 测试 + tsc + build 全绿；实机（真后端 3456）`/api/articles?kind=podcast` → total 101 且行带 `kind/feed_type`；`kind-counts` = 6722/101/7；UI 过滤条显示服务端计数（全部 6820 = 6716+97+7）、播客筛选下行为 `fusion-thumb pod`
7. 说明：C 步（把"平台"拆成 载体 × 来源 两轴）属设计层下一步，会动徽章语法与 mock，单独一轮
5. ✅ 触底加载修复（用户反馈：滚到底要回滚一下才能继续加载）。两个叠加的根因：①判据 `(scrollTop + clientHeight) / scrollHeight > 0.9` 里 `scrollHeight` 现在包含了 102px 让位空白（判定点落进空白，看到最后一行时还不加载）；②只靠 **scroll 事件** + **1s 时间冷却** 防抖——停在底部不再有 scroll 事件、冷却又未到期，于是“再动一下”才能续上。修：判据扣掉 `--fusion-player-inset`（按**内容**高度算）+ 用 `requestedSizeRef` size 门闩代替时间冷却。实机：连续 5 次快速滚到底（250ms 间隔）20→40→60→80→100→120 不断档；仅滚到「最后一行完整可见」（离真底还差 1182px）即触发。回归测试 4 条 `ArticleListVirtual/__tests__`（含“不推进定时器也不二次触发”与“让位空白不算内容”）

**P2 — 清理与对齐（部分完成）**
4. ✅ 删设置死目录：`layout/Setting/{General,ImportAndExport,Proxy,ShortCut,Subscribe}` 已随 b49d3fb 死码大清理删除（目录与文件均已不在，全仓无引用）；`Content/` 只剩 `DialogDeleteFolder`/`DialogUnsubscribeFeed` 两个被 Subscriptions 引用的弹窗
5. ⏸ **默认 RSSHub 实例**：`DEFAULT_RSSHUB_INSTANCE = https://rsshub.app` 实测 403（见 P2.7），等于给用户一个必然失败的默认。选项：(a) 默认留空 + 设置里引导自建/镜像；(b) 保持默认但首次 403 时自动带用户去设置。**待决定**
6. ⏸ **通知**（原记作「控件对齐」，实际是未实现的能力）：mock「行为与数据」有一段（`关闭 / 仅高信号`，文案：仅高信号＝新播客单集与来源恢复），但实现侧完全没有——`UserConfig` 无 `notification_enabled`/`notification_level`，设置页没有这一行，只有 `tauri_plugin_notification` 已注册。要落地需：(a) 两个配置字段 + 设置行；(b) 同步路径上判定「新播客单集 / 来源恢复」并触发系统通知。**待决定**：本轮实现，还是把 mock 该段标为「未进入 0.2.0」
6. ✅ 星标/历史导航项＝列表变体：mock `fusion.html?view=starred|history` 演示 + 实现 `/local/starred` 与 currentFilter 过滤覆盖，无新面

**P3 — 后续轮**
7. 销毁确认对话框（退订…/删除分组）与订阅源详情面：**未设计**，做前先补 mock
8. 夜读本命名候文案与切换动效细则未定稿

## 4. 键盘模型（实现核对表）

```
j / k / ↑↓   移动焦点（详情内 = 下一篇/上一篇；订阅浏览帧跳过零未读源）
Enter / o    打开焦点行（浏览帧 = 进源队列）
Esc          逐级退回：⌘K/帮助 → 列表；源队列 → 浏览 → 未读；订阅管理 → 设置 → 未读；位置保留
m / M        已读并下移/上移
f            星标
v            浏览器打开原文
space        全局播放/暂停
R            刷新全部来源
⌘K 或 /      命令面板（含「打开设置」「添加订阅」）
?            帮助浮层
⌘,           打开设置
```

## 5. 夜读本

- 切换：跟随系统或设置（`App.tsx`），令牌层 `body.dark-theme` 全量覆写，**结构与组件零改动**
- 关键差异：暖黑画布 `#17171A`（非蓝黑）、玻璃更深更透、accent 提亮 `#848CE8`、阅读面落 `--fusion-paper` 暗纸 + 宋体暗墨、阴影系转黑基、veil 压暗 .32
- 实测对比度优于昼读（sub 7.2 / 暗纸宋体 10.2）

## 6. 未决项（实现时别替产品做主）

| 项 | 出处 | 状态 |
|---|---|---|
| ~~知乎/微博的 RSSHub 真实路由~~ | AddFeed brief | ✅ 2026-09-25 定：不做固定清单——内置便利匹配 + 设置里自定义路由 + 面板手填路由；实例是设置项 |
| ~~Kill the Newsletter 实例~~ | AddFeed brief | ✅ 2026-09-25 定：Newsletter 走「RSSHub 实例设置」（substack 另有原生 `/feed` 直连） |
| 全部设计稿零眼审 | 设置 brief | 机械验证全绿，人未过目——落地前应人工走查一遍 8 份 mock |
| `add.html` 探测耗时 | AddFeed brief | 已按真实网络（无 520ms 演示值），慢站点由行内 spinner 承担 |
| 焦点行禁 hover 洗色的边界情况 | DESIGN.md | 详情内 j/k 连续移动时确认无闪烁 |
| 清空整队（播放列表） | P2.1 | 队列即 `podcasts` 表，清空＝删光行＋抹掉续播进度；未设计确认态，暂不做——要加先补 mock（建议 `--warn` 二次确认） |
| 系统媒体键（MediaSession） | P2.1 | 已实现（锁屏/耳机键 play·pause·±30s·上下集），无 UI 依赖；若判定越出 0.2.0 范围可整段移除 |

## 7. 面内策略（surface briefs）

`apps/desktop/.impeccable/surfaces/`：`setting-index-tsx.md`（设置+订阅管理）、`addfeed.md`（渐进面板）、`lpodcast-index-tsx.md`（播放器三态）。改方向先改 brief。

---

*生成于设计定稿轮（8 mock + fusion.css 第二刀落地中）。mock 是规格，DESIGN.md 是语法，这份是地图——三者不一致时，改到一致为止。*
