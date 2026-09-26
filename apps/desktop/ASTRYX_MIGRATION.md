# Astryx 组件迁移清单

增量迁移跟踪表。地基已接入（`AstryxTheme(neutral)` + CSS 层序 + Vite 5），
本文件记录「当前实现 → Astryx」的对应关系与替换顺序。每替换一项即勾选。

## 一、Radix Themes → Astryx 原语映射

现有 `@radix-ui/themes` 用量（按出现次数），及 Astryx 对应组件。

| Radix（用量） | Astryx 对应 | 备注 / API 差异 |
|---|---|---|
| ~~`Button` (5)~~ ✅ | `Button` | Radix 用 children 放文案/图标；Astryx 用 `label` + `icon`，`variant` 为 primary/secondary/ghost/destructive，`size` sm/md/lg |
| ~~`IconButton` (3)~~ ✅ | `IconButton` | Astryx 独立组件（非 Button 的 iconOnly 态）；图标钮仍须提供无障碍 label；tooltip 内置 |
| ~~`Dialog` (3)~~ ✅ | `Dialog` | Astryx 用 `isOpen/onOpenChange`；标题用 `DialogHeader`，宽/padding 用 props |
| ~~`AlertDialog` (2)~~ ✅ | `AlertDialog` | 简单破坏性确认直接用 AlertDialog；带自定义选项（退订保留/删除文章）用普通 Dialog + RadioList |
| ~~`Tooltip` (2)~~ ✅ | `Tooltip` | content + placement；按钮优先用内置 `tooltip` prop |
| ~~`Popover` (1)~~ ✅ | `Popover` | children 放触发钮，`content` 放面板 |
| ~~`DropdownMenu` (1)~~ ✅ | `DropdownMenu` | 数据驱动 `items`；无 radio 项，选中态用前置 check 图标 |
| ~~`TextField` (1)~~ ✅ | `TextInput` | label 必填（隐藏用 `isLabelHidden`）；onChange 收 value |
| ~~`RadioGroup` (1)~~ ✅ | `RadioList` | 项用 `RadioListItem` 的 `label`/`value`（非 children） |
| ~~`Separator` (1)~~ ✅ | `Divider` | `orientation='vertical'`，尺寸用 style |
| ~~`Skeleton` (1)~~ ✅ | `Skeleton` | 宽高用 `width`/`height` props |
| ~~`Heading`~~ ✅（ContentRender） | 原生语义标签 | 正文标题用原生 h1-h3（fusion CSS 契约） |
| ~~`Text` (2)~~ ✅ | `Text` | `type`/`size`/`color`；label 用原生 label |
| `Link` (2) | `Button href` 或 `Text` 内嵌链接 | Astryx 无独立 Link 原语；导航用 `Button href` |
| `Flex` (2) | `HStack` / `VStack`（通用 `Stack`） | 禁止 div 布局，方向用语义 Stack |
| ~~`Blockquote`~~ ✅（ContentRender） | 原生 blockquote | fusion CSS 针对原生标签排版 |
| ~~`Quote`~~ ✅（ContentRender） | 原生 q | 同上 |
| `Theme` (8) | 全局 `AstryxTheme` 已在 App.tsx | 各嵌套 Theme 多为局部 appearance，迁移时删除（mode 由全局控制） |

## 二、自研组件/页面 → Astryx 组装

