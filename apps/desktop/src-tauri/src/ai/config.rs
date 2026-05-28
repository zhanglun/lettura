use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiConfig {
  #[serde(default)]
  pub api_key: String,
  #[serde(default = "default_model")]
  pub model: String,
  #[serde(default = "default_embedding_model")]
  pub embedding_model: String,
  #[serde(default = "default_base_url")]
  pub base_url: String,
  #[serde(default = "default_pipeline_interval_hours")]
  pub pipeline_interval_hours: u64,
  #[serde(default = "default_enable_embedding")]
  pub enable_embedding: bool,
  #[serde(default = "default_true")]
  pub enable_auto_pipeline: bool,
}

fn default_true() -> bool {
  true
}

fn default_model() -> String {
  "gpt-4o-mini".to_string()
}

fn default_embedding_model() -> String {
  "text-embedding-3-small".to_string()
}

fn default_base_url() -> String {
  "https://api.deepseek.com".to_string()
}

fn default_pipeline_interval_hours() -> u64 {
  1
}

fn default_enable_embedding() -> bool {
  true
}

impl Default for AiConfig {
  fn default() -> Self {
    Self {
      api_key: String::new(),
      model: default_model(),
      embedding_model: default_embedding_model(),
      base_url: default_base_url(),
      pipeline_interval_hours: default_pipeline_interval_hours(),
      enable_embedding: default_enable_embedding(),
      enable_auto_pipeline: default_true(),
    }
  }
}

impl AiConfig {
  pub fn has_api_key(&self) -> bool {
    !self.api_key.trim().is_empty()
  }

