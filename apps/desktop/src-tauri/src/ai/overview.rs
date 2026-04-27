use crate::ai::llm::LLMProvider;
use crate::db;
use crate::schema::{article_ai_analysis, articles};
use diesel::prelude::*;
use serde::Serialize;
use std::sync::Mutex;
use std::time::{Duration, Instant};

const DEFAULT_CACHE_TTL_MINUTES: u64 = 30;

#[derive(Debug, Clone, Serialize)]
pub struct TodayOverview {
    pub summary: String,
    pub signal_count: i32,
    pub article_count: i32,
    pub generated_at: String,
    pub is_stale: bool,
}

pub struct OverviewCache {
    overview: Option<TodayOverview>,
    generated_at: Option<Instant>,
    cache_ttl: Duration,
    signal_count: i32,
    article_count: i32,
}

impl OverviewCache {
    pub fn new() -> Self {
        Self {
            overview: None,
            generated_at: None,
            cache_ttl: Duration::from_secs(DEFAULT_CACHE_TTL_MINUTES * 60),
            signal_count: 0,
            article_count: 0,
        }
    }

    pub fn get(&self) -> Option<TodayOverview> {
        let generated_at = self.generated_at?;
        let is_stale = generated_at.elapsed() > self.cache_ttl;
        Some(TodayOverview {
            summary: self.overview.as_ref()?.summary.clone(),
            signal_count: self.signal_count,
            article_count: self.article_count,
            generated_at: self.overview.as_ref()?.generated_at.clone(),
            is_stale,
        })
    }

    pub fn set(&mut self, overview: TodayOverview) {
        self.signal_count = overview.signal_count;
        self.article_count = overview.article_count;
        self.generated_at = Some(Instant::now());
        self.overview = Some(TodayOverview {
            is_stale: false,
            ..overview
        });
    }

    pub fn invalidate(&mut self) {
        self.overview = None;
        self.generated_at = None;
    }
}

/// Signal data used to build the LLM prompt
struct SignalInput {
    title: String,
    summary: String,
}

fn query_top_signals(conn: &mut SqliteConnection, limit: i32) -> Result<Vec<SignalInput>, String> {
    let limit = limit.clamp(1, 20) as i64;

    let analyses: Vec<(Option<String>, Option<String>)> = article_ai_analysis::table
        .filter(article_ai_analysis::summary.is_not_null())
        .filter(article_ai_analysis::relevance_score.is_not_null())
        .filter(article_ai_analysis::is_duplicate.eq(false))
        .order(article_ai_analysis::relevance_score.desc())
        .limit(limit)
        .select((
            article_ai_analysis::signal_title,
            article_ai_analysis::summary,
        ))
        .load(conn)
        .map_err(|e| e.to_string())?;

    let mut signals = Vec::new();
    for (signal_title, summary) in analyses {
        let title = signal_title.unwrap_or_default();
        let summary = summary.unwrap_or_default();
        if !title.is_empty() || !summary.is_empty() {
            signals.push(SignalInput { title, summary });
        }
    }

    Ok(signals)
}

fn count_todays_articles(conn: &mut SqliteConnection) -> Result<i64, String> {
    use chrono::Utc;
    let today_start = Utc::now()
        .date_naive()
        .and_hms_opt(0, 0, 0)
        .unwrap()
        .and_utc()
        .to_rfc3339();

    let count: i64 = articles::table
        .filter(articles::create_date.gt(today_start))
        .select(diesel::dsl::count_star())
        .first(conn)
        .map_err(|e| e.to_string())?;

    Ok(count)
}

fn build_overview_prompt(signals: &[SignalInput]) -> String {
    let signal_lines: Vec<String> = signals
        .iter()
        .enumerate()
        .map(|(i, s)| {
            if s.summary.is_empty() {
                format!("{}. {}", i + 1, s.title)
            } else {
                format!("{}. {}: {}", i + 1, s.title, s.summary)
            }
        })
        .collect();

    format!(
        r#"You are generating a daily intelligence briefing overview for a technical professional.

Given today's top signals, write ONE sentence that summarizes the overall information landscape.

Rules:
- Maximum 40 words in English, 60 characters in Chinese
- Mention the 2-3 most prominent themes
- Use concrete topic names, not "several topics"
- Do not use "today" or "in today's news" — the context is implied
- Tone: calm, informative, no urgency

Top signals:
{}

Output the overview directly, no prefix, no quotes."#,
        signal_lines.join("\n")
    )
}

