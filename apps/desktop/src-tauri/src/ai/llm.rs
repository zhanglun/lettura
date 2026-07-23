use async_openai::config::OpenAIConfig;
use async_openai::types::chat::{
  ChatCompletionMessageToolCall, ChatCompletionMessageToolCalls,
  ChatCompletionRequestAssistantMessage, ChatCompletionRequestAssistantMessageContent,
  ChatCompletionRequestMessage, ChatCompletionRequestSystemMessage,
  ChatCompletionRequestSystemMessageContent, ChatCompletionRequestToolMessage,
  ChatCompletionRequestToolMessageContent, ChatCompletionRequestUserMessage,
  ChatCompletionRequestUserMessageContent, ChatCompletionTool, ChatCompletionTools,
  CreateChatCompletionRequestArgs, FunctionObject,
};
use async_openai::Client;
use async_trait::async_trait;

#[async_trait]
pub trait LLMProvider: Send + Sync {
  async fn complete(&self, prompt: &str, system: &str) -> Result<String, String>;

  /// Multi-turn completion with tool-calling support.
  ///
  /// Default implementation returns an error so existing providers
  /// (e.g. `MockLLM`) are unaffected. `OpenAILLM` overrides this.
  async fn complete_with_tools(
    &self,
    _messages: Vec<ChatMessage>,
    _tools: Vec<ChatCompletionTools>,
  ) -> Result<LlmResponse, String> {
    Err("tool calling not supported by this provider".to_string())
  }
}

/// Intermediate chat message representation used by the agent loop.
/// Maps 1:1 onto OpenAI chat message roles.
#[derive(Debug, Clone)]
pub enum ChatMessage {
  System(String),
  User(String),
  Assistant(String),
  /// An assistant message that requested one or more tool calls.
  AssistantToolCalls {
    content: Option<String>,
    tool_calls: Vec<ToolCallResponse>,
  },
  /// The result of executing a tool call, fed back to the model.
  Tool { tool_call_id: String, content: String },
}

/// A single tool call returned by the LLM.
#[derive(Debug, Clone)]
pub struct ToolCallResponse {
  pub id: String,
  pub name: String,
  /// Raw JSON arguments string (as returned by the model).
  pub arguments: String,
}

/// What `complete_with_tools` returns: either a final text answer or tool calls.
#[derive(Debug, Clone)]
pub enum LlmResponse {
  Text(String),
  ToolCalls(Vec<ToolCallResponse>),
}

pub struct OpenAILLM {
  client: Client<OpenAIConfig>,
  model: String,
}

impl OpenAILLM {
  pub fn new(api_key: &str, base_url: &str, model: String) -> Self {
    let config = OpenAIConfig::new()
      .with_api_key(api_key)
      .with_api_base(base_url);
    Self {
      client: Client::with_config(config),
      model,
    }
  }

  /// Single-shot completion (used by summary/why_it_matters/etc.).
  pub async fn complete(&self, prompt: &str, system: &str) -> Result<String, String> {
    let request = CreateChatCompletionRequestArgs::default()
      .model(&self.model)
      .max_tokens(512u32)
      .messages(vec![
        ChatCompletionRequestMessage::System(ChatCompletionRequestSystemMessage {
          content: ChatCompletionRequestSystemMessageContent::Text(system.to_string()),
          name: None,
        }),
        ChatCompletionRequestMessage::User(ChatCompletionRequestUserMessage {
          content: ChatCompletionRequestUserMessageContent::Text(prompt.to_string()),
          name: None,
        }),
      ])
      .build()
      .map_err(|e| format!("LLM request build failed: {}", e))?;

    let response = self
      .client
      .chat()
      .create(request)
      .await
      .map_err(|e| format!("LLM API call failed: {}", e))?;

    response
      .choices
      .first()
      .and_then(|c| c.message.content.clone())
      .ok_or_else(|| "No content in LLM response".to_string())
  }
}

