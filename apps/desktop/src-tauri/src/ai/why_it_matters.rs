use crate::ai::llm::LLMProvider;

/// Input for Why It Matters generation
pub struct WimInput {
  pub summary: String,
  pub source_count: usize,
  pub feed_count: usize,
  pub topic_title: Option<String>,
  pub topic_description: Option<String>,
}

/// Generate a "Why It Matters" explanation for a Signal.
///
/// Prompt template: prd/ai-prompt-design.md §3
/// Output: 2-3 sentences, ≤80 words EN / ≤120 chars ZH
/// On failure: retries once, then degrades to summary text.
pub async fn generate_why_it_matters(
  llm: &dyn LLMProvider,
  input: &WimInput,
) -> Result<String, String> {
  let prompt = build_wim_prompt(input);

  let result = llm
        .complete(&prompt, "你是一位情报分析师，向技术专业人士解释信息的重要性。请用中文输出。")
        .await;

  match result {
    Ok(text) => {
      let trimmed = text.trim().to_string();
      if validate_why_it_matters(&trimmed) {
        Ok(trimmed)
      } else {
        let retry = llm
                    .complete(&prompt, "你是一位情报分析师，向技术专业人士解释信息的重要性。请用中文输出。")
                    .await;
        match retry {
          Ok(t) => {
            let retry_trimmed = t.trim().to_string();
            if retry_trimmed.is_empty() {
              Ok(trimmed)
            } else {
              Ok(retry_trimmed)
            }
          }
          Err(_) => Ok(trimmed),
        }
      }
    }
    Err(_) => {
      let retry = llm
                .complete(&prompt, "你是一位情报分析师，向技术专业人士解释信息的重要性。请用中文输出。")
                .await;
      match retry {
        Ok(t) => {
          let retry_trimmed = t.trim().to_string();
          if retry_trimmed.is_empty() {
            Err("LLM returned empty response after retry".to_string())
          } else {
            Ok(retry_trimmed)
          }
        }
        Err(e) => Err(e),
      }
    }
  }
}

/// Generate WIM with degradation: on complete failure, return the summary text.
pub async fn generate_why_it_matters_with_fallback(
  llm: &dyn LLMProvider,
  input: &WimInput,
) -> String {
  match generate_why_it_matters(llm, input).await {
    Ok(wim) => wim,
    Err(_) => input.summary.clone(),
  }
}

fn build_wim_prompt(input: &WimInput) -> String {
  let topic_section = match &input.topic_title {
    Some(title) => {
      let desc = input.topic_description.as_deref().unwrap_or("N/A");
      format!("\nRelated topic: {} \nRecent context: {}", title, desc)
    }
    None => String::new(),
  };

  format!(
    r#"你是一位情报分析师，向技术专业人士解释信息的重要性。

根据以下摘要及其上下文，用2-3句话解释为什么这很重要。

规则：
- 中文不超过120字，英文不超过80词
- 解释具体的影响，而非抽象的价值
- 如果与更广泛的趋势相关，请指出趋势名称
- 如果影响开发者工作流或工具选择，请具体说明
- 不要说"这很重要，因为它可能..."——直接陈述
- 少用第二人称，多用第三人称或被动语态

摘要：{}
来源数量：{} 篇文章，来自 {} 个不同来源{}
 
请直接输出解释内容，不要加前缀或引号。"#,
    input.summary, input.source_count, input.feed_count, topic_section
  )
}

/// Validate WIM output: 2-4 sentences, ≤100 words (20% tolerance over 80-word limit)
pub fn validate_why_it_matters(text: &str) -> bool {
  let sentence_count = text.matches('.').count();
  let word_count = text.split_whitespace().count();
  sentence_count >= 2 && sentence_count <= 4 && word_count <= 100
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_validate_wim_normal() {
    let wim = "React 19's compiler will automatically optimize re-renders. This means many existing memoization patterns become unnecessary. Teams can simplify their codebase while getting better performance out of the box.";
    assert!(validate_why_it_matters(wim));
  }

  #[test]
  fn test_validate_wim_too_few_sentences() {
    let wim = "This is just one sentence.";
    assert!(!validate_why_it_matters(wim));
  }

  #[test]
  fn test_validate_wim_too_many_sentences() {
    let wim = "First sentence here. Second one too. Third is okay. Fourth is borderline. Fifth is too much.";
    assert!(!validate_why_it_matters(wim));
  }

  #[test]
  fn test_validate_wim_too_long() {
    let words: Vec<&str> = (0..110).map(|_| "word").collect();
    let wim = format!("{}. {}.", words.join(" "), words.join(" "));
    assert!(!validate_why_it_matters(&wim));
  }

  #[test]
  fn test_validate_wim_two_sentences() {
    let wim = "Rust's async ecosystem is maturing rapidly. Libraries like tokio now offer production-grade runtime stability.";
    assert!(validate_why_it_matters(wim));
  }

  #[test]
  fn test_validate_wim_four_sentences_edge() {
    let wim =
      "First point here. Second point follows. Third adds context. Fourth is the conclusion.";
    assert!(validate_why_it_matters(wim));
  }

  #[tokio::test]
  async fn test_generate_wim_with_mock() {
    let mock = crate::ai::llm::MockLLM::new(
            "React 19's compiler automates memoization. This eliminates most manual optimization work. Teams shipping React apps will see simpler code and faster renders.",
        );
    let input = WimInput {
      summary: "React 19 released with auto-memoization compiler.".to_string(),
      source_count: 3,
      feed_count: 2,
      topic_title: None,
      topic_description: None,
    };
    let result = generate_why_it_matters(&mock, &input).await;
    assert!(result.is_ok());
    assert!(!result.unwrap().is_empty());
  }

  #[tokio::test]
  async fn test_generate_wim_fallback_on_failure() {
    let mock = crate::ai::llm::MockLLM::new_failing("API error");
    let input = WimInput {
      summary: "Original summary text.".to_string(),
      source_count: 1,
      feed_count: 1,
      topic_title: None,
      topic_description: None,
    };
    let result = generate_why_it_matters_with_fallback(&mock, &input).await;
    assert_eq!(result, "Original summary text.");
  }

  #[test]
  fn test_build_wim_prompt_without_topic() {
    let input = WimInput {
      summary: "Test summary.".to_string(),
      source_count: 5,
      feed_count: 3,
      topic_title: None,
      topic_description: None,
    };
    let prompt = build_wim_prompt(&input);
    assert!(prompt.contains("Test summary."));
    assert!(prompt.contains("5 articles from 3 different sources"));
    assert!(!prompt.contains("Related topic:"));
  }

  #[test]
  fn test_build_wim_prompt_with_topic() {
    let input = WimInput {
      summary: "Test summary.".to_string(),
      source_count: 2,
      feed_count: 1,
      topic_title: Some("Rust async".to_string()),
      topic_description: Some("Ecosystem evolution".to_string()),
    };
    let prompt = build_wim_prompt(&input);
    assert!(prompt.contains("Related topic: Rust async"));
    assert!(prompt.contains("Recent context: Ecosystem evolution"));
  }
}