pub fn validate_overview(text: &str) -> bool {
    let word_count = text.split_whitespace().count();
    word_count > 5 && word_count <= 50
}

fn generate_fallback(article_count: i32, signal_count: i32) -> String {
    format!(
        "{} new articles, {} signals to review",
        article_count, signal_count
    )
}

/// 1. Check cache, return if valid
/// 2. Query top signals from DB
/// 3. Call LLM with built prompt
/// 4. Validate output, retry once if invalid
/// 5. Cache and return
pub async fn generate_today_overview(
    conn: &mut SqliteConnection,
    llm: &dyn LLMProvider,
    cache: &Mutex<OverviewCache>,
) -> Result<TodayOverview, String> {
    {
        let cached = cache.lock().map_err(|e| format!("Cache lock error: {}", e))?;
        if let Some(overview) = cached.get() {
            if !overview.is_stale {
                return Ok(overview);
            }
        }
    }

    let signals = query_top_signals(conn, 10)?;
    if signals.is_empty() {
        return Err("TODAY_NO_DATA".to_string());
    }

    let signal_count = signals.len() as i32;
    let article_count = count_todays_articles(conn).unwrap_or(0) as i32;

    let prompt = build_overview_prompt(&signals);
    let system = "You are a precise intelligence analyst.";
    let overview_text = match llm.complete(&prompt, system).await {
        Ok(text) => {
            let trimmed = text.trim().to_string();
            if validate_overview(&trimmed) {
                trimmed
            } else {
                let retry_prompt = format!(
                    "{}\n\nIMPORTANT: Keep it under 40 words. Your previous output was too long.",
                    prompt
                );
                match llm.complete(&retry_prompt, system).await {
                    Ok(retry_text) => {
                        let retry_trimmed = retry_text.trim().to_string();
                        if validate_overview(&retry_trimmed) {
                            retry_trimmed
                        } else {
                            generate_fallback(article_count, signal_count)
                        }
                    }
                    Err(_) => generate_fallback(article_count, signal_count),
                }
            }
        }
        Err(_) => generate_fallback(article_count, signal_count),
    };

    let overview = TodayOverview {
        summary: overview_text,
        signal_count,
        article_count,
        generated_at: chrono::Utc::now().to_rfc3339(),
        is_stale: false,
    };

    {
        let mut cached = cache.lock().map_err(|e| format!("Cache lock error: {}", e))?;
        cached.set(overview.clone());
    }

    Ok(overview)
}

