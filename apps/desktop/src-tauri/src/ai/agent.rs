//! Local Q&A agent.
//!
//! Implements a ReAct loop: the LLM decides which tools to call, we execute
//! them against the existing pipeline/topic functions, feed results back, and
//! repeat until the LLM produces a final text answer (or we hit the iteration
//! cap). Tools are thin wrappers over functions already in the codebase — no
//! business logic is duplicated.

use async_openai::types::chat::ChatCompletionTools;
use async_trait::async_trait;
use serde::Serialize;

use super::llm::{function_tool, ChatMessage, LlmResponse, LLMProvider};
use super::{pipeline, topic};

/// Maximum number of LLM round-trips before we give up.
const MAX_ITERATIONS: usize = 6;

#[derive(Debug)]
pub enum AgentError {
  MaxIterations,
  LlmError(String),
}

impl std::fmt::Display for AgentError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      AgentError::MaxIterations => write!(f, "Agent reached max iterations ({MAX_ITERATIONS}) without a final answer"),
      AgentError::LlmError(e) => write!(f, "LLM error: {e}"),
    }
  }
}

/// Result returned by a successful agent run.
#[derive(Debug, Serialize)]
pub struct AgentResult {
  pub answer: String,
  /// Names + arguments of every tool call made during this run, for UI display.
  pub tool_calls_made: Vec<ToolCallRecord>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ToolCallRecord {
  pub name: String,
  pub args: String,
}

// ---------------------------------------------------------------------------
// Tool trait + registry
// ---------------------------------------------------------------------------

/// A single tool the agent can invoke.
#[async_trait]
pub trait AgentTool: Send + Sync {
  fn name(&self) -> &str;
  fn description(&self) -> &str;
  /// JSON Schema describing the tool's parameters.
  fn parameters(&self) -> serde_json::Value;
  async fn execute(&self, args: serde_json::Value) -> Result<String, String>;
}

pub struct ToolRegistry {
  tools: Vec<Box<dyn AgentTool>>,
}

impl ToolRegistry {
  pub fn new() -> Self {
    Self { tools: Vec::new() }
  }

  pub fn register(&mut self, tool: Box<dyn AgentTool>) {
    self.tools.push(tool);
  }

  /// Produce the `tools` array to send to the OpenAI API.
  pub fn definitions(&self) -> Vec<ChatCompletionTools> {
    self
      .tools
      .iter()
      .map(|t| function_tool(t.name(), t.description(), t.parameters()))
      .collect()
  }

