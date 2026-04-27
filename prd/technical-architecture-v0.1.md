# Lettura 技术架构方案 v0.1

> 基于 `prd/version-roadmap-v2.md` 的版本规划，支撑 Lettura 从 RSS Reader 演进到 Personal Intelligence Feed / Intelligence OS。

---

## 1. 设计原则

1. **单体模块化**：在现有 Tauri crate 内新增模块，不引入 sidecar 或独立服务
2. **只加不改**：新增模块和数据表，不重构现有 `core/`、`feed/`、`server/`
3. **增量 Pipeline**：AI 处理采用异步后处理模式，feed sync 完成后触发
4. **4 层架构**：Source → Pipeline → Intelligence → Product Service
5. **BYOK 模式**：用户自带 API Key，不托管模型、不训练数据
6. **最小依赖**：每个 minor 只引入必要的新依赖，避免一次性大升级

---

## 2. 系统架构

### 2.1 整体系统架构图

```mermaid
graph TB
    subgraph Frontend["前端 (React + Vite)"]
        UI_Today["Today Intelligence 页"]
        UI_Topic["Topic 页"]
        UI_Feed["Feed 管理页"]
        UI_Onboarding["Onboarding 流程"]
        UI_Settings["Settings"]
        Store["Zustand Store"]
        Store --> UI_Today
        Store --> UI_Topic
        Store --> UI_Feed
        Store --> UI_Onboarding
    end

    subgraph Tauri["Tauri v2 桌面框架"]
        IPC["IPC 命令层 (cmd.rs)"]
        Events["事件系统"]
    end

    subgraph Backend["Rust 后端"]
        Sources["sources/"]
        Pipeline["ai/pipeline"]
        AI["ai/ (LLM + Embedding)"]
        Feed["feed/ (现有)"]
        Core["core/ (现有)"]
        Server["server/ (现有 HTTP)"]
    end

    subgraph Storage["存储层"]
        SQLite["SQLite (Diesel)"]
        VecDB["sqlite-vec (向量)"]
        TOML["lettura.toml (配置)"]
        PackJSON["Starter Pack JSON"]
    end

    subgraph External["外部服务"]
        RSS["RSS/Atom 源"]
        OpenAI["OpenAI API / 兼容端点"]
        Ollama["Ollama (可选本地)"]
    end

    UI_Today -->|"get_today_signals"| IPC
    UI_Topic -->|"get_topic_detail"| IPC
    UI_Onboarding -->|"install_pack"| IPC
    UI_Feed -->|"现有 feed 命令"| IPC

    IPC --> Sources
    IPC --> Feed
    IPC --> AI
    IPC --> Server

    Feed -->|"sync 完成触发"| Pipeline
    Sources -->|"安装后创建 feed"| Feed
    Pipeline --> AI
    Pipeline -->|"存储结果"| SQLite
    AI -->|"调用"| OpenAI
    AI -->|"调用 (可选)"| Ollama

    Feed -->|"fetch + parse"| RSS
    AI -->|"向量存储"| VecDB
    Core -->|"读取配置"| TOML
    Sources -->|"加载"| PackJSON

    Pipeline -->|"pipeline:completed"| Events
    Feed -->|"feed:synced"| Events
    AI -->|"ai:stream"| Events
    Events -->|"监听"| Store
```

### 2.2 四层架构

```mermaid
graph TB
    subgraph Layer4["Product Service Layer"]
        Today["Today Service<br/>Top Signals / Overview"]
        TopicService["Topic Service<br/>聚合 / 排序 / 跟踪"]
        Settings["Settings Service<br/>API Key / 配置"]
    end

    subgraph Layer3["Intelligence Layer"]
        Summary["Summary<br/>文章摘要生成"]
        WIM["Why It Matters<br/>重要性解释"]
        Rank["Ranking<br/>相关度排序"]
        Cluster["Clustering<br/>主题聚类"]
    end

    subgraph Layer2["Pipeline Layer"]
        Extract["Extract<br/>内容提取"]
        Embed["Embed<br/>向量化"]
        PipelineOrch["Pipeline Orchestrator<br/>流程编排"]
        Detect["Detect<br/>Signal 检测"]
    end

    subgraph Layer1["Source Layer"]
        SP["Starter Pack<br/>预置高质量源"]
        UF["User Feeds<br/>用户订阅"]
        OPML["OPML Import<br/>批量导入"]
    end

    Layer1 -->|"install / sync"| Layer2
    Layer2 -->|"embed + cluster"| Layer3
    Layer3 -->|"rank + summarize"| Layer4
```