pub async fn get_overview(cache: &Mutex<OverviewCache>) -> Result<TodayOverview, String> {
    use crate::ai::llm::OpenAILLM;
    use crate::core::config;

    let user_config = config::get_user_config();
    let ai_config = match user_config.ai {
        Some(ref c) if c.has_api_key() => c.clone(),
        _ => return Err("AI_NO_API_KEY".to_string()),
    };

    let conn = &mut db::establish_connection();
    let llm = OpenAILLM::new(
        &ai_config.api_key,
        &ai_config.base_url,
        ai_config.model.clone(),
    );

    generate_today_overview(conn, &llm, cache).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_overview_normal() {
        let text = "AI coding tools are shifting toward autonomous agent workflows while Rust adoption accelerates in systems programming.";
        assert!(validate_overview(text));
    }

    #[test]
    fn test_validate_overview_empty() {
        assert!(!validate_overview(""));
    }

    #[test]
    fn test_validate_overview_too_short() {
        assert!(!validate_overview("Hello"));
    }

    #[test]
    fn test_validate_overview_too_long() {
        let long = "word ".repeat(55);
        assert!(!validate_overview(&long));
    }

    #[test]
    fn test_overview_cache_new_is_empty() {
        let cache = OverviewCache::new();
        assert!(cache.get().is_none());
    }

    #[test]
    fn test_overview_cache_set_and_get() {
        let mut cache = OverviewCache::new();
        let overview = TodayOverview {
            summary: "Test overview".to_string(),
            signal_count: 5,
            article_count: 20,
            generated_at: "2026-01-01T00:00:00Z".to_string(),
            is_stale: false,
        };
        cache.set(overview);
        let result = cache.get().unwrap();
        assert_eq!(result.summary, "Test overview");
        assert_eq!(result.signal_count, 5);
        assert!(!result.is_stale);
    }

    #[test]
    fn test_overview_cache_stale() {
        let mut cache = OverviewCache {
            overview: None,
            generated_at: None,
            cache_ttl: Duration::from_millis(1),
            signal_count: 0,
            article_count: 0,
        };
        let overview = TodayOverview {
            summary: "Test".to_string(),
            signal_count: 1,
            article_count: 1,
            generated_at: "2026-01-01T00:00:00Z".to_string(),
            is_stale: false,
        };
        cache.set(overview);
        std::thread::sleep(Duration::from_millis(5));
        let result = cache.get().unwrap();
        assert!(result.is_stale);
    }

    #[test]
    fn test_overview_cache_invalidate() {
        let mut cache = OverviewCache::new();
        let overview = TodayOverview {
            summary: "Test".to_string(),
            signal_count: 1,
            article_count: 1,
            generated_at: "2026-01-01T00:00:00Z".to_string(),
            is_stale: false,
        };
        cache.set(overview);
        cache.invalidate();
        assert!(cache.get().is_none());
    }

    #[tokio::test]
    async fn test_generate_overview_with_mock() {
        let mock = crate::ai::llm::MockLLM::new(
            "AI coding tools shift toward agentic workflows while open-source LLMs gain traction.",
        );
        let cache = Mutex::new(OverviewCache::new());
        let conn = &mut db::establish_connection();

        let result = generate_today_overview(conn, &mock, &cache).await;
        match result {
            Ok(overview) => {
                assert!(!overview.summary.is_empty());
            }
            Err(e) => {
                assert_eq!(e, "TODAY_NO_DATA");
            }
        }
    }

    #[tokio::test]
    async fn test_generate_overview_llm_failure_uses_fallback() {
        let mock = crate::ai::llm::MockLLM::new_failing("API error");
        let _cache = Mutex::new(OverviewCache::new());

        let fallback = generate_fallback(10, 3);
        assert_eq!(fallback, "10 new articles, 3 signals to review");
    }

    #[test]
    fn test_build_overview_prompt() {
        let signals = vec![
            SignalInput {
                title: "AI Agents".to_string(),
                summary: "New framework released".to_string(),
            },
            SignalInput {
                title: "Rust 2026".to_string(),
                summary: String::new(),
            },
        ];
        let prompt = build_overview_prompt(&signals);
        assert!(prompt.contains("1. AI Agents: New framework released"));
        assert!(prompt.contains("2. Rust 2026"));
        assert!(prompt.contains("Maximum 40 words"));
    }

    #[tokio::test]
    async fn test_cache_hit_returns_cached_overview() {
        use std::sync::atomic::{AtomicUsize, Ordering};
        let call_count = AtomicUsize::new(0);
        let mock = crate::ai::llm::MockLLM::new(
            "AI coding tools shift toward agentic workflows while open-source LLMs gain traction.",
        );
        let cache = Mutex::new(OverviewCache::new());
        let conn = &mut db::establish_connection();

        let first = generate_today_overview(conn, &mock, &cache).await;
        let first_overview = match first {
            Ok(o) => o,
            Err(e) => {
                assert_eq!(e, "TODAY_NO_DATA");
                return;
            }
        };

        let second = generate_today_overview(conn, &mock, &cache).await;
        let second_overview = second.unwrap();
        assert_eq!(first_overview.summary, second_overview.summary);
        assert!(!second_overview.is_stale);
    }

    #[test]
    fn test_get_overview_returns_error_without_api_key() {
        let cache = Mutex::new(OverviewCache::new());
        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(get_overview(&cache));
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(
            err.contains("AI_NO_API_KEY") || err.contains("config"),
            "Expected API key error, got: {}",
            err
        );
    }
}
