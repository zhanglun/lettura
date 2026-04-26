use crate::ai::llm::LLMProvider;

/// Generate a Signal-level title for a cluster of related articles.
/// Prompt template: prd/ai-prompt-design.md §5
/// Output: ≤12 words EN / ≤20 chars ZH, title case, no period.
/// On failure: degrades to the first article's title.
pub async fn generate_signal_title(
    llm: &dyn LLMProvider,
    article_titles: &[String],
) -> Result<String, String> {
    if article_titles.is_empty() {
        return Err("No article titles provided".to_string());
    }

    let titles_list = article_titles
        .iter()
        .map(|t| format!("- {}", t))
        .collect::<Vec<_>>()
        .join("\n");

    let prompt = format!(
        r#"You are generating a title for a group of related articles about the same topic.

Rules:
- Maximum 12 words in English, 20 characters in Chinese
- Title case for English
- Be specific: include product names, version numbers, or technology names when available
- Do not use vague words like "update", "news", "development" alone
- If the articles describe a trend, name the trend direction

Article titles in this group:
{}

Output the title directly, no prefix, no quotes, no period."#,
        titles_list
    );

    let result = llm
        .complete(&prompt, "You are a concise headline writer.")
        .await?;

    let trimmed = result.trim().to_string();

    if validate_signal_title(&trimmed) {
        Ok(clean_signal_title(&trimmed))
    } else {
        // Validation failed: retry once with explicit constraints
        let retry_prompt = format!(
            "{}\n\nIMPORTANT: The title MUST be 15 words or fewer. Output ONLY the title.",
            prompt
        );
        let retry_result = llm
            .complete(&retry_prompt, "You are a concise headline writer. Be very brief.")
            .await;

        match retry_result {
            Ok(t) => {
                let retry_trimmed = t.trim().to_string();
                if validate_signal_title(&retry_trimmed) {
                    Ok(clean_signal_title(&retry_trimmed))
                } else {
                    // Still invalid after retry, return original trimmed
                    Ok(clean_signal_title(&trimmed))
                }
            }
            Err(_) => Ok(clean_signal_title(&trimmed)),
        }
    }
}

/// Generate signal title with degradation: on failure, return first article's title.
pub async fn generate_signal_title_with_fallback(
    llm: &dyn LLMProvider,
    article_titles: &[String],
) -> String {
    match generate_signal_title(llm, article_titles).await {
        Ok(title) if !title.is_empty() => title,
        _ => article_titles.first().cloned().unwrap_or_default(),
    }
}

fn validate_signal_title(text: &str) -> bool {
    let word_count = text.split_whitespace().count();
    word_count > 0 && word_count <= 15
}

fn clean_signal_title(text: &str) -> String {
    text.trim_end_matches('.')
        .trim()
        .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_signal_title_normal() {
        assert!(validate_signal_title("React 19 Introduces Automatic Memoization Compiler"));
    }

    #[test]
    fn test_validate_signal_title_short() {
        assert!(validate_signal_title("Rust 2026"));
    }

    #[test]
    fn test_validate_signal_title_too_long() {
        let long_title = (0..20).map(|_| "word").collect::<Vec<_>>().join(" ");
        assert!(!validate_signal_title(&long_title));
    }

    #[test]
    fn test_validate_signal_title_empty() {
        assert!(!validate_signal_title(""));
    }

    #[test]
    fn test_clean_signal_title_removes_period() {
        assert_eq!(clean_signal_title("Hello World."), "Hello World");
        assert_eq!(clean_signal_title("Hello World"), "Hello World");
        assert_eq!(clean_signal_title("Hello World.."), "Hello World");
    }

    #[tokio::test]
    async fn test_generate_signal_title_with_mock() {
        let mock = crate::ai::llm::MockLLM::new("React 19 Auto-Memoization Release");
        let titles = vec![
            "React 19 released with compiler".to_string(),
            "React compiler auto-memoizes components".to_string(),
            "New React 19 features overview".to_string(),
        ];
        let result = generate_signal_title(&mock, &titles).await;
        assert!(result.is_ok());
        let title = result.unwrap();
        assert!(!title.ends_with('.'));
        assert!(!title.is_empty());
    }

    #[tokio::test]
    async fn test_generate_signal_title_fallback_on_failure() {
        let mock = crate::ai::llm::MockLLM::new_failing("API error");
        let titles = vec![
            "Fallback Title".to_string(),
            "Other Title".to_string(),
        ];
        let result = generate_signal_title_with_fallback(&mock, &titles).await;
        assert_eq!(result, "Fallback Title");
    }

    #[tokio::test]
    async fn test_generate_signal_title_empty_input() {
        let mock = crate::ai::llm::MockLLM::new("Title");
        let result = generate_signal_title(&mock, &[]).await;
        assert!(result.is_err());
    }
}
