# Lettura AI Prompt 设计规范

> 定义 Summary、Why It Matters、Today Overview 三个核心 AI 输出的 Prompt 模板、输出格式约束和示例。

---

## 1. 设计原则

1. **输出结构化**：所有 AI 输出必须是可解析的结构，不允许自由散文
2. **长度严格控制**：每个输出都有明确的字数上限
3. **语言一致性**：输出语言跟随输入内容的主体语言（中英文混合时以英文为主）
4. **避免幻觉**：每条结论必须可追溯到源文章，不允许推测或虚构
5. **口吻约束**：客观、专业、简洁，不使用感叹号、不使用"令人兴奋"、"革命性"等夸张表达

---

## 2. Summary（文章摘要）

### 2.1 用途

为每篇新入库的文章生成一句话摘要，存储在 `article_ai_analysis.summary`。

### 2.2 Prompt 模板

```
You are a precise content analyst. Summarize the following article in ONE sentence.

Rules:
- Maximum 50 words in English, 80 characters in Chinese
- State the main point directly, not "this article discusses..."
- Use factual language, no superlatives
- If the article is about a product/tool, include its name
- If the article contains quantitative findings, include the key number

Article title: {title}
Article content: {content_truncated}

Output the summary directly, no prefix, no quotes.
```

### 2.3 输出格式

```typescript
// 单行文本，无前缀
// 英文: ≤50 words
// 中文: ≤80 字

type Summary = string;
```

### 2.4 示例

**输入：**
```
Title: GPT-4o mini: advancing cost-efficient intelligence
Content: [OpenAI announces GPT-4o mini, their most cost-efficient small model...]
```

**输出：**
```
OpenAI released GPT-4o mini, a small model that matches GPT-4 class performance at 60% lower cost, available through the API immediately.
```

**反例（不合格）：**
```
❌ This article discusses OpenAI's new GPT-4o mini model release. (用了 "this article discusses")
❌ An exciting new model that will revolutionize AI! (夸张表达)
❌ GPT-4o mini is a small model. It costs less. It is available now. (多句，非一句话)
```

---

## 3. Why It Matters（为什么重要）

### 3.1 用途

为每条 Top Signal 生成"为什么重要"的解释，存储在 `article_ai_analysis.why_it_matters`。

### 3.2 Prompt 模板

```
You are an intelligence analyst explaining why a piece of information matters to a technical professional.

Given this summary and its context, explain WHY this matters in 2-3 sentences.

Rules:
- Maximum 80 words in English, 120 characters in Chinese
- Explain concrete implications, not abstract value
- If this relates to a broader trend, name the trend
- If this affects developer workflows or tool choices, say so specifically
- Do NOT say "this is important because it could..." — be direct
- Use second person sparingly; prefer third person or passive voice

Summary: {summary}
Source count: {source_count} articles from {feed_count} different sources
Related topic: {topic_title} (if any)
Recent context: {topic_description} (if any)

Output the explanation directly, no prefix, no quotes.
```

### 3.3 输出格式

```typescript
// 2-3 句话，无前缀
// 英文: ≤80 words
// 中文: ≤120 字

type WhyItMatters = string;
```

### 3.4 示例

**输入：**
```
Summary: Multiple sources report AI coding assistants are shifting from autocomplete to agentic workflows, with tools like Cursor, Copilot Workspace, and Devin all releasing autonomous execution features.
Source count: 7 articles from 5 sources
Related topic: AI Coding Tools
```

**输出：**
```
The shift from autocomplete to autonomous agents represents a fundamental change in how developers interact with code. Tools that can independently execute multi-step tasks will likely replace current IDE plugins within 12-18 months. Developers should evaluate agentic tools now to understand how they change review and debugging workflows.
```

**反例：**
```
❌ This is important because AI is transforming software development. (太抽象)
❌ Users should be excited about this development! (主观评价)
❌ AI coding tools are getting better. (没有说为什么重要)
```

---

## 4. Today Overview（今日概览）

### 4.1 用途

为 Today 页面顶部生成一句话概览，不存储在数据库，每次请求时实时生成。

### 4.2 Prompt 模板

```
You are generating a daily intelligence briefing overview for a technical professional.

Given today's top signals, write ONE sentence that summarizes the overall information landscape.

Rules:
- Maximum 40 words in English, 60 characters in Chinese
- Mention the 2-3 most prominent themes
- Use concrete topic names, not "several topics"
- Do not use "today" or "in today's news" — the context is implied
- Tone: calm, informative, no urgency

Top signals:
{signal_1_title}: {signal_1_summary}
{signal_2_title}: {signal_2_summary}
...
{signal_n_title}: {signal_n_summary}

Output the overview directly, no prefix, no quotes.
```

### 4.3 输出格式

```typescript
// 一句话，无前缀
// 英文: ≤40 words
// 中文: ≤60 字

type TodayOverview = string;
```

### 4.4 示例

**输入：**
```
Top signals:
1. AI Coding Goes Agentic: Multiple sources report AI coding assistants shifting to autonomous workflows
2. Tauri 2.0 Stable Released: Tauri v2 brings mobile support and plugin ecosystem improvements
3. Browser Agents on the Rise: Three new browser automation tools launched this week
```

