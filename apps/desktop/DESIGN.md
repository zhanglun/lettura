# Design — Lettura 0.2.0「静密 × 聚光」

> 从已构建的参考实现记录（ground truth over intention）。
> 参考实现：`.impeccable/mocks/decision/`——**index.html（总入口：9 面目录+动线，mock 间已互链）**、fusion.html（列表/详情/⌘K，j/k · Enter · esc · m · f · space · ⌘K，`?view=starred|history` 列表变体）、detail.html（阅读面）、feeds.html（订阅浏览/源队列）、settings.html（设置+订阅）、add.html（添加订阅）、empty.html（空状态）、help.html（帮助）、dark.html（夜读本）、podcast.html（播放器三态：`?state=bar|full|min`，面板态 `&panel=playlist|sleep` 直达）

## 世界一句话

界面是一台睡在玻璃上的精密仪器——排版做层级，键盘做导航，命令面板做入口；内容即界面，读完就走。

## 色板（Restrained：中性 + 单强调）

| 令牌 | 值 | 用途 |
|---|---|---|
| `--ground` | `#F4F4F1` | 画布 |
| `--glass` | `rgba(255,255,255,.78)` + `backdrop-filter: blur(22px) saturate(1.5)` | 主面板 / 播放卡 / 命令面板 |
| 浮层面板 | `rgba(255,255,255,.94)` + `blur(28px) saturate(1.6)` · radius 14 · 投影 `0 4px 10px .06` + `0 36px 80px -16px .4` | ⌘K / 添加 / 帮助 / 播放列表 / 睡眠菜单——**全套浮层共用一套材质**，不出现新容器类型（夜读本 `rgba(30,30,34,.92)` + 黑基投影） |
| 环境光 | **随主题呼吸（2026-11）**：左上＝`color-mix(background-orange 14%)` 主题暖调（neutral 桃/matcha 焦糖/y2k 杏/chocolate 焦糖），右上＝`accent 5.5%`；两光极淡，切主题即变调 | 画布氛围 |
| `--ink` / `--sub` / `--ter` | `#1D1E20` / `#6A6C6E` / `#9EA0A2` | 文字三级 |
| `--hair` / `--hair2` | `rgba(29,30,32,.08)` / `.13` | 发丝线 / 边框 |
| fusion 中性阶 | **全部接 Astryx 主题令牌**（2026-10 契约）：ground=`background-body`、glass=`card 80% 混`、ink/sub=`text-primary/secondary`、ter=48% 混、hair=`border`、warn=`error`；行/悬停/浮层的中性 rgba 一律 `color-mix` 令牌派生——切主题即整面变色；pink/amber/serif-ink 为固定状态色（夜读暖墨除外） |
| **fusion×Astryx 分工（2026-11 演进原则）** | Astryx 供「组件词汇」（控件、行节奏、洗色、材质令牌），fusion 供「产品个性」（环境光氛围、宋体正文、精密密度、键盘焦点环、未读圆点）。**融合不是抹平**：凡 Astryx 已定义的控件/行语言一律退让用 Astryx；凡产品级签名（氛围光、宋体、信息密度、键盘模型）保留并加强。行间隔＝Astryx 呼吸缝 2px（ground 透出），非 fusion 发丝线 |
| **WebKit 右键菜单规避（2026-11）** | WebKit 对「`position-anchor` 指向 `overflow` 滚动容器内锚点」的 top-layer popover 会算出正确几何却不绘制（Astryx context 菜单在此情形下不可见）。FeedCtxMenu 包一层 `.fusion-ctx-host` 捕获右键视口坐标，CSS 将 popover 从 anchor 切换为 `position:fixed`（坐标按实际内容高度与视口边缘 8px 收敛；内层不设内部滚动条）。菜单打开＝目标行整行 10% accent 高亮、背景滚动锁定；Esc 不穿透为返回导航。点击/SVG/键盘不受影响 |
| 列表行词汇 | **对齐 Astryx（2026-10）**：三个列表面（文章行/订阅浏览行/订阅管理行）＝圆角 8px 内衬洗色（inset 3px 6-8px，同菜单项）、**行间 2px ground 呼吸缝**（步距＝内容高＋缝：52+2 / 44+2 / 42+2）、无发丝线（分组头保留规则线）、选中/聚焦＝半透明 accent 调；悬停＝4% 墨洗 |
| `--color-accent` | **Astryx 主题 accent，直接消费、无任何 fusion 间接层**（2026-10 契约）：主题即调色板身份，五色板已删；gothic 为永久深色主题，选中即强制深色 | 唯一强调色：焦点线、圆点、播放、选中、正文链接 |
| `--color-accent-muted` | Astryx 自带 accent 淡底令牌（各主题自带设计值） | 选中底、淡色洗 |
| `--pink` | `#E86A92` | 仅 B站徽章 |
| `--warn` | `#C4564A` | 同步失败 |
| `--amber` | `#E5A50A` | 仅星标 |

