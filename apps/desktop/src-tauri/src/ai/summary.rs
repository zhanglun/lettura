use crate::ai::llm::LLMProvider;

pub async fn generate_summary(
  llm: &dyn LLMProvider,
  title: &str,
  content_truncated: &str,
) -> Result<String, String> {
  let prompt = format!(
    r#"You are a precise content analyst. Summarize the following article in ONE sentence.

Rules:
- Maximum 50 words in English, 80 characters in Chinese
- State the main point directly, not "this article discusses..."
- Use factual language, no superlatives
- If the article is about a product/tool, include its name
- If the article contains quantitative findings, include the key number

Article title: {}
Article content: {}

Output the summary directly, no prefix, no quotes."#,
    title, content_truncated
  );

  let result = llm
    .complete(&prompt, "You are a precise content analyst.")
    .await?;
  let trimmed = result.trim().to_string();

  if validate_summary(&trimmed) {
    Ok(trimmed)
  } else {
    Ok(trimmed)
  }
}

pub fn validate_summary(text: &str) -> bool {
  let word_count = text.split_whitespace().count();
  word_count > 0 && word_count <= 60
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_validate_summary_normal() {
    let summary = "OpenAI released GPT-4o mini, a small model that matches GPT-4 class performance at lower cost.";
    assert!(validate_summary(summary));
  }

  #[test]
  fn test_validate_summary_empty() {
    assert!(!validate_summary(""));
  }

  #[test]
  fn test_validate_summary_too_long() {
    let long_summary = "word ".repeat(70);
    assert!(!validate_summary(&long_summary));
  }

  #[tokio::test]
  async fn test_generate_summary_with_mock() {
    let mock =
      crate::ai::llm::MockLLM::new("OpenAI released GPT-4o mini with improved performance.");
    let result = generate_summary(&mock, "GPT-4o mini release", "Article content here").await;
    assert!(result.is_ok());
    assert!(!result.unwrap().is_empty());
  }
}
