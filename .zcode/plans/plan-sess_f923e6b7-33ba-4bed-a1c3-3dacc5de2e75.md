# 非 RSS 订阅源最终方案：fetcher 家族 + packages/ monorepo 布局

（已确认：站点四层覆盖、内嵌规则引擎 + 可选外接桥接、到期调度 worker + sync 事件、Newsletter IMAP、B站 wbi/SESSDATA、数据模型迁移、`packages/` 对齐 pnpm 约定。本版落实命名：fetcher 家族。）

## 一、命名总表（说清楚它干什么活，与仓库动词传统一致）

| 原名（废弃） | 定名 | 理由 |
|---|---|---|
| `packages/provider-core` | **`packages/fetcher-core`** | trait 所在；"抓取器"直给 |
| `provider-rss` | **`fetcher-rss`** | 抓 RSS 的 |
| `provider-newsletter` | **`fetcher-mail`** | 抓邮箱的（比 newsletter 更直白：它读的是 IMAP） |
| `provider-bilibili` | **`fetcher-bilibili`** | 抓 B 站动态的 |
| `route-engine` | **`fetcher-site`** | 按规则抓站点的（"route" 在本项目已被 UI 路由/Actix 路由占用，弃用） |
| `routes/`（硬编码） | 并入 `fetcher-site`（`src/sites/`） | 同属"按站点写死抓取"，不单开 crate |
| `route-packs` | **`packages/site-rules`** | TOML 规则包：一条规则=怎么读一个站点 |

代码内命名同步：trait **`Fetcher`**（方法 `detect` + `fetch` + `id` + `carrier_hint`，detect 对齐前端 detect()）；中性条目 **`FetchedArticle`**；上下文 `FetchContext`；探测入参 `DetectInput`/出参 `DetectOutput`。`provider`、`probe` 等词全部清除。

## 二、布局与两套 workspace

```
lettura/
├── pnpm-workspace.yaml            # packages: [apps/*, packages/*]
├── package.json                   # + cargo:check / cargo:test / cargo:fmt 脚本
├── Cargo.toml                     # members = ["apps/desktop/src-tauri", "packages/*"]
├── apps/desktop|docs/             # 不动；src-tauri 保留 server/cmd/scheduler/DB/账户
└── packages/
    ├── fetcher-core/              # trait Fetcher + FetchedArticle + FetchContext（零 app 依赖）
    ├── fetcher-rss/               # feed-rs，现有 parse_feed 逻辑搬运
    ├── fetcher-mail/              # async-imap + mail-parser
    ├── fetcher-bilibili/          # wbi 签名 + 动态 API
    ├── fetcher-site/              # 规则引擎 + 内置站点（src/sites/weibo.rs …）
    └── site-rules/                # TOML 规则包（数据 crate + fixtures/golden 测试）
```

- 全部 Rust 归根 Cargo workspace 一个（`Cargo.lock`/`target/` 已在根）；`src-tauri` 是成员不是独立 workspace
- pnpm 忽略无 package.json 的目录，`packages/*` 加进 pnpm-workspace.yaml 只是声明意图，无副作用
- crate 用 `[workspace.dependencies]` + `version.workspace = true` 收敛版本

## 三、fetcher-core 核心

```rust
// packages/fetcher-core —— 无 diesel/tauri/reqwest 依赖
pub struct FetchedArticle {
    pub title: String,
    pub link: String,                 // 全局唯一（rss=原文；mail=urn:lettura:mail/{acct}/{uid}；bilibili=bv）
    pub content_html: Option<String>,
    pub summary: Option<String>,
    pub author: Option<String>,
    pub published_at: Option<String>, // 'YYYY-MM-DD HH:MM:SS' UTC
    pub media: Vec<MediaAttachment>,  // 对齐现有 media_object JSON 形状
    pub carrier: Carrier,             // Text | Audio | Video | Email
}

#[async_trait]
pub trait Fetcher: Send + Sync {
    fn id(&self) -> &'static str;                 // "rss" | "mail" | "bilibili" | "site"
    fn carrier_hint(&self) -> Carrier;
    async fn detect(&self, input: &DetectInput) -> Result<DetectOutput, String>;
    async fn fetch(&self, ctx: &FetchContext) -> Result<Vec<FetchedArticle>, String>; // 无状态
}

pub struct FetchContext {
    pub feed: FeedView,                      // uuid / feed_url / source_config(JSON)
    pub account: Option<AccountMaterial>,    // app 解析好凭据再递入
    pub http: reqwest::Client,               // UA/代理/超时由 app 统一构造
}
```

