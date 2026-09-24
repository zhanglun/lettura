---
target: 设置面（含订阅管理子视图）
total_score: 19
max_score: 36
na_heuristics: 10
p0_count: 1
p1_count: 2
timestamp: 2026-09-23T02-13-51Z
slug: src-layout-setting-index-tsx
---
# 设置面评审 · Lettura 0.2.0「静密 × 聚光」

Method: dual-agent (A: design review · B: detector + grep audit)

## 裁定
2px 左线 = 契约内焦点行语法；绿色 = mock 色板行的 moss 选项（mock 脚本换三个令牌）。实现只做 60%：漏 --fusion-accent-line、暗色 body 覆盖压过内联补丁、9+2 处硬编码靛蓝、localStorage 而非 userConfig 持久化——混色即 AI 味来源。

## 启发式（0-4）
1 状态可见 2（选中环不动、暗色静默回退）；2 贴近真实 2（文件夹/分组摇摆、返回钮语义倒置）；3 控制自由 1（订阅子视图 esc 死键）；4 一致性 1（三套强调色系统、双持久化通道、两套分段语法）；5 错误预防 3；6 识别回忆 3；7 灵活高效 2（无 scroll spy）；8 美学极简 3；9 错误恢复 2（来源健康行缺席）；10 帮助文档 n/a。合计 19/36（52.8%，Acceptable）。

## 设计特异性
骨架为该产品而写（左锚点导航+校准台+发丝线），指尖是脚手架默认值（原生 select/矩形分段/原生 range/失灵选中环/中英混排）。检测器：设置面目录 0 发现；全仓库 5 条中 2 条误报（正则字符串、进度线 width 过渡）、2 条在已退役旧组件层、1 条属阅读面。

## 优先问题
- P0 换色令牌链三重泄漏：accent-line 永不更新；body.dark-theme 压过 html 内联；fusion.css 9 处浅色+2 处深色硬编码靛蓝（L2237 深色块误用浅色基色）。Fix: color-mix 单源派生 + userConfig 持久化 + 每色板夜读本提亮值（规格欠账，需补 DESIGN.md）。
- P1 订阅子视图 esc 死键 + 头部语义倒置（返回钮写「订阅管理」、d-src 写「设置」，与 mock 互换）。Fix: 注册 esc；文案对调。
- P1 无 scroll spy（mock settings.html:798-812 有 rAF 实现可照搬）；色板点击不触发重渲染。Fix: userConfig 驱动选中态。
- P2 控件词汇降级：4 处原生 select（应为玻璃菜单浮层）；.fusion-seg 应为胶囊（radius 999）对齐 .fusion-tab；滑杆应为 3px 轨+白环旋钮。
- P2 双语残留：INTERVALS 缺 4 个 zh 键（「手动 / 1 hour」混排）；文件夹→分组统一；「9 源」补量词；宋体样张回填 mock 全文。

## 人物红旗
Alex：订阅管理 esc 失灵；暗色下自定义色消失。Jordan：色板选中环不动；混排下拉疑装错语言包。Sam：原生控件键盘友好（加分）；色板无 aria-pressed。

## Minor
.live 缺 accent 色；出口箭头文本字形；校准台不显影密度；色板环墨色非 accent-line；预览块圆角/内距 1-3px 漂移。
