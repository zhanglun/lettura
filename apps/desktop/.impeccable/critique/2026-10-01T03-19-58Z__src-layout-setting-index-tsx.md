---
target: 设置面 src/layout/setting（含订阅管理）
total_score: 32
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-10-01T03-19-58Z
slug: src-layout-setting-index-tsx
---
Method: dual-agent (A: reviewer · B: worker) + 父会话浏览器补证（cli 无 chrome 工具，由 parent 以 chrome_execute_js 注入 impeccable detect.js 完成页面内扫描）

# 设置面评审 · Lettura 0.2.0「静密 × 聚光」（2026-10 重评）

target: src/layout/setting/（设置视图 + 订阅管理，5 文件 1938 行）
mode: Operate

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | 实时预览 + isLoading 态优秀；OPML 导入 0 结果完全静默（index.tsx:301–318）；账户失败裸显后端 status 串（index.tsx:776） |
| 2 | Match System / Real World | 3 | zh「深色为命名候「夜读本」」破句且过时；「分析元数据」是已移除 AI 层的残留；zh 导航「订阅规则」vs 块题「站点规则」名实不符 |
| 3 | User Control and Freedom | 3 | esc 链 + 失焦提交草稿 + 退订默认保留文章皆强；订阅行完全无法从键盘打开（Subscriptions/index.tsx:126） |
| 4 | Consistency and Standards | 3 | 两种胶囊方言：过滤条自研 .fusion-tab vs 设置 Astryx SegmentedControl；分组头 destructive hover 钮越出契约语义（Subscriptions/index.tsx:240） |
| 5 | Error Prevention | 3 | 破坏性路径全有确认；但文件夹删除对话框隐藏爆炸半径（Rust 级联删除成员 feed 与全部文章，folder.rs:54–80） |
| 6 | Recognition Rather Than Recall | 4 | scroll-spy 锚点导航 + 触底兜底、逐行 11.5px 帮助文、实时校准台——真正出色 |
| 7 | Flexibility and Efficiency | 3 | ⌘K 入口、?tab= 深链、esc；但 feed 行无键盘路径，常用操作无连发加速器 |
| 8 | Aesthetic and Minimalist | 3 | 仪器卡忠实；一个失灵控件 + 无上界的内联订阅块添噪增页长 |
| 9 | Error Recovery | 3 | 具体 toast（导入 N 源/规则键/移动 feed）；坏源 --fusion-warn + 重试；后端 status 串未本地化泄漏 |
| 10 | Help and Documentation | 4 | 每行上下文帮助；SESSDATA 分步指引；opml_help 讲清所有权后果 |
| **Total** | | **32/40** | **Good（对照 2026-09-23 旧快照 19/36=52.8%，本次 80%）** |

## Design Specificity Verdict

**高保真，四处具名偏离。** 外壳几乎是 DESIGN.md 设置契约的逐行实现：196px 玻璃锚点导航 + 38px 项 + accent 选中语法（fusion.css:3414–3451）、720px 版心（3460）、10px/700/.13em accent 章节字 + accent-18% 规则线（3470–3481）、仪器卡设置行（3487–3511）、控件词汇全 Astryx（index.tsx:521–731）、校准台收尾外观段（648–676）、即改即写无保存钮（544）。esc 优先级链完整（右键菜单守卫 → 沉浸播放器 → 返回，162–167）；scroll-spy（rAF 节流 + 触底兜底 + 320ms easeOutCubic 自绘滚动，170–214）**超过 mock**——旧快照的「无 scroll spy」已修复。

具名偏离：
1. **订阅管理 subview 消失**——DESIGN.md/PRODUCT.md 规定子视图与 esc 链 订阅→设置→未读；实现内联为第 6 个锚点段（index.tsx:934–937），esc 直接跳列表；`.fusion-set-inner.wide` 成死 CSS（fusion.css:3466–3468）。
2. **卡片密度控件失灵**（见 P1-1）——校准台「实时反映上方设置」的承诺对其四路输入之一不成立。
3. **焦点环词汇缺失**——mock 的 `*:focus-visible{outline:2px solid var(--accent)}` 与 DESIGN.md「键盘焦点环」产品签名在 fusion.css 无对应物。
4. **文案腐坏**——zh theme_help 破句 + 过时。

