# Lettura API 接口规范

> 定义 2.x 新增的所有 Tauri IPC 命令、HTTP 端点、Tauri 事件的完整接口契约。
> 现有 15 个 IPC 命令和 ~24 个 HTTP 端点保持不变，本文档只覆盖新增部分。

---

## 1. 通用约定

### 1.1 数据类型

```typescript
// 通用 ID 类型
type UUID = string;              // 标准 UUID v4
type Timestamp = string;         // ISO 8601: "2026-04-26T10:30:00Z"
type FeedURL = string;           // 合法的 RSS/Atom URL
type ErrorCode = string;         // 错误码枚举

// 通用错误响应
interface ApiError {
  code: ErrorCode;
  message: string;               // 人类可读的错误描述
  details?: Record<string, any>; // 可选的附加信息
}
```

### 1.2 错误码体系

| 范围 | 含义 | 示例 |
|------|------|------|
| `SRC_*` | Starter Pack / Source 相关 | `SRC_NOT_FOUND`, `SRC_INSTALL_FAILED` |
| `AI_*` | AI Pipeline / LLM / Embedding | `AI_NO_API_KEY`, `AI_API_ERROR`, `AI_TIMEOUT` |
| `PL_*` | Pipeline 运行 | `PL_ALREADY_RUNNING`, `PL_FAILED` |
| `TODAY_*` | Today 页面 | `TODAY_NO_DATA`, `TODAY_NOT_READY` |
| `TOPIC_*` | Topic 相关 | `TOPIC_NOT_FOUND`, `TOPIC_EMPTY` |
| `FB_*` | 用户反馈 | `FB_INVALID_TYPE` |
| `CFG_*` | 配置相关 | `CFG_INVALID_KEY`, `CFG_MISSING_FIELD` |

### 1.3 IPC 调用模式

所有新增 IPC 命令通过 `@tauri-apps/api/core` 的 `invoke` 调用：

```typescript
import { invoke } from '@tauri-apps/api/core';

// 成功：返回数据
const result = await invoke<ReturnType>('command_name', { param: value });

// 失败：抛出 Error，message 为 JSON 字符串化的 ApiError
```

---

## 2. Starter Pack 接口（2.1）

### 2.1 `get_starter_packs`

获取所有可用的 Starter Pack 列表。

```typescript
// 调用
invoke<StarterPack[]>("get_starter_packs");

// 返回
interface StarterPack {
  id: string;                    // Pack 唯一标识: "ai" | "developer" | ...
  name: string;                  // 显示名称: "AI & Machine Learning"
  description: string;           // 一句话描述
  icon: string;                  // lucide-react 图标名
  source_count: number;          // 包含的源数量
  language: string;              // 主要语言: "en" | "zh" | "mixed"
  tags: string[];                // 标签: ["artificial-intelligence", "llm", "tools"]
}

// 错误
// 无（始终返回数组，可能为空）
```

### 2.2 `preview_pack`

预览某个 Pack 的详细内容（包含完整源列表）。

```typescript
// 调用
invoke<PackPreview>("preview_pack", { packId: string });

// 参数
{ packId: "ai" }

// 返回
interface PackPreview {
  id: string;
  name: string;
  description: string;
  icon: string;
  language: string;
  tags: string[];
  sources: PackSource[];
}

interface PackSource {
  name: string;                  // 源名称
  site_url: string;              // 网站地址
  feed_url: string;              // RSS 地址
  language: string;
  quality_score: number;         // 0.0 - 1.0
  description?: string;          // 可选的一句话描述
}

// 错误
| code             | message                    |
|------------------|----------------------------|
| SRC_NOT_FOUND    | Pack "{packId}" not found  |
```

### 2.3 `install_pack`

安装一个或多个 Pack，创建 sources + feeds 记录，触发首次抓取。

```typescript
// 调用
invoke<InstallResult>("install_pack", { packIds: string[] });

// 参数
{ packIds: ["ai", "developer"] }

// 返回（立即返回，抓取异步进行）
interface InstallResult {
  installed_feeds: number;       // 创建的 feed 数量
  installed_sources: number;     // 创建的 source 数量
  sync_started: boolean;         // 是否已触发异步抓取
}

// 错误
| code                | message                              |
|---------------------|--------------------------------------|
| SRC_NOT_FOUND       | Pack "{packId}" not found            |
| SRC_INSTALL_FAILED  | Failed to install pack: {reason}     |
| SRC_ALREADY_EXISTS  | All sources already installed        |

// 异步通知
// 安装后通过 Tauri event "feed:sync_progress" 报告抓取进度
```