## 字体

- UI：`-apple-system, "SF Pro Text", "PingFang SC"`，中文 `letter-spacing: .005–.01em`
- 文章正文：`"Songti SC", "STSong", "Noto Serif SC"`，15.5px / 行高 2.0（外壳精密，内容读书）
- 数字一律 `font-variant-numeric: tabular-nums`；时间码用 `SF Mono`
- 字阶：26（页题）/ 24（详情题）/ 21 / 14.5 / 13.5（行题）/ 13 / 12.5 / 12 / 11.5 / 11 / 10.5（kbd、足注）

## 布局骨架

```
画布（ground + 双色 ambient）
└─ 玻璃主面板  inset:22px · radius 16 · 内高光 1px（铺到窗口下缘）
   ├─ 顶栏 54px：logo 点 + 产品名「Lettura」+ 计数药丸（全局未读常驻；订阅浏览帧显示源数） + 导航(未读/星标/历史/订阅) + ⌘K 搜索钮——当前位置由导航高亮表达，顶栏不放视图名
   ├─ 过滤条 42px：全部/文章/播客/视频（+邮件，仅在真有邮件内容时出现）——**按载体分档**；全部与各档计数均为**服务端同条件真实总数**（`/api/articles/carrier-counts`，不随分页截断） + 右侧同步元信息 + 同步/全部已读图标钮
   ├─ 视图区（列表 ⇄ 详情 ⇄ 设置，面板内替换，位置保留）——**滚动内容末尾留 102px 让位空白**（`--fusion-player-inset`：条 68 + 底距 22 + 呼吸 12），最后一行能完全翻到条外；空白加在**内容末尾**（`.fusion-inset-tail::after`），不在外层容器占位——列表从条下穿过（悬浮，非占位）
   └─ 悬浮玻璃播放卡  绝对定位 left/right 22 · bottom:22 · h68 · radius 14（仅 bar 态；min 圆钮/full 沉浸层不占位）
└─ ⌘K 命令面板  580px · top 84 · 浮层 + 压暗 veil
```

## 组件与状态

**列表行**（54px，发丝线分隔，grid：状态点 / 56×34 缩略图 / 徽章 / 题 / 源(带 14px 源图标) / 时间 / 动作）：

- 缩略图：内容 banner/预览图 `object-fit:cover`；无图落类型预设（播客 `--color-accent-muted`、平台 `--pink-soft`、文章灰底 + 字符）
- 源列：feed 图标（14px，`feed_logo`）+ 源名；时间列 `nowrap` 不换行
- 行尾动作常显（`.62` 透明度），行 hover 全显——星标（琥珀）+ 已读

| 状态 | 记号 |
|---|---|
| 未读 | 6px 靛蓝圆点 |
| 已读 | 圆点转灰，题转灰 400 |
| 键盘焦点 | 9% accent 洗底 + 圆点 3px 光环 + **0.5px 发丝左线**（accent 45% mix，发丝级位置提示，非彩色粗侧线）——让 j/k 当前位在长列表可定位 |
| 播放中 | 源列「播放中」靛蓝字 |
| 星标 | 行尾琥珀星 |
| 同步失败 | 源列 `#C4564A` + 重试 |

**媒体两轴**（2026-09-25 起：**入库时判定一次，读路径零推导**；取代旧「文章/播客/平台」三桶）：

| 轴 | 列 | 取值 | 谁定 |
|---|---|---|---|
| **载体**（怎么消费） | `articles.carrier`（有索引）；源级提示 `feeds.carrier` | `text` / `audio` / `video` / `email` | Rust 入库时 `cmd.rs`：`classify_entry`（audio enclosure → audio；否则用来源声明的载体）＋ `feed_carrier_hint` |
| **来源**（从哪来） | `feeds.origin` | `native` / `generator:<route>` | 订阅时 `resolve_origin`（客户端已知的生成器路由优先，否则 native） |

