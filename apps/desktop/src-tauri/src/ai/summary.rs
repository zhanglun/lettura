use crate::ai::llm::LLMProvider;

pub async fn generate_summary(
  llm: &dyn LLMProvider,
  title: &str,
  content_truncated: &str,
) -> Result<String, String> {
  let prompt = format!(
    r#"你是一位精确的内容分析师。请用一句话总结以下文章。

规则：
- 中文不超过80字，英文不超过50词
- 直接陈述要点，不要用"本文讨论了..."之类的开头
- 使用客观、事实性的语言，不要使用夸张词
- 如果文章涉及某个产品/工具，请包含其名称
- 如果文章包含量化结论，请包含关键数字

文章标题：{}
文章内容：{}

请直接输出总结内容，不要加前缀或引号。"#,
    title, content_truncated
  );

  let result = llm
    .complete(&prompt, "你是一位精确的内容分析师。请用中文输出。")
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