---

## 3. 核心业务流程

### 3.1 Feed Sync → AI Pipeline 完整流程

```mermaid
sequenceDiagram
    participant Scheduler as Scheduler (定时)
    participant Feed as feed/ (sync)
    participant Pipeline as ai/pipeline
    participant Embed as ai/embedding
    participant LLM as ai/llm
    participant DB as SQLite
    participant UI as React UI

    Scheduler->>Feed: 定时触发 sync_feed()
    Feed->>Feed: fetch RSS + parse
    Feed->>DB: INSERT new articles
    Feed->>Pipeline: tokio::spawn (异步触发)
    Feed-->>UI: emit "feed:synced"

    Pipeline->>DB: SELECT unprocessed articles (batch 32)
    Pipeline->>Embed: embed(article_contents)
    Embed->>Embed: OpenAI API call
    Embed-->>Pipeline: Vec<Vec<f32>>
    Pipeline->>DB: Store embeddings (sqlite-vec)

    Pipeline->>Pipeline: cluster(new embeddings) → match centroids
    Pipeline->>DB: INSERT/UPDATE topics

    Pipeline->>LLM: generate summary + why_it_matters (batch 5)
    LLM->>LLM: OpenAI API call
    LLM-->>Pipeline: summaries + explanations

    Pipeline->>Pipeline: rank(articles) → compute relevance_score
    Pipeline->>DB: INSERT article_ai_analysis
    Pipeline-->>UI: emit "pipeline:completed"

    UI->>UI: Refresh Today signals
```

### 3.2 Onboarding 流程

```mermaid
flowchart TD
    Start["首次启动"] --> Check{已有订阅源?}
    Check -->|"是"| Skip["跳过 Onboarding"]
    Check -->|"否"| Show["显示 Onboarding"]

    Show --> Select["选择兴趣领域<br/>(多选 Pack)"]
    Select --> Preview["预览 Pack 内容"]
    Preview --> Confirm{确认安装?}
    Confirm -->|"调整"| Select
    Confirm -->|"确认"| Install["install_pack()"]

    Install --> CreateSrc["创建 sources + feeds 记录"]
    CreateSrc --> Sync["触发首次抓取<br/>(async)"]
    Sync --> Progress["显示安装进度"]
    Progress --> Wait{"抓取完成?"}
    Wait -->|"否"| Progress
    Wait -->|"是"| Pipeline["触发 AI Pipeline"]
    Pipeline --> Today["进入 Today 页面<br/>(展示首批 Signals)"]

    Skip --> Today
```

### 3.3 Today 页面交互流程

```mermaid
flowchart TD
    Enter["进入 Today"] --> Load["加载 Top Signals"]
    Load --> Overview["显示今日概览<br/>(一句话)"]
    Overview --> Signals["显示 3-5 条 Signal 卡片"]

    Signals --> Expand["展开 Signal"]
    Expand --> Why["Why It Matters<br/>(为什么重要)"]
    Expand --> Sources["来源透明<br/>(来源文章列表)"]

    Why --> Action{用户操作}
    Sources --> Action

    Action -->|"点击原文"| Read["打开原文阅读"]
    Action -->|"有用"| Feedback1["记录正面反馈"]
    Action -->|"不相关"| Feedback2["记录负面反馈"]
    Action -->|"继续关注"| Track["加入关注列表"]

    Feedback1 --> Refresh["更新排序权重"]
    Feedback2 --> Refresh
    Track --> TopicFuture["未来关联到 Topic"]

    Read --> Back["返回 Today"]
    Back --> Signals
```

---

## 4. 产品功能流程

### 4.1 Signal 生命周期

