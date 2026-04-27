# Lettura 数据迁移脚本 & 测试策略 & 开发环境指南

> 合并文档，覆盖：数据库迁移脚本模板、测试策略、开发环境配置。

---

# Part A: 数据库迁移脚本模板

## 1. 迁移文件命名规范

```
apps/desktop/src-tauri/migrations/
  2026-01-29-000001_add_performance_indexes/    # 现有
  2026-05-01-000002_create_sources_table/       # 2.1
  2026-05-01-000003_create_article_ai_analysis/ # 2.3
  2026-05-01-000004_create_pipeline_runs/       # 2.3
  2026-06-01-000005_create_topics_tables/       # 2.9
  2026-06-01-000006_create_user_feedback/       # 2.7 (提前到 2.7)
```

格式：`YYYY-MM-DD-NNNNNN_descriptive_name/up.sql` + `down.sql`

## 2. 2.1 迁移：sources 表

```sql
-- up.sql
CREATE TABLE sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    feed_url TEXT NOT NULL,
    title TEXT,
    site_url TEXT,
    source_type TEXT NOT NULL CHECK(source_type IN ('starter_pack', 'user', 'opml_import')),
    pack_id TEXT,
    language TEXT NOT NULL DEFAULT 'en',
    quality_score REAL NOT NULL DEFAULT 0.5,
    weight REAL NOT NULL DEFAULT 1.0,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    create_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sources_source_type ON sources(source_type);
CREATE INDEX idx_sources_pack_id ON sources(pack_id);
CREATE INDEX idx_sources_feed_url ON sources(feed_url);

-- 在 feeds 表新增 source_id 外键列（关联 sources 表）
ALTER TABLE feeds ADD COLUMN source_id INTEGER REFERENCES sources(id) ON DELETE SET NULL;

CREATE INDEX idx_feeds_source_id ON feeds(source_id);
```

```sql
-- down.sql
DROP INDEX IF EXISTS idx_feeds_source_id;
-- SQLite 不支持 DROP COLUMN，但 Diesel 迁移时可以用新表重建
-- 实际回滚策略：删除 sources 表即可，source_id 列可保留（nullable）
DROP TABLE IF EXISTS sources;
```

## 3. 2.3 迁移：article_ai_analysis + pipeline_runs

```sql
-- up.sql
CREATE TABLE article_ai_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    summary TEXT,
    why_it_matters TEXT,
    relevance_score REAL,
    topic_id INTEGER,
    embedding_id INTEGER,
    ai_processed_at TIMESTAMP,
    model_version TEXT,
    create_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id)
);

CREATE INDEX idx_ai_analysis_article ON article_ai_analysis(article_id);
CREATE INDEX idx_ai_analysis_topic ON article_ai_analysis(topic_id);
CREATE INDEX idx_ai_analysis_score ON article_ai_analysis(relevance_score);

CREATE TABLE pipeline_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_type TEXT NOT NULL CHECK(run_type IN ('full', 'incremental', 'single_article')),
    status TEXT NOT NULL CHECK(status IN ('running', 'completed', 'failed')),
    articles_processed INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP NOT NULL,
    finished_at TIMESTAMP,
    create_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pipeline_runs_status ON pipeline_runs(status);
CREATE INDEX idx_pipeline_runs_started ON pipeline_runs(started_at);
```

```sql
-- down.sql
DROP TABLE IF EXISTS pipeline_runs;
DROP TABLE IF EXISTS article_ai_analysis;
```

## 4. 2.9 迁移：topics + topic_articles

```sql
-- up.sql
CREATE TABLE topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived', 'merged')),
    article_count INTEGER NOT NULL DEFAULT 0,
    source_count INTEGER NOT NULL DEFAULT 0,
    first_seen_at TIMESTAMP,
    last_updated_at TIMESTAMP,
    create_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_topics_status ON topics(status);
CREATE INDEX idx_topics_updated ON topics(last_updated_at);

CREATE TABLE topic_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    relevance_score REAL,
    create_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(topic_id, article_id)
);

CREATE INDEX idx_topic_articles_topic ON topic_articles(topic_id);
CREATE INDEX idx_topic_articles_article ON topic_articles(article_id);
```

```sql
-- down.sql
DROP TABLE IF EXISTS topic_articles;
DROP TABLE IF EXISTS topics;
```

## 5. 2.7 迁移：user_feedback

```sql
-- up.sql
CREATE TABLE user_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    signal_id INTEGER NOT NULL REFERENCES article_ai_analysis(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL CHECK(feedback_type IN ('useful', 'not_relevant', 'follow_topic')),
    comment TEXT,
    create_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_signal ON user_feedback(signal_id);
CREATE INDEX idx_feedback_type ON user_feedback(feedback_type);
```