  /// Execute a tool by name. `args_json` is the raw string from the LLM.
  pub async fn execute(&self, name: &str, args_json: &str) -> Result<String, String> {
    let args: serde_json::Value = if args_json.trim().is_empty() {
      serde_json::Value::Object(serde_json::Map::new())
    } else {
      serde_json::from_str(args_json).unwrap_or(serde_json::Value::Null)
    };

    let tool = self
      .tools
      .iter()
      .find(|t| t.name() == name)
      .ok_or_else(|| format!("Unknown tool: {name}"))?;

    tool.execute(args).await
  }
}

impl Default for ToolRegistry {
  fn default() -> Self {
    Self::new()
  }
}

// ---------------------------------------------------------------------------
// Built-in tools — each wraps an existing pipeline/topic function
// ---------------------------------------------------------------------------

/// Truncate a string to at most `max` bytes without splitting a UTF-8
/// character. This avoids panics when the content contains multi-byte chars
/// (e.g. Chinese text) and the byte boundary lands mid-character.
fn truncate_json(value: &str, max: usize) -> String {
  if value.len() <= max {
    value.to_string()
  } else {
    let mut end = max;
    while end > 0 && !value.is_char_boundary(end) {
      end -= 1;
    }
    format!("{}... (truncated)", &value[..end])
  }
}

/// `search_signals(query)` → full-text search over signal titles + summaries.
pub struct SearchSignalsTool;

#[async_trait]
impl AgentTool for SearchSignalsTool {
  fn name(&self) -> &str {
    "search_signals"
  }
  fn description(&self) -> &str {
    "Search analyzed Signals (news digests) by keyword. Returns matching signal titles, summaries, and relevance scores."
  }
  fn parameters(&self) -> serde_json::Value {
    serde_json::json!({
      "type": "object",
      "properties": {
        "query": { "type": "string", "description": "Search keyword or phrase" }
      },
      "required": ["query"]
    })
  }
  async fn execute(&self, args: serde_json::Value) -> Result<String, String> {
    let query = args
      .get("query")
      .and_then(|v| v.as_str())
      .ok_or("missing 'query' parameter")?;
    let conn = &mut crate::db::establish_connection();
    let results = pipeline::search_signals(conn, query)?;
    let json = serde_json::to_string(&results).unwrap_or_else(|_| "[]".to_string());
    Ok(truncate_json(&json, 8000))
  }
}

/// `get_today_signals(limit?)` → top signals by relevance score.
pub struct GetTodaySignalsTool;

#[async_trait]
impl AgentTool for GetTodaySignalsTool {
  fn name(&self) -> &str {
    "get_today_signals"
  }
  fn description(&self) -> &str {
    "Get today's top Signals (highest relevance). Each Signal includes a title, summary, why-it-matters, and sources. Defaults to 5, max 10."
  }
  fn parameters(&self) -> serde_json::Value {
    serde_json::json!({
      "type": "object",
      "properties": {
        "limit": { "type": "integer", "description": "Number of signals to return (1-10)", "default": 5 }
      }
    })
  }
  async fn execute(&self, args: serde_json::Value) -> Result<String, String> {
    let limit = args
      .get("limit")
      .and_then(|v| v.as_i64())
      .unwrap_or(5) as i32;
    let conn = &mut crate::db::establish_connection();
    let results = pipeline::get_today_signals(conn, limit)?;
    let json = serde_json::to_string(&results).unwrap_or_else(|_| "[]".to_string());
    Ok(truncate_json(&json, 8000))
  }
}

/// `get_signal_detail(signal_id)` → full signal with all sources.
pub struct GetSignalDetailTool;

#[async_trait]
impl AgentTool for GetSignalDetailTool {
  fn name(&self) -> &str {
    "get_signal_detail"
  }
  fn description(&self) -> &str {
    "Get full details of a specific Signal by its ID, including the complete list of source articles."
  }
  fn parameters(&self) -> serde_json::Value {
    serde_json::json!({
      "type": "object",
      "properties": {
        "signal_id": { "type": "integer", "description": "The Signal ID" }
      },
      "required": ["signal_id"]
    })
  }
  async fn execute(&self, args: serde_json::Value) -> Result<String, String> {
    let signal_id = args
      .get("signal_id")
      .and_then(|v| v.as_i64())
      .ok_or("missing 'signal_id' parameter")? as i32;
    let conn = &mut crate::db::establish_connection();
    let detail = pipeline::get_signal_detail(conn, signal_id)?;
    let json = serde_json::to_string(&detail).unwrap_or_else(|_| "{}".to_string());
    Ok(truncate_json(&json, 8000))
  }
}

/// `get_topics(status?, limit?)` → list topic groupings.
pub struct GetTopicsTool;

#[async_trait]
impl AgentTool for GetTopicsTool {
  fn name(&self) -> &str {
    "get_topics"
  }
  fn description(&self) -> &str {
    "List Topics (clusters of related articles). Optional status filter (e.g. 'active'). Returns titles, article counts, source counts."
  }
  fn parameters(&self) -> serde_json::Value {
    serde_json::json!({
      "type": "object",
      "properties": {
        "status": { "type": "string", "description": "Filter by topic status, e.g. 'active'", "default": "active" },
        "limit": { "type": "integer", "description": "Max topics to return", "default": 10 }
      }
    })
  }
  async fn execute(&self, args: serde_json::Value) -> Result<String, String> {
    let status = args
      .get("status")
      .and_then(|v| v.as_str())
      .map(|s| s.to_string());
    let limit = args
      .get("limit")
      .and_then(|v| v.as_i64());
    let conn = &mut crate::db::establish_connection();
    let results = topic::get_topics_list(conn, status, None, limit)?;
    let json = serde_json::to_string(&results).unwrap_or_else(|_| "[]".to_string());
    Ok(truncate_json(&json, 8000))
  }
}

/// `search_topics(query)` → search topics by keyword.
pub struct SearchTopicsTool;

#[async_trait]
impl AgentTool for SearchTopicsTool {
  fn name(&self) -> &str {
    "search_topics"
  }
  fn description(&self) -> &str {
    "Search Topics by keyword. Returns matching topic titles, descriptions, and article counts."
  }
  fn parameters(&self) -> serde_json::Value {
    serde_json::json!({
      "type": "object",
      "properties": {
        "query": { "type": "string", "description": "Search keyword" }
      },
      "required": ["query"]
    })
  }
  async fn execute(&self, args: serde_json::Value) -> Result<String, String> {
    let query = args
      .get("query")
      .and_then(|v| v.as_str())
      .ok_or("missing 'query' parameter")?;
    let conn = &mut crate::db::establish_connection();
    let results = topic::search_topics(conn, query)?;
    let json = serde_json::to_string(&results).unwrap_or_else(|_| "[]".to_string());
    Ok(truncate_json(&json, 8000))
  }
}

/// Build the default tool registry with all built-in tools registered.
pub fn default_tool_registry() -> ToolRegistry {
  let mut registry = ToolRegistry::new();
  registry.register(Box::new(GetTodaySignalsTool));
  registry.register(Box::new(SearchSignalsTool));
  registry.register(Box::new(GetSignalDetailTool));
  registry.register(Box::new(GetTopicsTool));
  registry.register(Box::new(SearchTopicsTool));
  registry
}

// ---------------------------------------------------------------------------
// ReAct loop
// ---------------------------------------------------------------------------

pub const AGENT_SYSTEM_PROMPT: &str = "\
你是 Lettura 的新闻分析助手。用户会问关于他们已订阅的 RSS 内容的问题。\n\n\
你可以调用以下类型的工具来检索已分析的数据：\n\
- 获取今日 Signal（新闻摘要）\n\
- 按关键词搜索 Signal\n\
- 获取某个 Signal 的完整详情（含所有来源文章）\n\
- 获取或搜索 Topic（文章聚类主题）\n\n\
规则：\n\
1. 先调用工具检索真实数据，再基于返回结果回答。不要凭空编造。\n\
2. 回答用中文，简洁有条理。如果涉及多条 Signal/Topic，用列表呈现。\n\
3. 如果工具返回的数据不足以回答，明确告诉用户，并建议他们先运行 AI Pipeline（在 Today 页面触发）。\n\
4. 引用具体内容时，附上来源文章的标题或链接。";

/// Run the agent loop.
///
/// `history` is optional prior conversation turns (role/content pairs from the
/// frontend) that get prepended so the agent has multi-turn context.
pub async fn run_agent(
  llm: &dyn LLMProvider,
  tools: &ToolRegistry,
  history: Vec<HistoryMessage>,
  user_message: &str,
) -> Result<AgentResult, AgentError> {
  let tool_defs = tools.definitions();

  // Build the message list: system → history → current user message.
  let mut messages: Vec<ChatMessage> = Vec::with_capacity(2 + history.len());
  messages.push(ChatMessage::System(AGENT_SYSTEM_PROMPT.to_string()));
  for h in &history {
    match h.role.as_str() {
      "user" => messages.push(ChatMessage::User(h.content.clone())),
      "assistant" => messages.push(ChatMessage::Assistant(h.content.clone())),
      _ => {}
    }
  }
  messages.push(ChatMessage::User(user_message.to_string()));

  let mut tool_calls_made: Vec<ToolCallRecord> = Vec::new();

  log::info!(
    "run_agent: starting loop, history={}, message='{}'",
    history.len(),
    if user_message.len() > 80 { &user_message[..80] } else { user_message }
  );

  for iteration in 0..MAX_ITERATIONS {
    log::info!("run_agent: iteration {}/{}", iteration + 1, MAX_ITERATIONS);
    // Wrap each LLM call in a timeout so rate-limiting or hung requests
    // don't block the agent forever. The default async_openai backoff has
    // no max-elapsed-time, so without this a sustained 429 would retry
    // indefinitely and the frontend would never get a response.
    let llm_result = tokio::time::timeout(
      std::time::Duration::from_secs(60),
      llm.complete_with_tools(messages.clone(), tool_defs.clone()),
    )
    .await;

    let response = match llm_result {
      Ok(r) => r.map_err(|e| {
        log::error!("run_agent: LLM error on iteration {}: {}", iteration + 1, e);
        AgentError::LlmError(e)
      })?,
      Err(_) => {
        log::error!("run_agent: LLM call timed out after 60s on iteration {}", iteration + 1);
        return Err(AgentError::LlmError(
          "请求超时（60秒）。可能触发了 API 速率限制，请稍后重试。".to_string(),
        ));
      }
    };

    match response {
      LlmResponse::Text(answer) => {
        log::info!(
          "run_agent: got final answer ({} chars) after {} iteration(s)",
          answer.len(),
          iteration + 1
        );
        return Ok(AgentResult {
          answer,
          tool_calls_made,
        });
      }
      LlmResponse::ToolCalls(calls) => {
        log::info!(
          "run_agent: model requested {} tool call(s): {:?}",
          calls.len(),
          calls.iter().map(|c| &c.name).collect::<Vec<_>>()
        );
        // Per the OpenAI protocol, the assistant message that requested the
        // tool calls must come BEFORE the tool result messages.
        messages.push(ChatMessage::AssistantToolCalls {
          content: None,
          tool_calls: calls.clone(),
        });

        for call in &calls {
          tool_calls_made.push(ToolCallRecord {
            name: call.name.clone(),
            args: call.arguments.clone(),
          });

          let result = tools.execute(&call.name, &call.arguments).await;

          let tool_content = match result {
            Ok(content) => {
              log::info!(
                "run_agent: tool '{}' returned {} bytes",
                call.name,
                content.len()
              );
              content
            }
            Err(e) => {
              log::warn!("run_agent: tool '{}' failed: {}", call.name, e);
              format!("{{\"error\": \"{e}\"}}")
            }
          };

          messages.push(ChatMessage::Tool {
            tool_call_id: call.id.clone(),
            content: tool_content,
          });
        }
      }
    }
  }

  log::warn!("run_agent: reached max iterations without a final answer");
  Err(AgentError::MaxIterations)
}

/// A simplified message from the frontend for multi-turn history.
#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
pub struct HistoryMessage {
  pub role: String,
  pub content: String,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_registry_builds_tool_definitions() {
    let registry = default_tool_registry();
    let defs = registry.definitions();
    assert_eq!(defs.len(), 5);
  }