```mermaid
stateDiagram-v2
    [*] --> Created: 新文章入库
    Created --> Embedded: Pipeline 生成 Embedding
    Embedded --> Deduplicated: 去重检测 + 信息密度评估
    Deduplicated --> Clustered: 增量聚类匹配
    Clustered --> Analyzed: LLM 生成 Summary + WIM
    Analyzed --> Ranked: 计算相关性分数
    Ranked --> TopSignal: 分数 Top 5
    Ranked --> Archived: 分数不足

    TopSignal --> Shown: 展示在 Today
    Shown --> Clicked: 用户点击深读
    Shown --> Feedback: 用户反馈
    Shown --> Expired: 超过 24h

    Feedback --> WeightUpdated: 更新权重
    WeightUpdated --> TopSignal: 重新排名

    Archived --> TopicMember: 归入 Topic 但不展示
    TopSignal --> TopicMember: 从 Today 下线

    TopicMember --> [*]: 超过保留期
    Expired --> [*]
```

### 4.2 Topic 演化流程

```mermaid
flowchart LR
    subgraph Phase1["2.x Phase 1: Today 为主"]
        A1["单篇文章"] -->|"Pipeline 聚类"| A2["相似文章组"]
        A2 -->|"centroid 匹配"| A3["分配到 Topic"]
    end

    subgraph Phase2["2.x Phase 2: Topic 建立期"]
        B1["Topic 基础页"] --> B2["多来源聚合"]
        B2 --> B3["Topic Summary"]
        B3 --> B4["排序 + 持续跟踪"]
    end

    subgraph Phase3["3.x: Signal 升级"]
        C1["Topic 时间线"] --> C2["变化检测"]
        C2 --> C3["Signal 对象"]
        C3 --> C4["主动提醒"]
    end

    Phase1 --> Phase2 --> Phase3
```

### 4.3 用户反馈闭环

```mermaid
flowchart TD
    Signal["Signal 卡片"] --> Feedback["用户反馈"]
    Feedback -->|"有用"| Positive["正面反馈<br/>(+relevance)"]
    Feedback -->|"不相关"| Negative["负面反馈<br/>(-relevance)"]
    Feedback -->|"继续关注"| Follow["加入关注<br/>(+topic_weight)"]

    Positive --> Store["存储到 user_feedback"]
    Negative --> Store
    Follow --> Store

    Store --> Model["更新排序模型"]
    Model --> Next["下次 Today 刷新<br/>应用新权重"]
```

---

## 5. 数据关系

### 5.1 ER 图（完整数据模型）

```mermaid
erDiagram
    sources {
        int id PK
        string uuid UK
        string feed_url
        string title
        string site_url
        string source_type "starter_pack | user | opml_import"
        string pack_id "nullable"
        string language
        float quality_score
        float weight
        boolean is_active
        timestamp create_date
        timestamp update_date
    }

    feeds {
        int id PK
        string uuid UK
        string title
        string link
        string feed_url
        string feed_type
        string description
        timestamp pub_date
        timestamp updated
        string logo
        string health_status
        string failure_reason
        int sort
        int sync_interval
        timestamp last_sync_date
        timestamp create_date
        timestamp update_date
        int source_id "FK → sources (nullable, 2.1 新增)"
    }

    articles {
        int id PK
        string uuid
        string title
        string link
        string feed_url
        string feed_uuid
        string description
        string author
        timestamp pub_date
        text content
        timestamp create_date
        timestamp update_date
        string read_status
        text media_object
        boolean starred
    }

    feed_metas {
        int id PK
        string uuid
        string folder_uuid
        int sort
        timestamp create_date
        timestamp update_date
    }

    folders {
        int id PK
        string uuid
        string name
        int sort
        timestamp create_date
        timestamp update_date
    }

    article_ai_analysis {
        int id PK
        int article_id UK "FK → articles"
        text summary
        text why_it_matters
        float relevance_score
        int topic_id "FK → topics"
        boolean is_duplicate "DEFAULT false"
        int duplicate_of "FK → article_ai_analysis(id)"
        float information_density "0.0-1.0"
        timestamp ai_processed_at
        string model_version
        timestamp create_date
        timestamp update_date
    }

    pipeline_runs {
        int id PK
        string run_type "full | incremental | single"
        string status "running | completed | failed"
        int articles_processed
        text error_message
        timestamp started_at
        timestamp finished_at
        timestamp create_date
    }

    topics {
        int id PK
        string uuid UK
        string title
        string description
        string status "active | archived | merged"
        int article_count
        int source_count
        timestamp first_seen_at
        timestamp last_updated_at
        timestamp create_date
        timestamp update_date
    }

    topic_articles {
        int id PK
        int topic_id FK "→ topics"
        int article_id FK "→ articles"
        float relevance_score
        timestamp create_date
    }

    %% 现有关系
    feeds ||--o{ articles : "has"
    folders ||--o{ feed_metas : "contains"
    feeds ||--o{ feed_metas : "referenced by"
    sources ||--o{ feeds : "has (source_id FK)"

    %% 新增关系
    articles ||--o| article_ai_analysis : "analyzed by"
    topics ||--o{ topic_articles : "contains"
    articles ||--o{ topic_articles : "grouped in"
    topics ||--o{ article_ai_analysis : "referenced in"
```

