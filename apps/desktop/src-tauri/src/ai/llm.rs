use async_openai::config::OpenAIConfig;
use async_openai::types::chat::{
  ChatCompletionRequestMessage, ChatCompletionRequestSystemMessage,
  ChatCompletionRequestUserMessage, CreateChatCompletionRequestArgs,
};
use async_openai::Client;
use async_trait::async_trait;

#[async_trait]
pub trait LLMProvider: Send + Sync {
  async fn complete(&self, prompt: &str, system: &str) -> Result<String, String>;
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
}

#[async_trait]
impl LLMProvider for OpenAILLM {
  async fn complete(&self, prompt: &str, system: &str) -> Result<String, String> {
    let request = CreateChatCompletionRequestArgs::default()
      .model(&self.model)
      .max_tokens(512u32)
      .messages(vec![
        ChatCompletionRequestMessage::System(ChatCompletionRequestSystemMessage::from(system)),
        ChatCompletionRequestMessage::User(ChatCompletionRequestUserMessage::from(prompt)),
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
}