裁定：**8/10**——几何与排版契约为真；偏离集中在行为契约（密度接线、子视图、焦点环、文案）。

## Deterministic Scan（检测器证据）

- **CLI（detect.mjs --json src/layout/setting）：exit 0，零发现**。以全 src/ 复跑验证检测器本身工作正常（仅 2 条落在 articleContent.ts 正则字面量的 false positive，不在目标面内）——目标面的空结果是真干净。
- **页面内扫描（detect.js 注入运行中的 Vite 页面，chocolate 主题/浅色）：142 元素 / 151 条**，按族分诊：
  - `low-contrast` ×87——集中在 ⌘K 按钮 Kbd chip（实测 color rgb(74,53,32) on rgba(140,89,39,.06)，≈2.6:1）。来源是 **Astryx chocolate 主题自有 kbd 令牌**，非 fusion 层可修；属于主题包问题，记为已知上游。
  - `tiny-text` ×40 / `undersized-ui-text` ×8——全部落在 11.5px 帮助文与 10px 段题章字：**DESIGN.md 契约故意值**，按契约判 false positive（检测器无契约知识）。
  - `text-occlusion` ×3——`.hp/.lb` 帮助文被 `div.fusion-player`（悬浮播放条）遮住：滚动位置伪影 + 印证 102px 让位空白的必要性；非缺陷。
  - **`line-length` ×1——真实新发现（A 未抓到）：校准台 serif 预览段 ~91 字符/行**。真实阅读面 ≤640px，预览段却是全宽 720px——校准台在行宽上失真，所调非所读。
  - `clipped-overflow-container` ×5、`border-accent-on-rounded` ×3（Astryx Kbd 自有样式）、`layout-transition` ×3（astryx-switch-thumb 内部实现）、`cramped-padding` ×1——低危/组件库内部。

## 父会话 DOM 实证（交叉验证 A）

- `.fusion-subs-row`：79 行，`tag=DIV, role=null, tabindex=null`——**键盘不可达实锤**。
- `[aria-current]` 全页仅 1 处且挂在播客队列行（.q-row.now）——**spy 导航确实无 aria-current**。
- 237 buttons / 0 无障碍名缺失；img alt 全齐；标题层级 6×H2 无跳级——基础 a11y 比预期健康。
- 坏文案「深色为命名候「夜读本」，非简单反色」在真实 DOM 可见。

## Overall Impression

设置面是 fusion 改版后完成度最高的面之一：契约几何、scroll-spy、校准台、破坏性动作语法都在线，比 9 月快照（19/36）进步显著。最大机会不在视觉而在**诚实**：一个失灵的密度控件让校准台的承诺掺水，一个隐藏爆炸半径的删除对话框让最危险的动作用最少的话说完，文档与实现就子视图的形态各执一词。

## What's Working

1. **契约为真的几何与滚动**——196px 导航/720px 版心/accent 章节字/42px 订阅行 44px 步距全部对表；锚点滚动（定时长 easeOutCubic、滚轮可打断、rAF spy + 触底兜底）实测优于 mock 的 scrollIntoView。
2. **校准台真的在校准**——`--read-size`/`--read-lh` 与阅读面同源；预览行复用真实列表词汇（76px 缩略图/monogram/已读点），所见即所读。
3. **feed 级破坏性语法有纪律**——行内垃圾桶 ghost 变体 + 悬停显隐 + 必经确认；destructive 变体只出现在右键菜单与对话框，符合契约。

## Priority Issues