### 5.2 数据流向图

```mermaid
flowchart LR
    subgraph Input["数据输入"]
        SP["Starter Pack JSON"]
        User["用户添加 RSS"]
        OPML["OPML 导入"]
    end

    subgraph Core["核心数据"]
        Sources["sources 表"]
        Feeds["feeds 表"]
        Articles["articles 表"]
    end

    subgraph AI["AI 数据"]
        Analysis["article_ai_analysis"]
        Embeddings["sqlite-vec 向量"]
        Topics["topics 表"]
        TopicArt["topic_articles"]
    end

    subgraph Output["产品视图"]
        Today["Today (Top Signals)"]
        TopicView["Topic 页面"]
    end

    subgraph Meta["元数据"]
        Runs["pipeline_runs"]
        Feedback["user_feedback (3.x)"]
    end

    Input --> Sources --> Feeds --> Articles
    Articles -->|"Pipeline"| Analysis
    Analysis --> Embeddings
    Analysis --> Topics --> TopicArt
    Articles --> TopicArt

    Analysis --> Today
    Topics --> TopicView
    TopicArt --> TopicView
    Runs -.->|"记录"| AI
    Feedback -.->|"影响"| Analysis
```

---

## 6. 模块结构

### 6.1 Rust 后端模块

```mermaid
graph TB
    subgraph Existing["现有模块 (不改动)"]
        Core["core/<br/>config | menu | scheduler<br/>scraper | tray"]
        Feed["feed/<br/>article | channel<br/>folder | opml"]
        Server["server/handlers/<br/>article | common<br/>feed | folder"]
    end

    subgraph New["新增模块"]
        AI["ai/"]
        AIEmbed["embedding.rs<br/>EmbeddingProvider"]
        AILLM["llm.rs<br/>LLMProvider"]
        AISummary["summary.rs<br/>文章摘要"]
        AIWIM["why_it_matters.rs<br/>重要性解释"]
        AIPipeline["pipeline.rs<br/>流程编排"]
        AIRank["ranking.rs<br/>排序逻辑"]
        AIDedup["dedup.rs<br/>去重与信息密度"]

        Sources["sources/"]
        SrcSP["starter_pack.rs<br/>Pack 定义/加载/安装"]
        SrcService["source_service.rs<br/>源管理"]

        AI --> AIEmbed
        AI --> AILLM
        AI --> AISummary
        AI --> AIWIM
        AI --> AIPipeline
        AI --> AIRank
        AI --> AIDedup
        Sources --> SrcSP
        Sources --> SrcService
    end

    Cmd["cmd.rs<br/>(Tauri IPC)"]
    Cmd -->|"新增命令"| Sources
    Cmd -->|"新增命令"| AI
    Cmd -->|"现有命令"| Feed
    Cmd -->|"现有命令"| Core

    Feed -->|"sync 完成触发"| AIPipeline
    SrcSP -->|"安装后创建"| Feed
```

### 6.2 前端模块

```mermaid
graph TB
    subgraph Store["Zustand Store"]
        Index["index.ts<br/>useBearStore"]
        FeedSlice["createFeedSlice<br/>(现有)"]
        ArticleSlice["createArticleSlice<br/>(现有)"]
        UserConfig["createUserConfigSlice<br/>(现有)"]
        Podcast["createPodcastSlice<br/>(现有)"]
        TodaySlice["createTodaySlice<br/>(新增 2.2)"]
        TopicSlice["createTopicSlice<br/>(新增 2.9)"]
        OnboardSlice["createOnboardingSlice<br/>(新增 2.1)"]

        Index --> FeedSlice
        Index --> ArticleSlice
        Index --> UserConfig
        Index --> Podcast
        Index --> TodaySlice
        Index --> TopicSlice
        Index --> OnboardSlice
    end

    subgraph Pages["页面组件"]
        Intel["Intelligence/<br/>(新增 2.2)"]
        TopicsComp["Topics/<br/>(新增 2.9)"]
        OnboardComp["Onboarding/<br/>(新增 2.1)"]
        ExistingPages["Local/ | Setting/ 等<br/>(现有)"]
    end

    subgraph DataAgent["dataAgent.ts"]
        ExistingAPI["现有 Feed/Article API"]
        AIAPI["新增 AI IPC 命令"]
    end

    TodaySlice --> Intel
    TopicSlice --> TopicsComp
    OnboardSlice --> OnboardComp
    AIAPI --> TodaySlice
    AIAPI --> TopicSlice
    AIAPI --> OnboardSlice
```

