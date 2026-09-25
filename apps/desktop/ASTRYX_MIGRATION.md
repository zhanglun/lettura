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
5. **内容批次**：订阅管理页 → FeedProfile 卡片化 → 文章列表行控件 → ContentRender 正文映射
6. **收口**：播客控件、Toast 统一替换 sonner，删除 Radix Themes 与冗余自定义 CSS

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