语义由两轴**推导**，不再有逐个平台的特例：`canPlayInApp = carrier==="audio"`（进站内播放器）· `opensExternally = carrier==="video"`（0.2.0 不做站内视频 → 外跳）· `text/email` → 阅读面。新增平台/新载体只改数据，不改分支。

迁移：`2026-09-25-000000_add_article_kind`（落库）→ `2026-09-25-010000_carrier_origin`（重标签为两轴 + `feeds.carrier`；与旧判定逐行对账 0 差异）。筛选/计数＝可索引等值查询；列表接口直接回 `carrier`/`origin`/`feed_carrier`；前端只做「两轴 → 徽章/平台名」映射（`helpers/mediaType.ts`）。

**媒体徽章**（20px，radius 6，10px 粗字）＝**载体定字形 ＋ 品牌字优先**：文＝中性灰 · 播＝靛（audio）· 邮＝靛（email）· 视＝粉（video，未知路由）· **B**＝粉（`generator:bilibili`）· **抖**＝深灰（`generator:douyin`）。品牌字只在视频载体上生效（文本载体的 B站源不会借用品牌字）。

**详情视图**（类型感知，同一外壳；阅读面定稿 `.impeccable/mocks/decision/detail.html`）：

| 类型 | 内容 |
|---|---|
| 文章 | ≤640px 单栏，宋体正文（排版要素见下） |
| 播客单集 | 112px 封面 + 大播放控件 + 章节（时间码）+ show notes |
| 平台（B站/抖音） | 封面块 + feed 简介 + 黑色「在平台打开」外跳钮（0.2.0 不做站内视频） |

**阅读面排版要素**（文章详情，`--read-size`/`--read-lh` 由设置校准台写入）：

| 要素 | 语法 |
|---|---|
| 阅读进度 | 顶栏下缘 1.5px 靓蓝发丝线，随滚动无声走完，唯一的仪表读数 |
| 引文 | 1px 发丝左线 + 宋体 + `--sub`，字号减 1px |
| 行内码 / 代码块 | 行内：mono + `.05` 底 + hair 边；块：白玻璃 + hair 边 + SF Mono 12.5 + 右上语言标 |
| 链接 | `--color-accent` 下划线，offset 3px，装饰线同源 35% mix |
| 完读 | 「· 完 ·」发丝线分隔 → 下一篇卡（列表行语法，j/k 直达）+ 「已读并返回 m」幽灵钮 |

**命令面板**：输入即时过滤（文章 / 来源 / 命令混合），首项选中（`--color-accent-muted` 底 + 1px 内线），kbd 提示，底部快捷键栏；「打开设置」命令进设置视图。

**播放器三态**（`.impeccable/mocks/decision/podcast.html`，`?state=bar|full|min` 直达）：播客是仪器上唯一的时间媒体，三种形态同一材质同一 accent，收起永不失联。

| 形态 | 语法 |
|---|---|
| 条 bar（默认） | 底部 68px 玻璃卡（绝对定位 left/right 22 · bottom 22）：左传输簇（32px accent 播放钮 + ±30s 紧凑 2px 簇距）· 单集信息 240px（点击放大）· 弹性时间轴（时间码 mono + 3px 轨 + 白环旋钮）· 右簇（倍速 chip + 睡眠定时 + 播放列表 + 放大 ↑ + 收起 ↓）；**条浮在内容之上——列表从条下穿过，不给条留容器占位，只在滚动内容末尾留 102px 让位空白** |
| 沉浸页 full | 盖满面板的玻璃浮层（inset 22 · blur 28 · z40）：顶栏（收起 esc + 源名·题）→ 版心 560px 居中：168px 大封面（accent-soft 预设/实图）→「正在播放」章节字 → 21px 题 → meta（源·时长·已播%）→ 大时间轴（4px 轨 + 12px 旋钮）→ 传输行（−30s / 48px 大播放 / +30s / 倍速 / 睡眠定时）→ UP NEXT 队列（发丝行 52px，当前行 accent-soft 洗色 + 播放中，悬停删除钮）→ 足注（space/esc） |
| 睡眠定时 | 月亮钮/chip（两态共用）：静默态＝发丝圆钮，拉出菜单浮层（⌘K 浮层语法：`.94` 白 + 模糊，关闭 / 15 / 30 / 60 分钟，当前项 accent 字重）；激活态＝accent-soft 洗色 chip，走剩余 `mm:ss`（每秒递减），到点自动暂停并清空定时；重设或关闭作废旧定时 |
| 播放列表 | 底条列表钮拉出 380px 浮层（面板语法同 ⌘K，自下缘 grow 200ms 缓出）：头行「播放列表 + N 集」+ 发丝行 52px 整队（题/源叠两行、时长右对齐、悬停删除钮）；当前行＝accent-soft 洗色 + 「播放中」；点行即切（点当前集 = 播放/暂停）；未入队时走引导态。队列入口＝列表钮（整队）+ 沉浸页 UP NEXT（除当前集） |
| 三态动效 | bar ⇄ full ⇄ min 互切：150–200ms 缓出、位移 ≤10px（条/沉浸页自下缘长起，圆钮自右下弹入），退出帧由 AnimatePresence 保留；无回弹、无交叉位移 |
| 收起 min | 右下 40px 圆形玻璃钮：SVG 环形进度 + 26px accent 播放芯；hover 显影「源 · 题」气泡；点击回条。音频不停（useAudioPlayer 挂壳层顶层 + 模块级单例 audio，三态切换零卸载） |