---

## 7. AI 能力设计

### 7.1 Embedding

```rust
// ai/embedding.rs
trait EmbeddingProvider {
    async fn embed(&self, texts: Vec<&str>) -> Result<Vec<Vec<f32>>>;
    fn dimension(&self) -> usize;
}

// 主方案：API 调用（text-embedding-3-small，1536 维）
struct OpenAIEmbedding { client: async_openai::Client, model: String }

// 后备方案：本地模型（candle + bge-small，384 维）
// 预留接口，2.x 暂不实现
struct LocalEmbedding { model_path: PathBuf }
```

选择理由：
- API 方案起步成本最低，不需要下载模型
- text-embedding-3-small 是性价比最优选择
- 本地模型作为离线后备，3.x 阶段再引入

### 7.2 LLM

```rust
// ai/llm.rs
trait LLMProvider {
    async fn complete(&self, prompt: &str, system: &str) -> Result<String>;
    async fn stream(&self, prompt: &str, system: &str) -> Result<impl Stream<Item = String>>;
}

// 统一接口：async-openai（支持 OpenAI / Ollama / 兼容端点）
struct OpenAILLM { client: async_openai::Client, model: String }
```

流式输出通过 Tauri 事件系统推送到前端：

```rust
app.emit("ai:stream", StreamChunk { content, done })?;
```

### 7.3 Pipeline 详细流程

```mermaid
flowchart TD
    Trigger["Feed Sync 完成"] --> Spawn["tokio::spawn<br/>(异步，不阻塞)"]
    Spawn --> Fetch["SELECT 未处理文章<br/>(batch 32)"]

    Fetch --> Embed["调用 Embedding API<br/>(text-embedding-3-small)"]
    Embed --> StoreVec["存储向量到 article_ai_analysis"]

    StoreVec --> Dedup["去重检测<br/>cosine similarity > 0.85"]
    Dedup -->|"无重复"| Cluster
    Dedup -->|"有重复"| MarkDup["标记 duplicate_of<br/>保留 content 最长者"]
    MarkDup --> Store["重复文章跳过 LLM"]

    Cluster["增量聚类<br/>匹配现有 centroid"]
    Cluster -->|"匹配成功"| AssignTopic["分配到已有 Topic"]
    Cluster -->|"距离过大"| NewTopic["创建新 Topic"]

    AssignTopic --> LLM
    NewTopic --> LLM

    LLM["调用 LLM<br/>生成 summary + why_it_matters<br/>(batch 5)"]
    LLM --> Rank["计算 relevance_score<br/>综合: 聚类距离 + 源权重 + 时效性"]

    Rank --> Store["INSERT article_ai_analysis"]
    Store --> Notify["emit pipeline:completed"]
    Notify --> UI["前端刷新 Today"]
```

### 7.4 API Key 管理

- 当前阶段：明文存储在 `lettura.toml`（与现有 proxy 配置同模式）
- 配置项：`ai.api_key`、`ai.model`、`ai.embedding_model`、`ai.base_url`（支持自定义端点）
- 中期迁移：keyring crate 加密存储（3.x）

```toml
# lettura.toml
[ai]
api_key = "sk-..."
model = "gpt-4o-mini"
embedding_model = "text-embedding-3-small"
base_url = "https://api.openai.com/v1"  # 可改为 Ollama 等本地端点

[app]
onboarding_completed = false  # 首次启动后设为 true
```

---

## 8. Starter Pack 设计

### 8.1 数据结构