| 现有面（路径） | 可复用的 Astryx 组件 / 模板 | 替换思路 |
|---|---|---|
| About 弹窗 `components/About` | `Button` | **已完成** 两个按钮替换，Dialog 待换 |
| 命令面板 `components/layout/CommandPalette.tsx` | **已换 Astryx `CommandPalette`**，cmdk 已移除 | 自定义异步 SearchSource（命令/来源本地 + 文章后端），auxiliaryData.group 自动分组 |
| 添加订阅 `components/AddFeed` | 自研浮动面板（非 Radix）；待内容批次 | 主输入行与 badge/kbd/foot 网格强耦合，不单独换控件 |
| 添加分组 `components/AddFolder` | `Dialog`+`Field`+`TextInput` | 小弹窗 |
| Feed 右键菜单 `components/FeedCtxMenu` | `ContextMenu` | 统一右键交互 |
| FeedProfile 源头卡 `components/FeedProfile` | `Card`+`HStack/VStack`+`Badge`+`Button`+`StatusDot`+`IconButton` | 卡片化重写，健康用 StatusDot |
| 订阅管理页 `layout/Feeds` | `Table` 或列表 + `Button`/`IconButton`+`ContextMenu`+`Timestamp`+`Badge` | 行布局可用 Table 规范化 |
| 文章列表 `components/ArticleListVirtual`、`ArticleItem` | 列表项 + `CheckboxInput`+`Badge`+`Timestamp`+`IconButton` | 虚拟滚动保留自研，行内控件替换 |
| 文章视图/正文 `components/ArticleView`（ContentRender/DialogView/ReadingOptions） | `Heading`/`Text`/`Blockquote`/`Code`/`CodeBlock`/`Divider`；正文容器 token | ContentRender 标签映射逐项换；阅读样式用 token |
| 设置页 `layout/Setting` | **控件已换**：Switch/Selector/Slider/TextInput/TextArea（均 sm、label 隐藏） | 布局 SRow/Seg/色板保留；暗色 thumb 待 mode 打通 |
| 播客 `components/LPodcast`（FullPlayer 等） | `Button`/`IconButton`+`Slider`+`ProgressBar`+`Thumbnail`+`Badge` | Framer Motion 保留，控件替换；IndexedDB 不动 |
| 顶栏 `components/layout/AppLayout.tsx` | 保留自研 fusion 顶栏 | AppShell 强制侧栏/重排，与「玻璃面板+顶栏无侧栏」设计冲突，属重设计非迁移 |
| Toast（sonner，11 处） | `Toast` | 可统一替换；先保留，后期收口 |

## 三、建议替换顺序（由低风险到整面）