键盘：`space` 全局播放/暂停（任何形态）；`esc` 逐级退回——浮层（睡眠菜单 / 播放列表 / ⌘K / 帮助）先关，裸按才把沉浸页收回到条（优先于一切视图 esc）；收起后入口 = 右下圆钮（永在）。

播放状态是库里的持久事实（Dexie `podcasts`）：`progress` 续播（5s 节流落盘，播完归零）、`duration` 首播回填（队列行时长靠它）；队列索引由 `currentTrack` 推导（点击/删除/播完都同步），删除当前集由接替者顶上。音频实现：模块级单例 `Audio`（多消费者共享，杜绝多实例同播与 AbortError 误报）；系统媒体键与锁屏控件走 MediaSession（play/pause、±30s、上一集/下一集），平台不支持时整段跳过。

**设置视图**（面板内第三态，参考实现 `.impeccable/mocks/decision/settings.html`）：

顶栏保持产品名「Lettura」（不放视图名）；设置视图头部与详情同构（返回钮 + esc + 右侧「N 个来源 · M 个分组」类元信息）；队列计数药丸持续在场。入口：⌘K「打开设置」；导航点「未读」或 esc 一路退回（设置 → 未读 / 订阅 → 设置），列表位置保留。段题单语（中文），不带英文大写后缀。

布局：左锄点导航 196px（玻璃底 + 发丝线右分）+ 内容区（版心 720px 居中）。导航项 38px，当前段＝Astryx accent 选中语法（10% accent 底 + accent 字重 + 细边框，无侧线）；点击平滑滚动到段题，滚动侦测反向点亮（末段在触底时兜底选中）；「订阅管理」为导航出口项（尾部箭头，进订阅子视图）。

| 语法 | 规则 |
|---|---|
| 版心 | 居中 720px；段题＝10px/700/.13em 大写 accent 标题，下接 accent 18% 发丝规则线，scroll-margin 顶留白 |
| 设置行 | 独立仪器卡：标签左（13.5px/500 + 帮助文字 11.5px/`--sub`）、控件右、细边框 + 42% card 玻璃底，min-h 58，无行 hover；控件自身遵循 Astryx hover/focus |
| 控件词汇 | 分段＝过滤条 tab 语法（胶囊容器，自研 Seg）；下拉＝Astryx `Selector`(sm)；开关＝Astryx `Switch`(sm)；滑杆＝Astryx `Slider`（固定 140 宽）+ 数值 chip；文本＝Astryx `TextInput`/`TextArea`(sm)；主钮＝Astryx `Button` primary(sm)、幽灵钮＝`ghost`(sm)；键帽＝Astryx `Kbd`（esc/m/⌘K，平台感知）；组件主题＝Astryx 主题选择器（neutral 默认，7 选 1，`userConfig.astryx_theme` 持久化，CSS 由 `@scope([data-astryx-theme])` 隔离） |
| 校准台 | 外观段尾预览块：列表行样本 + 宋体段落，实时反映字号/行高/密度/强调色；拖动即显影，无过渡 |
| 订阅行 | 列表行 42px：类型徽章/题/未读药丸/域名/时间；分组头部 32px 可折叠。管理页不做整行 hover，只在悬停时显隐操作钮；右键菜单＝Astryx `ContextMenu`（sm、声明式包裹行，移动分组为悬停子菜单），退订钮常态 ghost、destructive 只出现在菜单/确认语义中 |
| 生成器行 | 「RSSHub 实例」＝Astryx `TextInput`(sm)；「自定义生成路由」＝Astryx `TextArea`(sm)，mono 内容（一行一条 `匹配 => 路由`）。文本类设置**失焦提交**（其余控件即改即写，逐字符写 TOML 太重） |