```json
{
  "id": "ai",
  "name": "AI & Machine Learning",
  "description": "跟踪 AI 领域最重要的技术突破、产品动态和行业趋势",
  "icon": "brain",
  "sources": [
    {
      "name": "OpenAI Blog",
      "feed_url": "https://openai.com/blog/rss.xml",
      "site_url": "https://openai.com/blog",
      "language": "en",
      "quality_score": 0.95
    }
  ]
}
```

### 8.2 Pack 存储位置

```
apps/desktop/src-tauri/src/sources/packs/
  ai.json
  developer.json
  startup.json
  product.json
  design.json
  science.json
  business.json
  tech-news.json
```

### 8.3 IPC 命令

```rust
// 新增 3 个 Tauri IPC 命令（apps/desktop/src-tauri/src/cmd.rs）
#[command]
fn get_starter_packs() -> Result<Vec<StarterPack>, String>;

#[command]
fn preview_pack(pack_id: String) -> Result<StarterPack, String>;

#[command]
async fn install_pack(pack_ids: Vec<String>) -> Result<InstallResult, String>;
```

### 8.4 安装流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant UI as Onboarding UI
    participant IPC as cmd.rs
    participant Src as sources/
    participant Feed as feed/
    participant Pipe as ai/pipeline
    participant DB as SQLite

    User->>UI: 选择 Pack
    UI->>IPC: install_pack(pack_id)
    IPC->>Src: 读取 Pack JSON
    Src->>DB: INSERT sources (source_type='starter_pack')
    Src->>DB: INSERT feeds
    Src->>Feed: 触发 sync_feed (每个源)
    Feed->>DB: INSERT articles
    Feed-->>UI: emit "feed:synced" (进度)
    Feed->>Pipe: tokio::spawn pipeline
    Pipe->>DB: AI 分析结果
    Pipe-->>UI: emit "pipeline:completed"
    UI->>User: 展示 Today 页面
```

### 8.5 源质量筛选原则

- ✅ 选：官方博客、专家博客、深度分析、原始信息源
- ❌ 不选：内容农场、纯转载站、垃圾 SEO、高频低质量内容
- 每个 Pack 15-20 个高质量源
- 首批 8 个 Pack

---

## 9. 前端集成

### 9.1 新增 Zustand Slice

```typescript
// stores/onboardingSlice.ts（2.1）
interface OnboardingState {
  packs: StarterPack[];
  selectedPacks: string[];
  status: 'idle' | 'selecting' | 'installing' | 'done';
  progress: { current: number; total: number };
}

// stores/todaySlice.ts（2.2+）
interface TodayState {
  signals: Signal[];
  overview: string;
  loading: boolean;
  lastUpdated: string;
}

// stores/topicSlice.ts（2.9+）
interface TopicState {
  topics: Topic[];
  selectedTopic: Topic | null;
  loading: boolean;
}
```

### 9.2 新增 Tauri IPC 调用

```typescript
// helpers/dataAgent.ts 扩展
const AI_COMMANDS = {
  getStarterPacks: () => invoke('get_starter_packs'),
  previewPack: (id: string) => invoke('preview_pack', { packId: id }),
  installPack: (id: string) => invoke('install_pack', { packId: id }),
  getTodaySignals: () => invoke('get_today_signals'),
  getTopicDetail: (id: number) => invoke('get_topic_detail', { topicId: id }),
  submitFeedback: (articleId: number, type: string) => invoke('submit_feedback', { articleId, type }),
};
```

### 9.3 Tauri 事件监听

```typescript
// App.tsx 扩展
listen('pipeline:completed', () => { /* 刷新 Today */ });
listen('feed:synced', (event) => { /* 更新 Onboarding 进度 */ });
listen('ai:stream', (event) => { /* 流式接收 AI 输出 */ });
```

---

## 10. 版本演进与依赖

### 10.1 2.x Minor 版本依赖关系

```mermaid
graph LR
    subgraph "Phase 1: 数据基础"
        V21["2.1 Starter Pack<br/>+ Onboarding"]
    end

    subgraph "Phase 2: Today Intelligence"
        V22["2.2 Today 入口重构"]
        V23["2.3 Top Signals MVP"]
        V24["2.4 Why It Matters"]
        V25["2.5 来源透明"]
        V26["2.6 去重与压缩"]
        V27["2.7 基础反馈闭环"]
        V28["2.8 Today 概览"]
    end

    subgraph "Phase 3: Topic Intelligence"
        V29["2.9 Topic 最小引入"]
        V210["2.10 Topic 基础页"]
        V211["2.11 Topic 聚合"]
        V212["2.12 Topic 持续跟踪"]
        V213["2.13 Topic 收口"]
    end

    V21 -->|"数据基础"| V22
    V22 --> V23
    V23 --> V24
    V23 --> V25
    V23 --> V26
    V24 --> V27
    V26 --> V28
    V25 --> V28

    V28 --> V29
    V29 --> V210
    V210 --> V211
    V211 --> V212
    V212 --> V213