1. **原语批次**：~~Button~~ → ~~IconButton~~ → ~~Tooltip~~ → ~~Divider~~ → ~~Text/Heading~~ ✅ 完成
2. **浮层批次** ✅：About Dialog → AddFolder(Dialog+TextInput) → AlertDialog/退订 Dialog → DropdownMenu(SleepControl) → Popover(PlayList) → Skeleton。FeedCtxMenu 右键菜单待外壳/内容批次换 ContextMenu
3. **表单批次** ✅（设置页部分）：设置页原生控件全换 Astryx——`Switch`(2)、`Selector`(3)、`Slider`(3)、`TextInput`(RSSHub)、`TextArea`(路由)；布局/自研 Seg 保留。AddFeed 为自研浮动面板、无 Radix 原语，推迟到内容批次整面重梳
4. **外壳批次** ✅：命令面板换 Astryx CommandPalette（删 cmdk）；AppShell 不采用（会改变 fusion 视觉世界）
5. **内容批次** ✅：FeedCtxMenu → Astryx `ContextMenu`（声明式包裹、嵌套子菜单）；sonner → Astryx `Toast`（helpers/toast 命令式 + useToast）；删除失效 fusion-ctx CSS。FeedProfile/文章行/订阅行本就是自研 fusion、无 Radix；ContentRender 已在原语批次完成
6. **收口** ✅：删除 Radix Themes（App/ErrorPage 去壳、6 个测试去 Theme 包裹、index.css 去 styles.css 与背景覆盖）、删 `@radix-ui/react-icons`；夜读切换改为 `userConfig.color_scheme` 单源派生（body class 与 Astryx `data-theme` 单一 effect 同步，深色 Slider 可见性问题随之修复）；清理 tailwind 死配置（accordion/spin-slow/调试 log）。保留 `@radix-ui/colors`（fusion 令牌与 tailwind 调色仍消费其色阶变量）
7. **多主题与词汇收齐** ✅：设置页「组件主题」选择器（7 个 Astryx 主题，`userConfig.astryx_theme` 持久化，Rust 配置新增字段）；全部主题 theme.css 静态导入（`@scope` 隔离互不冲突），App 按配置换 `Theme` prop；全部 kbd 键帽 → Astryx `Kbd`（平台感知 ⌘）；标准 CTA（fusion-btn-ink/gh/ink-sm，11 处 6 文件）→ Astryx `Button` primary/ghost(sm)，死 CSS 删除。剩余原生 button 为 fusion 微控件（行内悬停动作/色板/Seg/播放器传输控制）——是视觉契约本身，不迁
8. **Radix 全退场 + 强调色直读** ✅：`@radix-ui/colors` 依赖删除；custom-theme.css（radix 色阶 + workbench/default/accent 调色板）整文件删除；tailwind 仅保留默认调色 + 边框映射；Rust `theme`/`accent_color` 字段与 `update_theme` 命令删除；tsx 中 radix 任意值 → fusion/Astryx 令牌。**fusion 的 `--fusion-accent` 间接层整体退役**：73 处消费者直读 `--color-accent`/`--color-accent-muted`（Astryx 方案）；gothic 为永久深色主题，App 选中即强制深色（替代手配色对）
9. **控件全面收编** ✅：此前以「fusion 视觉契约」保留的微控件批量换成 Astryx 直接对应物——Seg → `SegmentedControl`（sm）、ReaderControls → `ToggleButton`/`IconButton`、AddFeed 主输入/路由输入/建组输入/分组下拉 → `TextInput`/`Selector`、订阅搜索 → `TextInput`(startIcon)、行内悬停动作（fusion-qa/qa2/qa3/act-btn/q-x）→ `IconButton` ghost/destructive、返回行（fusion-back ×4）→ `Button` ghost+`Kbd`、播客传输（bigplay/pnav/skipbtn/pskip/pc/pctl/chip）→ `Button`/`IconButton`、FeedProfile 动作组 → `Button`/`IconButton`、平台外跳 CTA → `Button` primary、⌘K 顶栏钮 → `Button` ghost+`Kbd`、AddFeed 候选 chips → `ToggleButton`(sm, isPressed)；删除 21 个死 CSS 类约 60 块规则。保留原生：列表行/分组头（结构）、设置锚点导航（NavMenu 过重不匹配）、MiniPill 进度环（无环形进度对应物，描边已接 --color-accent）
10. **fusion 中性色全面接主题** ✅（列表页跟主题变的根因修复）：`--fusion-ground/ink/sub/ter/glass/hair/hair2/warn` 全部改读 Astryx 令牌（`--color-background-body/card`、`--color-text-primary/secondary`、`--color-border`、`--color-error`）；散落的 92 处硬编码灰 rgba（29,30,32 / 233,233,230 / 255,255,255 抬升 / 深色浮层 30,30,34）→ `color-mix(令牌)`；body.dark-theme 令牌覆盖块退役（light-dark() 驱动），仅保留 pink/amber/serif-ink 三个固定状态色。切主题 = 整面（玻璃、行、悬停洗色、药丸、浮层）随主题变色
11. **列表行词汇对齐 Astryx** ✅：文章行（fusion-row）悬停从全宽平铺改为圆角 8px 内衬 ::after 洗色；三列表面移除行间发丝分隔线（分组头规则线保留）；选中/聚焦行统一半透明 accent 调 9%（accent-muted 为实心，适合 chip 不适合行洗色）；j/k 聚焦改为交互后建立（首行不再默认选中洗色）；订阅浏览帧（/local/feeds）行与分组头接上 `FeedCtxMenu`（浏览帧退订回退跳转订阅管理页）
12. **fusion 演进：找回产品个性 + Astryx 呼吸缝** ✅：确立分工原则——Astryx 供组件词汇/行节奏/材质令牌（退让），fusion 供产品个性（环境光、宋体正文、精密密度、键盘焦点环、未读圆点，保留加强）；三列表行加 2px ground 呼吸缝（行高＝内容 52/44/42 ＋缝 2，步距不变、虚拟滚动与键盘步长兼容），悬停行完整分离为圆角芯片。修复「fusion 被削平、无间隔」
13. **产品签名随主题呼吸 + 发丝位置线** ✅：环境光左暖从固定 rgba 红改为 `color-mix(background-orange 14%)`（各主题暖色令牌：neutral 桃/matcha 焦糖/y2k 杏/chocolate 焦糖），右光跟 accent；j/k 焦点行（文章行＋浏览帧当前源）加 0.5px accent 45% 发丝左线作位置提示

每批次完成标准：tsc 0 错、215 测试（按需更新）全绿、生产构建通过、关键态视觉确认；
同步更新 `DESIGN.md` 与本文件勾选。

## 进度

- [x] 地基：AstryxTheme + CSS 层序 + Vite 5
- [x] Button（About + ErrorBoundary/AddFolder/DeleteFolder/Unsubscribe 全部）
- [x] IconButton（DialogView/View/ReadingOptions）
- [x] Tooltip / Divider / Text
- [x] ContentRender 回归原生语义标签 + 正文排版修复
- [ ] About Dialog 容器
- [ ] 其余按上表推进