```sql
-- down.sql
DROP TABLE IF EXISTS user_feedback;
```

## 6. 迁移原则

- 每个 minor 对应一个迁移目录
- 只加不改：不 ALTER 现有表结构
- 新增列必须有 DEFAULT
- 所有 CHECK 约束在迁移中定义
- ON DELETE CASCADE 确保级联清理
- down.sql 必须可回滚

---

# Part B: 测试策略

## 1. Rust 后端测试

### 1.1 AI 模块测试

```rust
// ai/embedding.rs 测试
#[cfg(test)]
mod tests {
    use super::*;

    // Mock Embedding Provider（不调用真实 API）
    struct MockEmbedding;
    impl EmbeddingProvider for MockEmbedding {
        async fn embed(&self, texts: Vec<&str>) -> Result<Vec<Vec<f32>>> {
            Ok(texts.iter().map(|_| vec![0.1; 1536]).collect())
        }
        fn dimension(&self) -> usize { 1536 }
    }

    #[tokio::test]
    async fn test_embed_returns_correct_dimension() {
        let provider = MockEmbedding;
        let result = provider.embed(vec!["test"]).await.unwrap();
        assert_eq!(result[0].len(), 1536);
    }

    #[tokio::test]
    async fn test_embed_batch_size() {
        let provider = MockEmbedding;
        let texts: Vec<&str> = (0..32).map(|_| "test").collect();
        let result = provider.embed(texts).await.unwrap();
        assert_eq!(result.len(), 32);
    }
}
```

### 1.2 Pipeline 测试

```rust
// ai/pipeline.rs 测试
#[tokio::test]
async fn test_pipeline_processes_unprocessed_articles() {
    // 使用内存 SQLite 数据库
    let conn = establish_test_connection();
    insert_test_articles(&conn, 5);
    // 运行 Pipeline（使用 Mock Provider）
    let result = run_pipeline(&conn, &mock_provider).await;
    assert!(result.is_ok());
    // 验证 article_ai_analysis 记录已创建
    let count: i64 = conn.query_one("SELECT COUNT(*) FROM article_ai_analysis").unwrap();
    assert_eq!(count, 5);
}

#[tokio::test]
async fn test_pipeline_skips_already_processed() {
    let conn = establish_test_connection();
    insert_test_articles(&conn, 5);
    mark_as_processed(&conn, &[1, 2, 3]);
    let result = run_pipeline(&conn, &mock_provider).await;
    // 只处理 2 篇未处理的
    let count: i64 = conn.query_one("SELECT COUNT(*) FROM article_ai_analysis").unwrap();
    assert_eq!(count, 2);
}
```

### 1.3 Source 模块测试

```rust
#[test]
fn test_load_starter_pack_from_json() {
    let pack = load_pack("ai").unwrap();
    assert_eq!(pack.id, "ai");
    assert!(!pack.sources.is_empty());
    assert!(pack.sources.len() >= 10);
}

#[test]
fn test_all_packs_loadable() {
    for pack_id in &["ai", "developer", "startup", "product", "design", "science", "business", "tech-news"] {
        let pack = load_pack(pack_id);
        assert!(pack.is_ok(), "Failed to load pack: {}", pack_id);
    }
}
```

### 1.4 集成测试

```rust
// tests/pipeline_integration.rs
#[tokio::test]
async fn test_full_pipeline_with_mock_api() {
    // 使用 Mock API + 内存数据库
    // 验证完整 Pipeline: embed → cluster → summarize → rank → store
}
```

## 2. 前端测试

### 2.1 Store 测试

```typescript
// stores/__tests__/todaySlice.test.ts
describe('todaySlice', () => {
  it('should set loading state when fetching signals', () => {
    const store = createTestStore();
    store.getState().today.setLoading(true);
    expect(store.getState().today.loading).toBe(true);
  });

  it('should update signals after successful fetch', async () => {
    const store = createTestStore();
    mockInvoke('get_today_signals', mockSignals);
    await store.getState().today.fetchSignals();
    expect(store.getState().today.signals).toHaveLength(5);
  });
});
```

### 2.2 组件测试

