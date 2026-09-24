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
| `add.html` | 渐进式订阅面板 | 首屏即面板；试试 chips 驱动各态 | ✅ 已落地 | `components/AddFeed/index.tsx`（370 行，含平台 URL 识别） |
| `empty.html` | 空状态即引导 / 读完收尾 | `?s=first\|clear` | ✅ 已落地 | `layout/Article/EmptyFace.tsx`（`mode: "first" \| "clear"`） |
| `help.html` | ? 键帮助浮层 | — | ✅ 已落地 | `components/layout/HelpOverlay.tsx` |
| `dark.html` | 夜读本（深色令牌层） | `?state=list\|detail\|cmd` | ✅ 已落地 | `styles/fusion.css:1643`（`body.dark-theme` 覆写全部 `--fusion-*`）；切换在 `App.tsx:78`（跟随配置或系统） |

截图证据：`apps/desktop/.impeccable/review/*.png`（每帧一图）。

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
2. ✅ 播放器三态（新面 podcast.html，`?state=bar|full|min`）：bar 条（传输簇 2px 紧凑 + 右簇 倍速/放大/收起，队列入口=放大）/ full 沉浸页（168px 封面 + 大时间轴 + 48px 传输 + UP NEXT 发丝行队列，esc 收回）/ min 右下 40px 环形进度圆钮（hover 显影，点击回条）
3. ✅ 双 bug 修复：「多 audio 实例同播」＝useAudioPlayer 每消费者各建 Audio → 改模块级单例（`getAudio`/`stopSharedAudio`）；「Failed to play audio」误报＝第二实例 play() 打断第一实例的 AbortError 被当错误 → AbortError 静默；另修：无曲目卸载时单例残响 → `stopSharedAudio` + 状态复位；进度写库 5s 节流；selector 加 useShallow
4. ✅ esc 优先级：沉浸页开启时 AppLayout esc 收回条，四个视图（ArticleView/Setting/Subscriptions/FeedsBrowse）esc handler gate；bar 态才给内容区留 90px 底距
5. ✅ 验证：浏览器实测真实音频播放（进度推进、无 toast）、bar/full 截图核对、布局度量（传输簇/右簇坐标）；167 测试 + build + tsc + Rome 全绿
6. 遗留：用户库暂无真实播客源（articles 无 audio enclosure）——测试用种子已清理；PlayListPopover/PlayList 不再被 bar 引用（队列在沉浸页），待 P2 死码清理

**P2 — 清理与对齐**
4. 删设置死目录：`layout/Setting/{General,ImportAndExport,Proxy,ShortCut,Subscribe}`（确认无引用后）；`Content/` 仅 dialogs 被 Subscriptions 引用，余下（DataTable 等）删
5. 通知控件对齐：mock 把 enabled+level 捏成单一分段（关闭/仅高信号），实现需映射回 `userConfig.notification_enabled` + `notification_level` 两字段
6. 星标/历史导航项＝列表变体（已读行/星标行）：mock 侧已有 `fusion.html?view=starred|history` 演示；实现侧确认 ArticleView 过滤即可，无新面

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
| 知乎/微博的 RSSHub 真实路由 | AddFeed brief | mock 用 `rsshub.app/{kind}/…` 占位 |
| Kill the Newsletter 实例（自建/公共） | AddFeed brief | 实现时定 |
| 全部设计稿零眼审 | 设置 brief | 机械验证全绿，人未过目——落地前应人工走查一遍 8 份 mock |
| 焦点行禁 hover 洗色的边界情况 | DESIGN.md | 详情内 j/k 连续移动时确认无闪烁 |

## 7. 面内策略（surface briefs）

`apps/desktop/.impeccable/surfaces/`：`setting-index-tsx.md`（设置+订阅管理）、`addfeed.md`（渐进面板）。改方向先改 brief。

---

*生成于设计定稿轮（8 mock + fusion.css 第二刀落地中）。mock 是规格，DESIGN.md 是语法，这份是地图——三者不一致时，改到一致为止。*