---

## 3. Today Intelligence 接口（2.2–2.8）

### 3.1 `get_today_overview`

获取今日概览（一句话总结）。

```typescript
// 调用
invoke<TodayOverview>("get_today_overview");

// 返回
interface TodayOverview {
  summary: string;               // 一句话概览
  signal_count: number;          // 今日 Signal 总数
  article_count: number;         // 今日新文章总数
  generated_at: Timestamp;       // 概览生成时间
  is_stale: boolean;             // 是否需要刷新（超过 30 分钟）
}

// 错误
| code              | message                           |
|-------------------|-----------------------------------|
| AI_NO_API_KEY     | AI API key not configured         |
| TODAY_NO_DATA     | No articles available for today   |
```

### 3.2 `get_today_signals`

获取今日 Top Signals 列表。

```typescript
// 调用
invoke<Signal[]>("get_today_signals", { limit?: number });

// 参数
{ limit?: number }  // 默认 5，最大 10

// 返回
interface Signal {
  id: number;                    // article_ai_analysis.id
  title: string;                 // Signal 标题
  summary: string;               // 一句话结论
  why_it_matters: string;        // 为什么重要
  relevance_score: number;       // 0.0 - 1.0 相关性分数
  source_count: number;          // 来源文章数量
  sources: SignalSource[];       // 来源文章列表
  topic_id?: number;             // 关联的 Topic ID（可选）
  topic_title?: string;          // 关联的 Topic 标题（可选）
  created_at: Timestamp;         // 生成时间
}

interface SignalSource {
  article_id: number;
  title: string;                 // 原文标题
  link: string;                  // 原文链接
  feed_title: string;            // 来源 Feed 名称
  feed_uuid: UUID;
  pub_date: Timestamp;
  excerpt?: string;              // 可选的 50 字摘录
  is_duplicate?: boolean;        // 是否为重复报道（v2.6）
}

// 错误
| code              | message                           |
|-------------------|-----------------------------------|
| AI_NO_API_KEY     | AI API key not configured         |
| TODAY_NO_DATA     | Pipeline has not processed today  |
| TODAY_NOT_READY   | Pipeline is still running         |
```

### 3.3 `get_signal_detail`

### 3.4 `get_dedup_stats`

> v2.6 新增

```typescript
// 调用
const stats = await invoke<DedupStats>("get_dedup_stats");

// 返回类型
interface DedupStats {
  total_checked: number;         // 本次 Pipeline 处理的文章数
  duplicates_found: number;      // 检测到的重复文章数
  groups_merged: number;         // 合并的去重组数
  avg_similarity: number;        // 平均相似度（0.0-1.0）
  last_run: Timestamp;           // 最近一次去重时间
}

// 错误
| code              | message                           |
|-------------------|-----------------------------------|
| DEDUP_NO_DATA     | Pipeline has not processed today  |
```

获取单条 Signal 的完整详情（含所有来源文章）。

```typescript
// 调用
invoke<SignalDetail>("get_signal_detail", { signalId: number });

// 参数
{ signalId: 42 }

// 返回
interface SignalDetail {
  signal: Signal;                // 同上 Signal
  all_sources: SignalSource[];   // 完整来源列表（不截断）
  related_signals?: Signal[];    // 相关 Signal（可选，2.5+）
  topic_context?: TopicBrief;    // 所属 Topic 的简要信息（可选）
}

interface TopicBrief {
  id: number;
  title: string;
  description: string;
  article_count: number;
  status: "active" | "archived" | "merged";
}

// 错误
| code              | message                     |
|-------------------|-----------------------------|
| TODAY_NOT_FOUND   | Signal {id} not found       |
```

---

## 4. 用户反馈接口（2.7）

### 4.1 `submit_feedback`

提交用户对某条 Signal 的反馈。

```typescript
// 调用
invoke<FeedbackResult>("submit_feedback", {
  signalId: number,
  feedbackType: FeedbackType,
  comment?: string
});

// 参数
type FeedbackType = "useful" | "not_relevant" | "follow_topic";

interface FeedbackParams {
  signalId: number;
  feedbackType: FeedbackType;
  comment?: string;              // 可选的文本反馈（2.x 暂不使用，预留）
}

// 返回
interface FeedbackResult {
  recorded: boolean;             // 是否成功记录
  updated_score?: number;        // 更新后的相关性分数（可选）
}

// 错误
| code              | message                          |
|-------------------|----------------------------------|
| TODAY_NOT_FOUND   | Signal {id} not found            |
| FB_INVALID_TYPE   | Invalid feedback type: {type}    |
```