```typescript
// layout/Intelligence/__tests__/SignalCard.test.tsx
describe('SignalCard', () => {
  it('renders signal title and summary', () => {
    render(<SignalCard signal={mockSignal} />);
    expect(screen.getByText(mockSignal.title)).toBeInTheDocument();
    expect(screen.getByText(mockSignal.summary)).toBeInTheDocument();
  });

  it('expands WIM on click', async () => {
    render(<SignalCard signal={mockSignal} />);
    fireEvent.click(screen.getByText(/Why/i));
    expect(screen.getByText(mockSignal.why_it_matters)).toBeVisible();
  });

  it('calls submit_feedback on useful click', async () => {
    const onSubmit = vi.fn();
    render(<SignalCard signal={mockSignal} onFeedback={onSubmit} />);
    fireEvent.click(screen.getByText('Useful'));
    expect(onSubmit).toHaveBeenCalledWith(mockSignal.id, 'useful');
  });
});
```

### 2.3 Mock 配置

```typescript
// __tests__/setup.ts 中补充 AI 相关 Mock
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn((cmd: string, args?: any) => {
    switch (cmd) {
      case 'get_today_signals': return Promise.resolve(mockSignals);
      case 'get_today_overview': return Promise.resolve(mockOverview);
      case 'get_starter_packs': return Promise.resolve(mockPacks);
      default: return Promise.resolve(null);
    }
  }),
}));
```

## 3. 测试覆盖目标

| 模块 | 目标覆盖率 | 优先级 |
|------|-----------|-------|
| ai/pipeline.rs | > 80% | 高 |
| ai/embedding.rs | > 80% | 高 |
| ai/summary.rs | > 70% | 高 |
| sources/starter_pack.rs | > 90% | 高 |
| todaySlice | > 80% | 高 |
| SignalCard | > 70% | 中 |
| Onboarding | > 60% | 中 |

---

# Part C: 开发环境配置指南

## 1. AI 开发环境

### 1.1 获取 API Key

1. 访问 https://platform.openai.com/api-keys
2. 创建新的 API Key
3. 确保 account 有余额（最低 $5 即可开始）

### 1.2 配置 Lettura

编辑 `~/.lettura/lettura.toml`（开发模式下为项目根目录的 `lettura.toml`）：

```toml
# AI 配置
[ai]
api_key = "sk-..."
model = "gpt-4o-mini"
embedding_model = "text-embedding-3-small"
base_url = "https://api.openai.com/v1"
```

### 1.3 使用 Ollama 替代（可选）

```toml
[ai]
api_key = "ollama"           # Ollama 不需要真实 key
model = "llama3.2"
embedding_model = "nomic-embed-text"
base_url = "http://localhost:11434/v1"
```

启动 Ollama：
```bash
ollama pull llama3.2
ollama pull nomic-embed-text
ollama serve
```

### 1.4 环境变量（开发模式）

```bash
# 开发模式下使用本地配置
export LETTURA_ENV=dev
# 这会让 Rust 读取项目目录下的 .env 文件
```

`.env` 文件（不提交到 git）：
```
DATABASE_URL=~/.lettura/lettura.db
LETTURA_ENV=dev
```

## 2. 新增依赖安装

### 2.1 Rust 依赖

```bash
# 在 apps/desktop/src-tauri/ 目录下
cargo build  # Cargo.toml 添加 async-openai 后自动安装
```

### 2.2 sqlite-vec 编译（2.6+ 需要）

```bash
# sqlite-vec 需要 C 编译器
# macOS: Xcode Command Line Tools (xcode-select --install)
# 然后通过 rusqlite 的 bundled feature 编译
```

## 3. 开发工作流

### 3.1 启动开发环境

```bash
# 终端 1: 前端开发
pnpm dev

# 终端 2: Tauri 桌面端 (完整开发)
pnpm tauri dev

# 终端 3: Rust 测试
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml -- --nocapture

# 终端 4: 前端测试
pnpm test -- --watch
```

### 3.2 测试 AI Pipeline

```bash
# 使用 trigger_pipeline 命令手动触发
# 在 Tauri dev console 或通过前端 Settings 页面
```

### 3.3 调试 AI 输出

```bash
# 开启 debug 日志
export RUST_LOG=lettura::ai=debug,lettura::pipeline=debug
pnpm tauri dev
```

## 4. 常见问题

| 问题 | 原因 | 解决 |
|------|------|------|
| Pipeline 不运行 | 未配置 API Key | 编辑 lettura.toml |
| API 调用 401 | Key 无效 | 重新生成 Key |
| API 调用 429 | 限流 | 等待或升级 plan |
| Embedding 维度不匹配 | 模型切换后向量维度变了 | 清除 ai_analysis 表重新 Pipeline |
| sqlite-vec 编译失败 | 缺少 C 编译器 | 安装 xcode-select |
| 前端看不到 Today | 路由未更新 | 检查 config.ts 路由定义 |