状态反馈即时生效（无保存钮），写入本地配置；同步失败在健康行与订阅行以 `--warn` 呈现并附重试。

**添加订阅（渐进式面板，参考实现 `.impeccable/mocks/decision/add.html`；2026-09-25 重梳理）**：⌘K 同位同材质的 640px 浮层。一个输入框粘贴**任何**地址——顺序是**发现优先**：后端先直接解析，失败则当网页处理（读 `<link rel="alternate">` 声明的 feed、再试 `/feed` `/rss` `/atom.xml` `/index.xml` `/feed.xml` `/rss.xml`），把命中的地址作为**生效地址**；发现不了才退回平台生成器。输入框内显影类型徽章（RSS / 播 / 视）；探测中是行内 spinner，失败是行内 `--warn` + 重试（永不用弹窗）。

预览卡（唯一动效：grow 220ms 缓出）：源信息 + **最近条目**（列表行收紧至 34px，订阅前就能看到会得到什么）+ 多个候选时列出 chips 让用户换 + **生效地址**（平台源显示路由与所用实例）+ 分组下拉（含「新建分组…」）+ 订阅钮（`--accent` 底）。⏎ 订阅 / esc 关闭。

**不写死平台清单**（用户输入不可控）：内置表只是"便利匹配"（B站/知乎/微博/YouTube/Newsletter）；用户可在设置里加自定义路由（`匹配 => 路由`，右侧以 http 开头即直接当 feed 地址）；发现失败时面板里还能**手填路由**现生成现预览。生成器用的实例是设置项。

**完成即走**：订阅成功后 toast 报「已订阅「X」· 已同步 N 篇」，面板关闭并**跳转到该订阅的源队列**（`/local/feeds/:uuid?feedUuid=…`，默认未读过滤）——不停在面板上，也没有"再加一个"循环（用户 2026-09-25 决策）。

**空状态（即引导，参考实现 `.impeccable/mocks/decision/empty.html`）**：零订阅时列表位置直接换成引导面：墨色方标 → 26px 主张「订阅你想读的」→ 副文 → [添加订阅][导入 OPML] → 520px starter pack 卡（勾选即点亮「订阅 N 源」，无庆祝动画）。零未读是安静的收尾：「今天的队列清空了」+ 历史/星标/添加出口，读完就走。无独立 onboarding 路由。

**帮助浮层（? 键，`.impeccable/mocks/decision/help.html`）**：⌘K 姊妹浮层，720px 双列分组键位卡：键右对齐（104px 键位列）+ 描述左，行 33px 发丝线，组题用章节字；veil 点击或 esc 关闭。

**订阅浏览（导航「订阅」，`.impeccable/mocks/decision/feeds.html`）**：管理与浏览分工——设置里管订阅，这里读订阅。两帧：

| 帧 | 语法 |
|---|---|
| 浏览 | 分组源列表：订阅行放宽至 46px（徽章/题/域名/未读数/时间），未读数右对齐靓蓝加粗（零未读转灰且退出键盘队列）；组头 32px 可折叠 + 组未读小计；失败态 `--warn` |
| 源队列 | fusion 列表语法源限定变体：返回行（‹订阅 esc + 右侧 N 未读）→ **源头卡 FeedProfile（可收起，2026-11 新增）** → 过滤条（未读/全部）→ 54px 列表行，焦点/星标/已读语法全部继承 |

**源头卡 FeedProfile**（`components/FeedProfile`，浅色半透白卡 14px radius + 发丝边；深色 `rgba(233,233,230,.035)`）：

- 展开态：40px 源图标 + 16px 源名 + 标签行（RSS 域名 / 载体或「经 Route」/ 分组 / 订阅时间）→ 源简介（2 行截断 + 展开/收起）→ 统计条（文章总数 / 未读 accent / 最近同步 / 健康，发丝格分隔）→ 动作行（打开主页 · 复制 Feed 地址 · 立即同步 · 全部已读 · 管理）；同步失败时健康转 `--warn` 并显示 `failure_reason`
- 收起态：44px 单行（图标 + 源名 + 域名 + 健康药丸 + N 未读 + 展开钮），收起源信息的折叠状态会话级记住（模块变量，浏览多个源不反复收起）
- 描述读纯文本（不渲染远程 HTML）；复制/外跳复用 `copyText` + `plugin-shell`