### 4.2 `get_feedback_history`

获取用户的反馈历史（用于 Settings 页面展示）。

```typescript
// 调用
invoke<FeedbackEntry[]>("get_feedback_history", { limit?: number, offset?: number });

// 参数
{ limit?: number, offset?: number }  // 默认 limit=20, offset=0

// 返回
interface FeedbackEntry {
  id: number;
  signal_id: number;
  signal_title: string;
  feedback_type: FeedbackType;
  created_at: Timestamp;
}

// 错误
// 无（始终返回数组，可能为空）
```

---

## 5. Topic 接口（2.9–2.13）

### 5.1 `get_topics`

获取 Topic 列表。

```typescript
// 调用
invoke<TopicItem[]>("get_topics", { status?: string, sort?: string, limit?: number });

// 参数
interface GetTopicsParams {
  status?: "active" | "archived" | "all";  // 默认 "active"
  sort?: "relevance" | "recent" | "article_count";  // 默认 "relevance"
  limit?: number;                // 默认 20，最大 50
}

// 返回
interface TopicItem {
  id: number;
  uuid: UUID;
  title: string;
  description: string;
  status: "active" | "archived" | "merged";
  article_count: number;
  source_count: number;          // 不同来源的数量
  first_seen_at: Timestamp;
  last_updated_at: Timestamp;
  is_following: boolean;         // 用户是否在跟踪此 Topic
}

// 错误
// 无（始终返回数组）
```

### 5.2 `get_topic_detail`

获取 Topic 详情及其关联文章。

```typescript
// 调用
invoke<TopicDetail>("get_topic_detail", { topicId: number });

// 参数
{ topicId: 7 }

// 返回
interface TopicDetail {
  id: number;
  uuid: UUID;
  title: string;
  description: string;
  status: "active" | "archived" | "merged";
  article_count: number;
  source_count: number;
  first_seen_at: Timestamp;
  last_updated_at: Timestamp;
  is_following: boolean;
  recent_changes?: string;       // 近期变化一句话总结
  articles: TopicArticle[];      // 关联文章列表
}

interface TopicArticle {
  article_id: number;
  title: string;
  link: string;
  feed_title: string;
  pub_date: Timestamp;
  relevance_score: number;       // 在此 Topic 内的相关性
  excerpt?: string;              // 50 字摘录
}

// 错误
| code              | message                     |
|-------------------|-----------------------------|
| TOPIC_NOT_FOUND   | Topic {id} not found        |
```

### 5.3 `follow_topic` / `unfollow_topic`

跟踪/取消跟踪 Topic（2.12 Continue Tracking）。

```typescript
// 调用
invoke<void>("follow_topic", { topicId: number });
invoke<void>("unfollow_topic", { topicId: number });

// 参数
{ topicId: 7 }

// 返回
void

// 错误
| code              | message                     |
|-------------------|-----------------------------|
| TOPIC_NOT_FOUND   | Topic {id} not found        |
```

---

## 6. AI 配置接口（2.3+）

### 6.1 `get_ai_config`

获取当前 AI 配置状态（API Key 不返回明文，只返回是否已配置）。

```typescript
// 调用
invoke<AIConfig>("get_ai_config");

// 返回
interface AIConfig {
  has_api_key: boolean;          // 是否已配置 API Key
  model: string;                 // 当前使用的模型
  embedding_model: string;       // 当前 Embedding 模型
  base_url: string;              // 当前 API 端点
  last_pipeline_run?: Timestamp; // 上次 Pipeline 运行时间
  pipeline_status: "idle" | "running" | "error";
}

// 错误
// 无
```

### 6.2 `save_ai_config`

保存 AI 配置（在 Settings 页面使用）。

```typescript
// 调用
invoke<void>("save_ai_config", { config: AIConfigInput });

// 参数
interface AIConfigInput {
  api_key: string;               // API Key 明文（写入 toml 后不在内存保留）
  model?: string;                // 可选，默认 "gpt-4o-mini"
  embedding_model?: string;      // 可选，默认 "text-embedding-3-small"
  base_url?: string;             // 可选，默认 "https://api.openai.com/v1"
}

// 返回
void

// 错误
| code                | message                           |
|---------------------|-----------------------------------|
| CFG_INVALID_KEY     | Invalid API key format            |
| CFG_MISSING_FIELD   | API key is required               |
| AI_API_ERROR        | Failed to validate key: {reason}  |
```

