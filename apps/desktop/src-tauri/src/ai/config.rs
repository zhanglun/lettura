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
}

fn default_model() -> String {
  "gpt-4o-mini".to_string()
}

fn default_embedding_model() -> String {
  "text-embedding-3-small".to_string()
}

fn default_base_url() -> String {
  "https://api.openai.com/v1".to_string()
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
    }
  }
}

impl AiConfig {
  pub fn has_api_key(&self) -> bool {
    !self.api_key.trim().is_empty()
  }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiConfigPublic {
  pub has_api_key: bool,
  pub model: String,
  pub embedding_model: String,
  pub base_url: String,
  pub enable_embedding: bool,
}

impl From<&AiConfig> for AiConfigPublic {
  fn from(config: &AiConfig) -> Self {
    Self {
      has_api_key: config.has_api_key(),
      model: config.model.clone(),
      embedding_model: config.embedding_model.clone(),
      base_url: config.base_url.clone(),
      enable_embedding: config.enable_embedding,
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
    assert_eq!(config.base_url, "https://api.openai.com/v1");
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
}