#[async_trait]
impl LLMProvider for OpenAILLM {
  /// Delegate single-shot completion to the helper above.
  async fn complete(&self, prompt: &str, system: &str) -> Result<String, String> {
    OpenAILLM::complete(self, prompt, system).await
  }

  async fn complete_with_tools(
    &self,
    messages: Vec<ChatMessage>,
    tools: Vec<ChatCompletionTools>,
  ) -> Result<LlmResponse, String> {
    let msg_count = messages.len();
    let tool_count = tools.len();
    log::info!(
      "complete_with_tools: model={}, messages={}, tools={}",
      self.model,
      msg_count,
      tool_count
    );

    let openai_messages = messages
      .into_iter()
      .map(chat_message_to_openai)
      .collect::<Result<Vec<_>, String>>()?;

    let request = CreateChatCompletionRequestArgs::default()
      .model(&self.model)
      .max_tokens(1024u32)
      .messages(openai_messages)
      .tools(tools)
      .build()
      .map_err(|e| format!("LLM tool request build failed: {}", e))?;

    log::debug!("complete_with_tools: sending request to API...");
    let response = self
      .client
      .chat()
      .create(request)
      .await
      .map_err(|e| {
        log::error!("complete_with_tools: API call failed: {}", e);
        format!("LLM tool API call failed: {}", e)
      })?;

    log::info!(
      "complete_with_tools: got response, usage={:?}",
      response.usage
    );

    let choice = response
      .choices
      .into_iter()
      .next()
      .ok_or_else(|| "No choices in LLM response".to_string())?;

    let msg = choice.message;

    // If the model returned tool calls, surface them to the agent loop.
    if let Some(tool_calls) = msg.tool_calls {
      let parsed: Vec<ToolCallResponse> = tool_calls
        .into_iter()
        .filter_map(|tc| match tc {
          ChatCompletionMessageToolCalls::Function(f) => Some(ToolCallResponse {
            id: f.id,
            name: f.function.name,
            arguments: f.function.arguments,
          }),
          ChatCompletionMessageToolCalls::Custom(_) => None,
        })
        .collect();

      if !parsed.is_empty() {
        return Ok(LlmResponse::ToolCalls(parsed));
      }
    }

    // Otherwise treat it as a final text answer.
    match msg.content {
      Some(text) if !text.trim().is_empty() => Ok(LlmResponse::Text(text)),
      _ => Err("LLM returned neither tool calls nor content".to_string()),
    }
  }
}

/// Convert our intermediate `ChatMessage` into the async_openai request type.
fn chat_message_to_openai(msg: ChatMessage) -> Result<ChatCompletionRequestMessage, String> {
  match msg {
    ChatMessage::System(text) => Ok(ChatCompletionRequestMessage::System(
      ChatCompletionRequestSystemMessage {
        content: ChatCompletionRequestSystemMessageContent::Text(text),
        name: None,
      },
    )),
    ChatMessage::User(text) => Ok(ChatCompletionRequestMessage::User(
      ChatCompletionRequestUserMessage {
        content: ChatCompletionRequestUserMessageContent::Text(text),
        name: None,
      },
    )),
    ChatMessage::Assistant(text) => Ok(ChatCompletionRequestMessage::Assistant(
      ChatCompletionRequestAssistantMessage {
        content: Some(ChatCompletionRequestAssistantMessageContent::Text(text)),
        tool_calls: None,
        ..Default::default()
      },
    )),
    ChatMessage::AssistantToolCalls { content, tool_calls } => {
      let openai_tool_calls: Vec<ChatCompletionMessageToolCalls> = tool_calls
        .into_iter()
        .map(|tc| {
          ChatCompletionMessageToolCalls::Function(ChatCompletionMessageToolCall {
            id: tc.id,
            function: async_openai::types::chat::FunctionCall {
              name: tc.name,
              arguments: tc.arguments,
            },
          })
        })
        .collect();

      Ok(ChatCompletionRequestMessage::Assistant(
        ChatCompletionRequestAssistantMessage {
          content: content.map(ChatCompletionRequestAssistantMessageContent::Text),
          tool_calls: Some(openai_tool_calls),
          ..Default::default()
        },
      ))
    }
    ChatMessage::Tool { tool_call_id, content } => {
      Ok(ChatCompletionRequestMessage::Tool(
        ChatCompletionRequestToolMessage {
          content: ChatCompletionRequestToolMessageContent::Text(content),
          tool_call_id,
        },
      ))
    }
  }
}