### 6.3 `validate_ai_config`

验证 API Key 是否有效（通过调用 models list 接口测试）。

```typescript
// 调用
invoke<ValidateResult>("validate_ai_config");

// 返回
interface ValidateResult {
  valid: boolean;
  models_available?: string[];   // 可用模型列表
  error?: string;                // 失败原因
}

// 错误
| code              | message                          |
|-------------------|----------------------------------|
| AI_NO_API_KEY     | No API key configured            |
| AI_API_ERROR      | Validation failed: {reason}      |
```

### 6.4 `trigger_pipeline`

手动触发 Pipeline 运行（Settings / 开发调试用）。

```typescript
// 调用
invoke<PipelineResult>("trigger_pipeline", { runType?: string });

// 参数
{ runType?: "full" | "incremental" }  // 默认 "incremental"

// 返回
interface PipelineResult {
  run_id: number;                // pipeline_runs 表的 ID
  started: boolean;
}

// 错误
| code                | message                          |
|---------------------|----------------------------------|
| PL_ALREADY_RUNNING  | Pipeline is already running      |
| AI_NO_API_KEY       | AI API key not configured        |
```

---

## 7. Tauri 事件规范

### 7.1 事件列表

| 事件名 | Payload | 触发时机 | 前端监听方 |
|--------|---------|---------|-----------|
| `feed:sync_progress` | `{ feed_uuid, status, articles_fetched, total_feeds, completed_feeds }` | Pack 安装后逐个源抓取 | Onboarding 页面 |
| `feed:synced` | `{ feed_uuid, article_count }` | 单个源抓取完成 | Local 页面 |
| `pipeline:started` | `{ run_id, run_type }` | Pipeline 开始运行 | Today 页面 |
| `pipeline:progress` | `{ run_id, stage, current, total }` | Pipeline 处理进度 | Today 页面 |
| `pipeline:completed` | `{ run_id, signals_generated, topics_updated }` | Pipeline 完成 | Today 页面 |
| `pipeline:failed` | `{ run_id, error_code, error_message }` | Pipeline 失败 | Today 页面 |
| `ai:stream` | `{ request_id, content, done }` | LLM 流式输出 | Ask/详情页 |
| `ai:config_changed` | `{}` | AI 配置更新 | Settings 页面 |

### 7.2 Pipeline 进度阶段

```typescript
type PipelineStage =
  | "fetching_articles"    // 提取未处理文章
  | "generating_embeddings" // 生成向量
  | "deduplicating"        // 去重检测 + 信息密度评估（v2.6）
  | "clustering"           // 增量聚类
  | "generating_summaries" // 生成摘要
  | "generating_wim"       // 生成 Why It Matters
  | "ranking"              // 排序
  | "storing_results"      // 存储结果
  | "completed"            // 完成
  | "failed";              // 失败
```

### 7.3 前端监听示例

```typescript
import { listen } from '@tauri-apps/api/event';

// Today 页面监听 Pipeline 状态
listen('pipeline:started', (event) => {
  store.setState({ pipelineRunning: true });
});

listen('pipeline:progress', (event) => {
  const { stage, current, total } = event.payload;
  store.setState({ pipelineStage: stage, pipelineProgress: current / total });
});

listen('pipeline:completed', (event) => {
  const { signals_generated } = event.payload;
  refreshTodaySignals();
  store.setState({ pipelineRunning: false });
});

listen('pipeline:failed', (event) => {
  const { error_message } = event.payload;
  showToast(`Pipeline failed: ${error_message}`);
  store.setState({ pipelineRunning: false });
});
```

---

## 8. 与版本的对应关系

| 版本 | 新增 IPC 命令 | 新增事件 |
|------|-------------|---------|
| 2.1 | `get_starter_packs`, `preview_pack`, `install_pack` | `feed:sync_progress` |
| 2.2 | `get_today_overview` | — |
| 2.3 | `get_today_signals`, `get_ai_config`, `save_ai_config`, `validate_ai_config`, `trigger_pipeline` | `pipeline:*` |
| 2.4 | — (复用 get_today_signals) | — |
| 2.5 | `get_signal_detail` | — |
| 2.6 | `get_dedup_stats` | `pipeline:progress` 增加 `deduplicating` 阶段 |
| 2.7 | `submit_feedback`, `get_feedback_history` | — |
| 2.9 | `get_topics`, `get_topic_detail` | — |
| 2.12 | `follow_topic`, `unfollow_topic` | — |