```

### 10.2 技术范围与新增映射

| Minor | 技术范围 | 新增模块/表 | 关键依赖 |
|-------|---------|------------|---------|
| 2.1 Starter Pack + Onboarding | sources/ 模块 + Pack JSON + Onboarding UI | sources 表, feeds 增加 source_id 列, 3 个 IPC 命令, onboardingSlice | — |
| 2.2 Today 入口重构 | Today 页面重构为 Intelligence 入口 | todaySlice, Intelligence/ 组件 | — |
| 2.3 Top Signals MVP | AI Pipeline 最小版 + Signal 卡片 | ai/ 模块, article_ai_analysis, pipeline_runs | async-openai |
| 2.4 Why It Matters | LLM 生成解释 | ai/llm.rs, ai/why_it_matters.rs | async-openai |
| 2.5 来源透明 | 展示来源文章 | SignalSourceList 组件 | — |
| 2.6 去重与压缩 | 内存 cosine similarity 去重 + 信息密度评估 | ai/dedup.rs, article_ai_analysis 增加 3 列 | — |
| 2.7 基础反馈闭环 | 用户反馈记录 | user_feedback 表 | — |
| 2.8 Today 概览 | 一句话概览生成 | ai/summary.rs 扩展 | — |
| 2.9 Topic 最小引入 | Topic 对象 + 关联 | topics, topic_articles, ai/ranking.rs | — |
| 2.10 Topic 基础页 | Topic 展示页 | Topics/ 组件, topicSlice | — |
| 2.11 Topic 聚合 | 多来源归组 + 多观点 | topic 排序逻辑 | — |
| 2.12 Topic 持续跟踪 | 排序 + Continue Tracking | 兴趣权重逻辑 | — |
| 2.13 Topic 收口 | 验证 + 判断 | — | — |

---

## 11. 依赖规划

### 11.1 新增 Rust 依赖（2.x）

```toml
# apps/desktop/src-tauri/Cargo.toml

# AI 核心
async-openai = "0.25"      # LLM + Embedding API 调用

# 向量存储（2.3+ 引入）
# sqlite-vec 通过 rusqlite extension 加载

# 聚类（2.5+ 引入）
# hdbscan = "0.3"          # HDBSCAN 聚类
# ndarray = "0.16"         # 数值计算
```

### 11.2 新增前端依赖

```json
{
  "lucide-react": "^0.x",   // 图标（已有则跳过）
  "framer-motion": "^11.x"   // Signal 卡片动画（可选）
}
```

### 11.3 不引入的依赖

- ❌ Sidecar / 独立服务
- ❌ 本地 LLM 运行时（2.x 阶段）
- ❌ candle / hf-hub / tokenizers（3.x 离线后备时再引入）
- ❌ 任务队列框架（Pipeline 内部管理即可）

---

## 12. 技术风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| API 调用成本超预期 | 用户流失 | BYOK + 本地后备 + 批量处理 + 缓存 |
| sqlite-vec 性能不足 | 聚类/去重变慢 | 增量聚类 + 定期校正 + 限制文章数量 |
| Pipeline 阻塞主线程 | UI 卡顿 | tokio::spawn 异步 + 进度通知 |
| Embedding 模型变更 | 向量不兼容 | model_version 字段 + 版本迁移脚本 |
| Starter Pack 源失效 | 数据质量下降 | health_status 监控 + 定期审核 |

---

## 13. 不做的事

- ❌ 不重构现有 `core/`、`feed/`、`server/` 模块
- ❌ 不引入 sidecar 或独立服务
- ❌ 不构建完整 Job Engine（Pipeline 内部管理即可）
- ❌ 不使用 8 层架构（4 层足够）
- ❌ 不在本阶段实现本地 LLM / 本地 Embedding
- ❌ 不做内容平台——Starter Pack 的源全部是外部 RSS