/// Convenience for the agent module: build a `ChatCompletionTools::Function`.
pub fn function_tool(name: &str, description: &str, parameters: serde_json::Value) -> ChatCompletionTools {
  ChatCompletionTools::Function(ChatCompletionTool {
    function: FunctionObject {
      name: name.to_string(),
      description: Some(description.to_string()),
      parameters: Some(parameters),
      strict: None,
    },
  })
}

pub struct MockLLM {
  pub response: Option<String>,
}

impl MockLLM {
  pub fn new(response: &str) -> Self {
    Self {
      response: Some(response.to_string()),
    }
  }

  pub fn new_failing(error: &str) -> Self {
    Self {
      response: Some(format!("__MOCK_ERROR__:{}", error)),
    }
  }
}

#[async_trait]
impl LLMProvider for MockLLM {
  async fn complete(&self, _prompt: &str, _system: &str) -> Result<String, String> {
    match &self.response {
      Some(r) if r.starts_with("__MOCK_ERROR__:") => {
        Err(r.strip_prefix("__MOCK_ERROR__").unwrap().to_string())
      }
      Some(r) => Ok(r.clone()),
      None => Err("MockLLM has no response configured".to_string()),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_mock_llm_complete() {
    let mock = MockLLM::new("test response");
    let result = mock.complete("any prompt", "any system").await;
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "test response");
  }

  #[tokio::test]
  async fn test_mock_llm_tool_calling_not_supported() {
    let mock = MockLLM::new("irrelevant");
    let result = mock
      .complete_with_tools(vec![], vec![])
      .await;
    assert!(result.is_err());
  }

  #[test]
  fn test_chat_message_to_openai_system() {
    let msg = ChatMessage::System("hello".to_string());
    let result = chat_message_to_openai(msg);
    assert!(result.is_ok());
    match result.unwrap() {
      ChatCompletionRequestMessage::System(_) => {}
      other => panic!("expected System, got {:?}", other),
    }
  }

  #[test]
  fn test_chat_message_to_openai_user() {
    let msg = ChatMessage::User("hi there".to_string());
    let result = chat_message_to_openai(msg);
    assert!(result.is_ok());
    match result.unwrap() {
      ChatCompletionRequestMessage::User(_) => {}
      other => panic!("expected User, got {:?}", other),
    }
  }

  #[test]
  fn test_chat_message_to_openai_tool_result() {
    let msg = ChatMessage::Tool {
      tool_call_id: "call_1".to_string(),
      content: "{\"result\": 42}".to_string(),
    };
    let result = chat_message_to_openai(msg);
    assert!(result.is_ok());
    match result.unwrap() {
      ChatCompletionRequestMessage::Tool(_) => {}
      other => panic!("expected Tool, got {:?}", other),
    }
  }

  #[test]
  fn test_function_tool_builds_correctly() {
    let params = serde_json::json!({
      "type": "object",
      "properties": { "query": { "type": "string" } },
      "required": ["query"]
    });
    let tool = function_tool("search", "Search things", params.clone());
    match tool {
      ChatCompletionTools::Function(f) => {
        assert_eq!(f.function.name, "search");
        assert_eq!(f.function.description, Some("Search things".to_string()));
        assert_eq!(f.function.parameters, Some(params));
      }
      _ => panic!("expected Function variant"),
    }
  }
}