- 依赖方向单向：`fetcher-site → fetcher-core ← src-tauri` 等；fetcher crates 禁止依赖 diesel/tauri/actix（crate 图强制）
- 主 crate 写 `FetchedArticle → NewArticle` 转换（改造 `create_article_models`）；入库/去重/健康/事件全留 app；凭据密钥面收敛在 app 一处
- 分发：`cmd.rs` detect 按序「内置 fetcher → site-rules 正则 → RSS 发现层 → 外接实例模板」；`channel.rs:694 sync_articles` 按 `feeds.provider` 查 fetcher

## 四、site-rules 与 fetcher-site

```
packages/site-rules/
├── rules/*.toml        # pattern 正则 + fetch(json/html) + item 字段映射（JSONPath/CSS 选择器）
├── tests/fixtures/ + golden/   # 样本快照 → 期望 FetchedArticle，数据驱动测试
└── src/lib.rs          # include_str! 打包 + schema 校验
```

运行时优先级：`~/.lettura/rules/*.toml`（社区导入写这里）> 内置包，同 key 覆盖。`fetcher-site/src/sites/` 放需要签名/多请求编排的硬编码站点。前端 `feedGenerators.ts` 的 BUILTIN_GENERATORS 后续由 `GET /api/rules` 供数（单一事实源）。

## 五、数据模型 / Worker / 各 fetcher（确认不变，摘要）

- Migration：`feeds` +`provider/account_uuid/source_config`；新表 `source_accounts`（IMAP 授权码、B站 SESSDATA）；命令 `save/list/delete/test_source_account`
- Worker：到期过滤（启用 `sync_interval`，mail 默认 15min）+ 三层并发（全局 Semaphore / IMAP 账户 Mutex / B站令牌桶 3s/req）+ `emit("sync://completed")`
- fetcher-mail：UID SEARCH 增量 + mail-parser；fetcher-bilibili：wbi（nav key 每日缓存）+ SESSDATA + -352 提示；X 暂缓
- 前端：AddFeed detect 分发（链接/邮件模式）+ 设置「来源账户」+ carrier 渲染轴复用 + sync listener；en/zh.json 同步

## 六、分期

1. **P1 地基 + 布局迁移**：建 `packages/` 与 fetcher-core；fetcher-rss 抽取、app 走 registry；根三份配置文件更新——结束时行为零变化；到期调度 + sync 事件 + migration
2. **P2 邮件订阅**：fetcher-mail + source_accounts + 设置 UI + AddFeed 邮件模式
3. **P3 B站 + 规则引擎**：fetcher-bilibili；fetcher-site + site-rules + 热加载 + 2 个示例（1 硬编码 1 TOML）验证全链路
4. **P4 生态**：`/generated/*.xml` 本地供应端点、规则导入、外接桥接实例、`GET /api/rules` 收编前端表；（可选）`apps/engine` 无头薄壳复用 packages
5. **X 暂缓**，Fetcher 口子已留

## 七、Trade-offs 如实说

trait 改动扇出多 crate（仅 2 方法 + 共享 target，可控）；每 crate ~20 行 Cargo.toml 样板；本方案是编译期模块化而非运行时插件（dlopen/WASM 明确不做，trait + FetchedArticle 即未来插件 ABI 起点）；双 workspace 并存需在 AGENTS.md 补一段成员说明。