浏览帧源行列宽微调：`22px 1fr minmax(150px,210px) 56px 108px`——host 列并入「经 Route」来源提示，时间列加宽并加 ellipsis（英文「about 17 hours ago」不再与未读数黏连）。

键盘：浏览帧 j/k 跳过零未读源、⏎ 进队列、esc 回未读列表；队列帧即列表语法（⏎ 进阅读面、m/f 同全局）。星标/历史导航项＝列表变体（已读行/星标行），由列表语法覆盖，无独立稿。

## 键盘模型

```
j / k / ↑↓   移动焦点（详情内 = 下一篇/上一篇）
Enter / o    打开焦点行
Esc          返回列表 / 关闭面板（设置内逐级返回：订阅→设置→列表，位置保留）
m            已读并下移        M   已读并上移
f            星标              v   浏览器打开原文
space        全局播放/暂停     R   刷新全部来源
⌘K 或 /      命令面板（含「打开设置」）    ?   快捷键帮助
```

## 动效

- 行 hover：`rgba(29,30,32,.035)`，无位移
- 圆钮 hover：`scale(1.05–1.06)`，150ms ease
- 播放卡/软卡类：translateY(-1px) + 阴影抬升，150–160ms ease
- 禁止：入场动画全家桶、渐变文字、零模糊色块阴影、彩色粗边框、**彩色竖侧线**（`border-left/right` >1px 或 inset 侧影做状态记号——状态用洗色 + 字重 + 圆点光环表达）

## 范围约束（0.2.0）

- 视频平台内容：徽章 + feed 简介 + 外跳，**不做站内播放**
- 深色「夜读本」已定稿（`.impeccable/mocks/decision/dark.html`，见下方令牌表）；颜色永不作唯一信号；切换机制：`userConfig.color_scheme` 单源派生 `body.dark-theme` 与 Astryx `data-theme`（App 内单一 effect 同步，设置页只写 store）
- AI 不进界面；无 API Key 零损失

## 夜读本令牌（深色，非反色）

同一台仪器在夜间的样子：暖黑画布（非蓝黑）、更深更透的玻璃、上缘冷内高光、昼间双色环境光弱化为月相残照。全部面（列表/详情/设置/订阅/添加/帮助/空状态）继承此令牌层，结构与组件语法不变。

| 令牌 | 夜读值 | 昼读值 |
|---|---|---|
| `--ground` | `#17171A`（暖黑） | `#F4F4F1` |
| `--glass` | `rgba(22,22,25,.72)` + blur 22 saturate 1.3 | `rgba(255,255,255,.78)` + saturate 1.5 |
| 内高光 | 上缘 `rgba(233,233,230,.09)`（冷） | 上缘白 `.7`（暖） |
| `--ink` / `--sub` / `--ter` | `#E9E9E6` / `#A2A4A8` / `#6B6D73` | `#1D1E20` / `#6A6C6E` / `#9EA0A2` |
| `--hair` / `--hair2` | `rgba(233,233,230,.08/.13)` | `rgba(29,30,32,.08/.13)` |
| `--accent` | `#848CE8`（提亮保对比） | `#5E6AD2` |
| `--paper` | `#26262B`（阅读面抬高的暗纸，仅详情正文区） | ——（昼读正文直落在玻璃上） |
| `--serif-ink` | `#D3D4D8`（宋体暗墨） | `#33363B` |
| `--warn` / `--amber` / `--pink` | `#D97B6F` / `#EDB433` / `#EE8BAB`（均提亮） | `#C4564A` / `#E5A50A` / `#E86A92` |
| veil 压暗 | `rgba(0,0,0,.32)` | `rgba(29,30,32,.14)` |
| 阴影系 | 全部转黑基（`rgba(0,0,0,…)`） | 黑基不变 |
| 环境光 | 双色残照（约昼间 60% 弱） | 双色极淡 radial |

实测对比度（暗玻璃上）：ink 14.8 / sub 7.2 / accent 5.9 / warn 6.0；暗纸上宋体 10.2——全面优于昼读值。徽章与药丸的灰阶改用浅色投影（`rgba(233,233,230,…)`)。