**输出：**
```
AI coding tools are moving toward autonomous agent workflows, while Tauri 2.0's stable release and new browser automation tools signal maturing desktop and web agent ecosystems.
```

---

## 5. Signal 标题生成

### 5.1 用途

为聚类后的文章组生成一个 Signal 级标题（区别于单篇文章标题）。

### 5.2 Prompt 模板

```
You are generating a title for a group of related articles about the same topic.

Rules:
- Maximum 12 words in English, 20 characters in Chinese
- Title case for English
- Be specific: include product names, version numbers, or technology names when available
- Do not use vague words like "update", "news", "development" alone
- If the articles describe a trend, name the trend direction

Article titles in this group:
- {title_1}
- {title_2}
- {title_3}

Output the title directly, no prefix, no quotes, no period.
```

### 5.3 示例

**输入：**
```
- GPT-4o mini announced with 60% cost reduction
- OpenAI's new small model matches GPT-4 quality
- GPT-4o mini available in API starting today
```

**输出：**
```
OpenAI Launches GPT-4o Mini at 60% Lower Cost
```

---

## 6. Topic 描述生成

### 6.1 用途

为新建的 Topic 生成一句话描述，存储在 `topics.description`。

### 6.2 Prompt 模板

```
You are writing a one-line description for a topic that groups related articles.

Rules:
- Maximum 30 words in English, 50 characters in Chinese
- Define what this topic covers, not what it might cover
- Use present tense
- Be factual, not promotional

Topic title: {topic_title}
Sample articles:
- {title_1}: {summary_1}
- {title_2}: {summary_2}

Output the description directly, no prefix, no quotes.
```

### 6.3 示例

**输入：**
```
Topic title: AI Coding Tools
Sample articles:
- Copilot Workspace adds autonomous task execution
- Cursor releases multi-file editing agent
- Devin launches general-purpose coding agent
```

**输出：**
```
AI-powered developer tools that assist with or autonomously execute coding tasks, including code generation, review, debugging, and multi-file refactoring.
```

---

## 7. 批量调用策略

### 7.1 批量处理规则

| Prompt 类型 | 批量大小 | 并发限制 | 超时 |
|------------|---------|---------|------|
| Summary | 每批 5 篇 | 3 并发 | 30s/batch |
| Why It Matters | 每批 5 条 | 2 并发 | 45s/batch |
| Today Overview | 1 次 | 1 并发 | 15s |
| Signal 标题 | 每批 10 条 | 2 并发 | 20s/batch |
| Topic 描述 | 每批 5 条 | 2 并发 | 20s/batch |

### 7.2 降级策略

```
Pipeline 中 AI 调用失败时:
├── Summary 失败 → 标记 article_ai_analysis.summary = NULL, AI 继续
├── Why It Matters 失败 → 使用 Summary 作为降级文案
├── Today Overview 失败 → 前端显示 "{article_count} 篇新文章，{signal_count} 条 Signal"
├── Signal 标题失败 → 使用最相关文章的标题
└── Topic 描述失败 → 使用 Topic 标题作为描述
```

### 7.3 输出质量校验

每次 AI 输出后，执行以下校验：

```rust
fn validate_summary(text: &str) -> bool {
    let word_count = text.split_whitespace().count();
    word_count > 0 && word_count <= 60 // 留 20% 宽容度
}

fn validate_why_it_matters(text: &str) -> bool {
    let sentence_count = text.matches('.').count();
    let word_count = text.split_whitespace().count();
    sentence_count >= 2 && sentence_count <= 4 && word_count <= 100
}

fn validate_overview(text: &str) -> bool {
    let word_count = text.split_whitespace().count();
    word_count > 5 && word_count <= 50
}
```

校验失败则重试一次，仍然失败则使用降级文案。

---

## 8. 成本估算

### 8.1 单次 Pipeline 运行（100 篇新文章）

| 步骤 | 调用次数 | 模型 | Token 估算 | 成本估算 |
|------|---------|------|-----------|---------|
| Summary | 20 batches × 5 | gpt-4o-mini | ~30K input + 5K output | ~$0.01 |
| Embedding | 4 batches × 25 | text-embedding-3-small | ~50K tokens | ~$0.003 |
| WIM | 2 batches × 5 | gpt-4o-mini | ~15K input + 3K output | ~$0.005 |
| Overview | 1 | gpt-4o-mini | ~2K input + 200 output | ~$0.001 |
| **总计** | | | | **~$0.02/run** |

### 8.2 月度估算

- 假设日均 100 篇新文章，每日 1 次 Pipeline
- 月度 API 成本：~$0.60/月
- 加上 Embedding：~$0.70/月

这个成本在 BYOK 模式下完全由用户承担，且非常低。

---

## 9. 与版本的对应关系

| 版本 | 启用的 Prompt |
|------|-------------|
| 2.3 | Summary |
| 2.4 | Why It Matters + Signal 标题 |
| 2.8 | Today Overview |
| 2.9 | Topic 描述 |