1. **[P1] 卡片密度控件失灵，校准台为它撒谎。** `card_density` 写 `--row-h`（index.tsx:261–266、App.tsx:92–96），但全样式表唯一消费者是预览行 `height:max(var(--row-h,54px),52px)`（fusion.css:3575）；真实文章行硬编码 52px（fusion.css:871）、订阅行 42px。「紧凑」改变不了真实列表，只把预览行 54→52px。失灵控件侵蚀对其余所有控件的信任。Fix: `.fusion-row` 接 `var(--row-h)`（52/44 内容高对表 DESIGN 步距），或砍掉控件直到为真。命令：`$impeccable polish`（含 fix 项）。
2. **[P1] 文件夹删除确认隐藏爆炸半径。** 删分组 = 删全部成员 feed 及其全部文章（folder.rs:54–80），对话框只说「删除与 {{title}} 相关的数据」。高危时刻信息最少——删一个看起来空的分组可能损失 9 个源与多年存档。Fix: 描述枚举「包含 N 个订阅源与它们的文章，将一并删除」。命令：`$impeccable clarify`。
3. **[P1] 键盘焦点词汇缺失 + 订阅行键盘不可达。** fusion 无任何 `:focus-visible` accent 焦点环；`.fusion-subs-row` 是无 role/tabindex 的 div onClick（DOM 实证：79 行全数）——键盘用户能同步/删除源却永远打不开它；spy 导航无 aria-current。键盘优先产品的最弱键盘公民。Fix: 全局 accent 焦点环令牌 + 行 button 语义 + aria-current。命令：`$impeccable audit` 后修。
4. **[P2] 订阅管理子视图契约漂移。** 文档说子视图 + esc 链 + 尾箭头出口项；实现内联为锚点段、esc 直达列表、死 CSS `wide`。文档与实现就面的核心导航形态各执一词。Fix: 择一为真——恢复子视图，或更新 DESIGN.md/brief 并删死类。命令：`$impeccable document`。
5. **[P2] 文案/i18n 缺陷簇。** theme_help 破句 + 过时；「分析元数据」AI 残留双语皆在；「订阅规则」vs「站点规则」命名打架；`account.status` 裸串未本地化（index.tsx:776）。双语文案即界面。Fix: settings.* 双语一遍 + status→key 映射。命令：`$impeccable clarify`。
6. **[P2] 校准台行宽失真**（页面内扫描新发现）：serif 预览段全宽 720px ≈91 字符/行，真实阅读 ≤640px。Fix: 预览段落限宽至阅读面同宽。命令：`$impeccable polish`。

## Persona Red Flags

- **Alex（键盘优先）：** 79 个订阅行全是 div onClick，无 Enter、无焦点、无 accent 焦点环指示 Tab 落点——管理动线第一步就死。
- **Sam（读屏）：** spy 导航只切视觉 .on 类、无 aria-current，段位永不播报；订阅行无 role/name/action；失败账户朗读裸英文后端串，夹在中文 UI 中间。
- **Casey（双语读者）：** zh 导航「订阅规则」vs 块题「站点规则」；「深色为命名候『夜读本』」不成句；「分析元数据」双 AI 残留；en.json 缺 Light/Dark 键（靠键名兜底而 zh 有译文）。

## Minor Observations

- 导出=↑/导入=↓ 图标方向是 app 中心视角，反桌面惯例（export 通常向外下载）——mock 如此，属有意，值得一次自觉确认。
- 滑杆逐 tick 持久化：每次 onChange → POST /user-config → TOML 同步写；rAF 合并写入更诚实。
- `"Ops! Something wrong~"` 错误兜底文案与仪器语气冲突。
- 两代 i18n 键共存：新 settings.* 命名空间与裸英文键（"Update Interval"/"Thread"/"Font size"）混用。
- 分组头「全部已读」无受影响计数 toast（列表面契约有）。
- 校准台预览仅 2 行 + 1 段；无视频/徽章样本，徽章类外观选择无台面覆盖。

## Questions to Consider

- 一个除 2px 预览差外不产生任何可见变化的设置，是设置还是安慰剂？0.2.0 该不该 ship 密度？
- 内联订阅块让设置同时是偏好页与无上界数据的 CRUD 面；100+ feed 时一页滚动还成立吗，还是该给 ?tab=subscriptions 它应得的独立模式（自有 dtop 元信息 + 自己的 esc 步）？
- dtop 承诺「更改即时生效并写入本地配置」——滑杆逐 tick 写库是这句话的字面执行。诚实的修法是合并写入，还是软化承诺？
