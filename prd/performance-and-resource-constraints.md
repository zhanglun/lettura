# Lettura 性能约束与资源规划

> 定义关键性能指标、数据量上限、资源消耗约束，以及开发时需要遵守的硬限制。

---

## 1. Pipeline 性能指标

### 1.1 目标延迟

| 操作 | 目标 | 最大容忍 | 测量方式 |
|------|------|---------|---------|
| 100 篇文章完整 Pipeline | < 3 分钟 | < 5 分钟 | pipeline_runs.finished_at - started_at |
| Embedding 批次 (32 篇) | < 10 秒 | < 30 秒 | API 调用耗时 |
| LLM 批次 (5 篇 summary) | < 30 秒 | < 60 秒 | API 调用耗时 |
| 增量聚类 (100 篇) | < 5 秒 | < 15 秒 | 内存计算耗时 |
| Today Overview 生成 | < 10 秒 | < 20 秒 | API 调用耗时 |

### 1.2 并发限制

```rust
// Pipeline 内部并发控制
const MAX_EMBEDDING_CONCURRENCY: usize = 3;  // 最多 3 个并发 Embedding 请求
const MAX_LLM_CONCURRENCY: usize = 2;        // 最多 2 个并发 LLM 请求
const EMBEDDING_BATCH_SIZE: usize = 32;       // 每批 32 篇
const LLM_BATCH_SIZE: usize = 5;             // 每批 5 篇
```

### 1.3 超时设置

```rust
const API_TIMEOUT: Duration = Duration::from_secs(30);      // 单次 API 调用
const PIPELINE_TIMEOUT: Duration = Duration::from_secs(600); // Pipeline 总超时 10 分钟
const FEED_FETCH_TIMEOUT: Duration = Duration::from_secs(15); // 单个 Feed 抓取
```

---

## 2. 数据量约束

### 2.1 SQLite 上限

| 指标 | 目标 | 硬限制 | 超过后的处理 |
|------|------|-------|------------|
| articles 总量 | < 100K | 500K | 自动清理 > 180 天的已读非星标文章 |
| sqlite-vec 向量数 | < 200K | 1M | 增量聚类时只保留近 90 天向量 |
| topics 活跃数 | < 500 | 2000 | 自动归档 60 天无新文章的 Topic |
| article_ai_analysis | < 100K | 500K | 跟随 articles 清理 |
| pipeline_runs 记录 | < 1000 | 5000 | 只保留最近 30 天的运行记录 |

### 2.2 向量搜索性能

| 操作 | 数据量 | 目标延迟 |
|------|-------|---------|
| 增量 centroid 匹配 | 1 新向量 vs 500 centroids | < 50ms |
| 相似度搜索 (去重) | 1 向量 vs 10K 向量 | < 100ms |
| 全量重聚类 (HDBSCAN) | 10K 向量 | < 30s |

### 2.3 前端数据量

| 指标 | 限制 |
|------|------|
| Today Signals 加载 | 最多 10 条，默认 5 |
| Topic 列表加载 | 分页，每页 20 |
| Topic 详情关联文章 | 分页，每页 20 |
| 来源文章展开 | 最多 10 条预览，"查看全部" 跳转 |

---

## 3. 内存约束

### 3.1 Rust 后端

| 场景 | 内存上限 | 说明 |
|------|---------|------|
| 空闲状态 | < 50MB | 基础 Tauri + Diesel |
| Pipeline 运行中 | < 200MB | 向量计算 + 批量文本处理 |
| Feed 批量抓取 | < 100MB | 10 并发抓取 |
| 全量重聚类 | < 300MB | ndarray + HDBSCAN |

### 3.2 前端

| 场景 | 内存上限 |
|------|---------|
| Today 页面 | < 30MB |
| Topic 列表 | < 20MB |
| Pipeline 进度动画 | 不引起 GC 抖动 |

---

## 4. API 成本约束

### 4.1 单次 Pipeline 成本（100 篇新文章）

| 步骤 | 模型 | Token 用量 | 成本 |
|------|------|-----------|------|
| Embedding (4×32) | text-embedding-3-small | ~200K | ~$0.008 |
| Summary (20×5) | gpt-4o-mini | ~30K in + 5K out | ~$0.01 |
| WIM (2×5) | gpt-4o-mini | ~15K in + 3K out | ~$0.005 |
| Overview | gpt-4o-mini | ~2K in + 0.2K out | ~$0.001 |
| **总计** | | | **~$0.025/run** |

### 4.2 月度成本估算

| 场景 | 日均文章 | 日均成本 | 月度成本 |
|------|---------|---------|---------|
| 轻度使用 | 50 篇 | $0.015 | ~$0.45 |
| 中度使用 | 100 篇 | $0.025 | ~$0.75 |
| 重度使用 | 300 篇 | $0.075 | ~$2.25 |

### 4.3 成本保护

```rust
// 每日 API 调用预算上限
const DAILY_EMBEDDING_BUDGET: usize = 100_000; // tokens
const DAILY_LLM_BUDGET: usize = 500_000;       // tokens

// 超过预算后停止 Pipeline，明日恢复
```

---

## 5. 磁盘空间

### 5.1 预期增长

| 数据类型 | 每篇大小 | 100 篇/天 × 90 天 |
|---------|---------|-------------------|
| articles 表 | ~5KB | ~45MB |
| embeddings (1536维 float32) | 6KB | ~54MB |
| article_ai_analysis | ~1KB | ~9MB |
| **总计** | | **~108MB / 90天** |

### 5.2 清理策略

- 自动：每 30 天清理 > 180 天的已读非星标文章
- 手动：Settings 中提供 "清除缓存" 按钮
- 向量：跟随文章清理同步删除对应向量

---

## 6. 性能监控

### 6.1 关键指标 (Pipeline)

```sql
-- 查看最近 Pipeline 运行耗时
SELECT run_type, status,
       (strftime('%s', finished_at) - strftime('%s', started_at)) as duration_sec,
       articles_processed
FROM pipeline_runs
ORDER BY started_at DESC
LIMIT 10;
```

### 6.2 数据量监控

```sql
-- 查看各表数据量
SELECT 'articles' as tbl, COUNT(*) as cnt FROM articles
UNION ALL SELECT 'article_ai_analysis', COUNT(*) FROM article_ai_analysis
UNION ALL SELECT 'topics', COUNT(*) FROM topics
UNION ALL SELECT 'sources', COUNT(*) FROM sources;
```
