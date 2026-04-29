use async_openai::config::OpenAIConfig;
use async_openai::types::embeddings::CreateEmbeddingRequestArgs;
use async_openai::Client;
use async_trait::async_trait;

#[async_trait]
pub trait EmbeddingProvider: Send + Sync {
  async fn embed(&self, texts: Vec<&str>) -> Result<Vec<Vec<f32>>, String>;
  fn dimension(&self) -> usize;
}

pub struct OpenAIEmbedding {
  client: Client<OpenAIConfig>,
  model: String,
}

impl OpenAIEmbedding {
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
impl EmbeddingProvider for OpenAIEmbedding {
  async fn embed(&self, texts: Vec<&str>) -> Result<Vec<Vec<f32>>, String> {
    let request = CreateEmbeddingRequestArgs::default()
      .model(&self.model)
      .input(texts)
      .build()
      .map_err(|e| format!("Embedding request build failed: {}", e))?;

    let response = self
      .client
      .embeddings()
      .create(request)
      .await
      .map_err(|e| format!("Embedding API call failed: {}", e))?;

    Ok(response.data.into_iter().map(|e| e.embedding).collect())
  }

  fn dimension(&self) -> usize {
    match self.model.as_str() {
      "text-embedding-3-small" => 1536,
      "text-embedding-3-large" => 3072,
      "text-embedding-ada-002" => 1536,
      _ => 1536,
    }
  }
}

pub struct MockEmbedding {
  pub dimension_size: usize,
}

impl MockEmbedding {
  pub fn new(dimension: usize) -> Self {
    Self {
      dimension_size: dimension,
    }
  }
}

#[async_trait]
impl EmbeddingProvider for MockEmbedding {
  async fn embed(&self, texts: Vec<&str>) -> Result<Vec<Vec<f32>>, String> {
    Ok(
      texts
        .iter()
        .map(|_| vec![0.1; self.dimension_size])
        .collect(),
    )
  }

  fn dimension(&self) -> usize {
    self.dimension_size
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_mock_embedding_returns_correct_dimension() {
    let mock = MockEmbedding::new(1536);
    let result = mock.embed(vec!["test"]).await.unwrap();
    assert_eq!(result.len(), 1);
    assert_eq!(result[0].len(), 1536);
  }

  #[tokio::test]
  async fn test_mock_embedding_batch() {
    let mock = MockEmbedding::new(1536);
    let texts: Vec<&str> = (0..32).map(|_| "test text").collect();
    let result = mock.embed(texts).await.unwrap();
    assert_eq!(result.len(), 32);
  }

  #[test]
  fn test_dimension_for_models() {
    let mock = MockEmbedding::new(1536);
    assert_eq!(mock.dimension(), 1536);
  }
}
