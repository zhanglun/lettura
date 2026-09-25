# Astryx 组件迁移清单

增量迁移跟踪表。地基已接入（`AstryxTheme(neutral)` + CSS 层序 + Vite 5），
本文件记录「当前实现 → Astryx」的对应关系与替换顺序。每替换一项即勾选。

## 一、Radix Themes → Astryx 原语映射

现有 `@radix-ui/themes` 用量（按出现次数），及 Astryx 对应组件。

| Radix（用量） | Astryx 对应 | 备注 / API 差异 |
|---|---|---|
| ~~`Button` (5)~~ ✅ | `Button` | Radix 用 children 放文案/图标；Astryx 用 `label` + `icon`，`variant` 为 primary/secondary/ghost/destructive，`size` sm/md/lg |
| ~~`IconButton` (3)~~ ✅ | `IconButton` | Astryx 独立组件（非 Button 的 iconOnly 态）；图标钮仍须提供无障碍 label；tooltip 内置 |
| `Dialog` (3) | `Dialog` | Radix 用 `Dialog.Root/Content/Title` 复合式；Astryx 看具体 props（多为 `open/onOpenChange/title`） |
| `AlertDialog` (2) | `AlertDialog` | 破坏性确认；destructive 动作需确认步骤 |
| `Tooltip` (2) | `Tooltip` | Astryx Button 自带 `tooltip` prop；独立场景用 Tooltip |
| `Popover` (1) | `Popover` | |
| `DropdownMenu` (1) | `DropdownMenu` | 右键菜单另有 `ContextMenu`（FeedCtxMenu 可评估） |
| `TextField` (1) | `TextInput`（+ `InputGroup`/`Field`） | 表单场景优先 `Field` 包 label/校验 |
| `RadioGroup` (1) | `RadioList` | 语义对应 |
| `Separator` (1) | `Divider` | |
| `Skeleton` (1) | `Skeleton` | |
| `Heading` (1) | `Heading` | |
| `Text` (2) | `Text` | |
| `Link` (2) | `Button href` 或 `Text` 内嵌链接 | Astryx 无独立 Link 原语；导航用 `Button href` |
| `Flex` (2) | `HStack` / `VStack`（通用 `Stack`） | 禁止 div 布局，方向用语义 Stack |
| `Blockquote` (1) | `Blockquote` | |
| `Quote` (1) | 行内引用，见 `Citation`/`Text` | ContentRender 中映射 |
| `Theme` (8) | 全局 `AstryxTheme` 已在 App.tsx | 各嵌套 Theme 多为局部 appearance，迁移时删除（mode 由全局控制） |

## 二、自研组件/页面 → Astryx 组装

| 现有面（路径） | 可复用的 Astryx 组件 / 模板 | 替换思路 |
|---|---|---|
| About 弹窗 `components/About` | `Button` | **已完成** 两个按钮替换，Dialog 待换 |
| 命令面板 `components/layout/CommandPalette.tsx`（cmdk） | `CommandPalette` / `Typeahead` / `PowerSearch` | Astryx 有原生命令面板，可替换 cmdk 实现 |
| 添加订阅 `components/AddFeed` | `TextInput`+`Field`+`Button`+`Card`+`Badge`；模板见 `.impeccable` | 表单重写；探测/候选用 List 类 |
| 添加分组 `components/AddFolder` | `Dialog`+`Field`+`TextInput` | 小弹窗 |
| Feed 右键菜单 `components/FeedCtxMenu` | `ContextMenu` | 统一右键交互 |
| FeedProfile 源头卡 `components/FeedProfile` | `Card`+`HStack/VStack`+`Badge`+`Button`+`StatusDot`+`IconButton` | 卡片化重写，健康用 StatusDot |
| 订阅管理页 `layout/Feeds` | `Table` 或列表 + `Button`/`IconButton`+`ContextMenu`+`Timestamp`+`Badge` | 行布局可用 Table 规范化 |
| 文章列表 `components/ArticleListVirtual`、`ArticleItem` | 列表项 + `CheckboxInput`+`Badge`+`Timestamp`+`IconButton` | 虚拟滚动保留自研，行内控件替换 |
| 文章视图/正文 `components/ArticleView`（ContentRender/DialogView/ReadingOptions） | `Heading`/`Text`/`Blockquote`/`Code`/`CodeBlock`/`Divider`；正文容器 token | ContentRender 标签映射逐项换；阅读样式用 token |
| 设置页 `layout/Setting` | `FormLayout`+`Field`+`Switch`+`RadioList`/`Selector`+`Button` | 表单体系重写 |
| 播客 `components/LPodcast`（FullPlayer 等） | `Button`/`IconButton`+`Slider`+`ProgressBar`+`Thumbnail`+`Badge` | Framer Motion 保留，控件替换；IndexedDB 不动 |
| 顶栏/侧栏 `components/layout`（AppLayout 等） | `AppShell`+`TopNav`+`SideNav`+`NavMenu`+`NavIcon` | 外壳规范化 |
| Toast（sonner，11 处） | `Toast` | 可统一替换；先保留，后期收口 |

## 三、建议替换顺序（由低风险到整面）

1. **原语批次**：~~Button~~ → ~~IconButton~~ → Tooltip → Divider → Text/Heading
2. **浮层批次**：About 完整 Dialog → AddFolder → AlertDialog → DropdownMenu/ContextMenu → Popover
3. **表单批次**：Field/TextInput/TextArea → RadioList/Selector/Switch → 设置页 → AddFeed
4. **外壳批次**：AppShell/TopNav/SideNav 重排导航；命令面板换 Astryx CommandPalette
5. **内容批次**：订阅管理页 → FeedProfile 卡片化 → 文章列表行控件 → ContentRender 正文映射
6. **收口**：播客控件、Toast 统一替换 sonner，删除 Radix Themes 与冗余自定义 CSS

每批次完成标准：tsc 0 错、215 测试（按需更新）全绿、生产构建通过、关键态视觉确认；
同步更新 `DESIGN.md` 与本文件勾选。

## 进度

- [x] 地基：AstryxTheme + CSS 层序 + Vite 5
- [x] Button（About + ErrorBoundary/AddFolder/DeleteFolder/Unsubscribe 全部）
- [x] IconButton（DialogView/View/ReadingOptions）
- [ ] About Dialog 容器
- [ ] 其余按上表推进