  pub fn resolved_embedding_model(&self) -> String {
    resolve_embedding_model(&self.embedding_model, &self.base_url)
  }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Provider {
  OpenAI,
  Zhipu,
  DeepSeek,
  DashScope,
  Qianfan,
  SiliconFlow,
  Ollama,
  Unknown,
}

pub fn detect_provider(base_url: &str) -> Provider {
  let url = base_url.to_lowercase();
  if url.contains("bigmodel.cn") {
    Provider::Zhipu
  } else if url.contains("deepseek.com") {
    Provider::DeepSeek
  } else if url.contains("dashscope") || url.contains("aliyuncs.com") {
    Provider::DashScope
  } else if url.contains("qianfan") || url.contains("baidubce.com") {
    Provider::Qianfan
  } else if url.contains("siliconflow") {
    Provider::SiliconFlow
  } else if url.contains("localhost:11434") || url.contains("127.0.0.1:11434") {
    Provider::Ollama
  } else if url.contains("openai.com") {
    Provider::OpenAI
  } else {
    Provider::Unknown
  }
}

static OPENAI_EMBEDDING_MODELS: &[&str] = &[
  "text-embedding-3-small",
  "text-embedding-3-large",
  "text-embedding-ada-002",
];

pub fn resolve_embedding_model(embedding_model: &str, base_url: &str) -> String {
  if !OPENAI_EMBEDDING_MODELS.contains(&embedding_model) {
    return embedding_model.to_string();
  }

  match detect_provider(base_url) {
    Provider::Zhipu => "embedding-3".to_string(),
    Provider::DeepSeek => "deepseek-embedding".to_string(),
    Provider::DashScope => "text-embedding-v3".to_string(),
    Provider::Qianfan => "embedding-v1".to_string(),
    Provider::SiliconFlow => "BAAI/bge-m3".to_string(),
    _ => embedding_model.to_string(),
  }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiConfigPublic {
  pub has_api_key: bool,
  pub model: String,
  pub embedding_model: String,
  pub base_url: String,
  pub pipeline_interval_hours: u64,
  pub enable_embedding: bool,
  pub enable_auto_pipeline: bool,
}

impl From<&AiConfig> for AiConfigPublic {
  fn from(config: &AiConfig) -> Self {
    Self {
      has_api_key: config.has_api_key(),
      model: config.model.clone(),
      embedding_model: config.embedding_model.clone(),
      base_url: config.base_url.clone(),
      pipeline_interval_hours: config.pipeline_interval_hours,
      enable_embedding: config.enable_embedding,
      enable_auto_pipeline: config.enable_auto_pipeline,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_default_config() {
    let config = AiConfig::default();
    assert!(config.api_key.is_empty());
    assert_eq!(config.model, "gpt-4o-mini");
    assert_eq!(config.embedding_model, "text-embedding-3-small");
    assert_eq!(config.base_url, "https://api.deepseek.com");
  }

  #[test]
  fn test_has_api_key_false_when_empty() {
    let config = AiConfig::default();
    assert!(!config.has_api_key());
  }

  #[test]
  fn test_has_api_key_false_when_whitespace() {
    let config = AiConfig {
      api_key: "   ".to_string(),
      ..AiConfig::default()
    };
    assert!(!config.has_api_key());
  }

  #[test]
  fn test_has_api_key_true() {
    let config = AiConfig {
      api_key: "sk-test-key".to_string(),
      ..AiConfig::default()
    };
    assert!(config.has_api_key());
  }

  #[test]
  fn test_public_config_hides_api_key() {
    let config = AiConfig {
      api_key: "sk-secret".to_string(),
      ..AiConfig::default()
    };
    let public = AiConfigPublic::from(&config);
    assert!(public.has_api_key);
    assert_eq!(public.model, "gpt-4o-mini");
  }

  #[test]
  fn test_serde_roundtrip() {
    let config = AiConfig {
      api_key: "sk-test".to_string(),
      model: "gpt-4".to_string(),
      embedding_model: "text-embedding-3-large".to_string(),
      base_url: "https://custom.api.com/v1".to_string(),
      ..AiConfig::default()
    };
    let json = serde_json::to_string(&config).unwrap();
    let deserialized: AiConfig = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.api_key, config.api_key);
    assert_eq!(deserialized.model, config.model);
  }

  #[test]
  fn test_detect_provider() {
    assert_eq!(detect_provider("https://open.bigmodel.cn/api/paas/v4/"), Provider::Zhipu);
    assert_eq!(detect_provider("https://api.deepseek.com/v1"), Provider::DeepSeek);
    assert_eq!(detect_provider("https://dashscope.aliyuncs.com/compatible-mode/v1"), Provider::DashScope);
    assert_eq!(detect_provider("https://qianfan.baidubce.com/v2"), Provider::Qianfan);
    assert_eq!(detect_provider("https://api.siliconflow.cn/v1"), Provider::SiliconFlow);
    assert_eq!(detect_provider("http://localhost:11434/v1"), Provider::Ollama);
    assert_eq!(detect_provider("https://api.deepseek.com"), Provider::OpenAI);
    assert_eq!(detect_provider("https://custom.llm.api/v1"), Provider::Unknown);
  }

  #[test]
  fn test_resolve_zhipu() {
    let model = resolve_embedding_model("text-embedding-3-small", "https://open.bigmodel.cn/api/paas/v4/");
    assert_eq!(model, "embedding-3");
  }

  #[test]
  fn test_resolve_deepseek() {
    let model = resolve_embedding_model("text-embedding-3-small", "https://api.deepseek.com/v1");
    assert_eq!(model, "deepseek-embedding");
  }

  #[test]
  fn test_resolve_dashscope() {
    let model = resolve_embedding_model("text-embedding-3-small", "https://dashscope.aliyuncs.com/compatible-mode/v1");
    assert_eq!(model, "text-embedding-v3");
  }

  #[test]
  fn test_resolve_siliconflow() {
    let model = resolve_embedding_model("text-embedding-3-small", "https://api.siliconflow.cn/v1");
    assert_eq!(model, "BAAI/bge-m3");
  }

  #[test]
  fn test_resolve_preserves_custom_model() {
    let model = resolve_embedding_model("my-custom-embedding", "https://open.bigmodel.cn/api/paas/v4/");
    assert_eq!(model, "my-custom-embedding");
  }

  #[test]
  fn test_resolve_preserves_openai() {
    let model = resolve_embedding_model("text-embedding-3-small", "https://api.deepseek.com");
    assert_eq!(model, "text-embedding-3-small");
  }

  #[test]
  fn test_resolved_embedding_model_on_config() {
    let config = AiConfig {
      base_url: "https://open.bigmodel.cn/api/paas/v4/".to_string(),
      ..AiConfig::default()
    };
    assert_eq!(config.resolved_embedding_model(), "embedding-3");
  }
}