  #[test]
  fn test_registry_unknown_tool_errors() {
    let registry = default_tool_registry();
    // execute is async, so we use a small runtime via tokio
    let rt = tokio::runtime::Runtime::new().unwrap();
    let result = rt.block_on(registry.execute("nonexistent", "{}"));
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Unknown tool"));
  }

  #[test]
  fn test_truncate_json_short() {
    let s = "hello";
    assert_eq!(truncate_json(s, 100), "hello");
  }

  #[test]
  fn test_truncate_json_long() {
    let s = "a".repeat(200);
    let truncated = truncate_json(&s, 50);
    assert!(truncated.len() < 200);
    assert!(truncated.contains("truncated"));
  }

  #[test]
  fn test_truncate_json_multibyte_no_panic() {
    // Reproduces the original panic: byte boundary lands inside a multi-byte
    // CJK character. '洲' is 3 bytes; repeating "洲" gives boundaries at 0,3,6,...
    // Asking for 8000 bytes with content like this must not panic.
    let s = "洲".repeat(3000); // 9000 bytes total
    let truncated = truncate_json(&s, 8000);
    assert!(truncated.contains("truncated"));
    // Must be valid UTF-8 (this would panic if we sliced mid-character).
    assert!(std::str::from_utf8(truncated.as_bytes()).is_ok());
  }

  #[test]
  fn test_truncate_json_exact_boundary() {
    let s = "ab洲".repeat(100); // each "ab洲" = 5 bytes
    let truncated = truncate_json(&s, 10); // 10 = 2 full groups
    assert!(truncated.contains("truncated"));
  }

  #[test]
  fn test_history_message_deserialize() {
    let json = r#"{"role":"user","content":"hello"}"#;
    let msg: HistoryMessage = serde_json::from_str(json).unwrap();
    assert_eq!(msg.role, "user");
    assert_eq!(msg.content, "hello");
  }

  #[test]
  fn test_agent_error_display() {
    assert!(AgentError::MaxIterations.to_string().contains("max iterations"));
    assert!(AgentError::LlmError("test".to_string()).to_string().contains("test"));
  }

  #[test]
  fn test_tool_call_record_serialize() {
    let record = ToolCallRecord {
      name: "search_signals".to_string(),
      args: r#"{"query":"AI"}"#.to_string(),
    };
    let json = serde_json::to_string(&record).unwrap();
    assert!(json.contains("search_signals"));
  }
}
