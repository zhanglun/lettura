use crate::ai::llm::LLMProvider;
use crate::schema::article_ai_analysis;
use chrono::Utc;
use diesel::prelude::*;
use serde::Serialize;
use std::sync::{LazyLock, Mutex};
use std::time::Instant;

#[derive(Debug, Serialize, Clone)]
pub struct TodayOverview {
  pub summary: String,
  pub signal_count: i32,
  pub article_count: i32,
  pub generated_at: String,
  pub is_stale: bool,
}

struct OverviewCache {
  overview: Option<TodayOverview>,
  created_at: Option<Instant>,
}

static CACHE_TTL_SECS: u64 = 1800;

static OVERVIEW_CACHE: LazyLock<Mutex<OverviewCache>> = LazyLock::new(|| {
  Mutex::new(OverviewCache {
    overview: None,
    created_at: None,
  })
});

impl OverviewCache {
  fn get(&self) -> bool {
    match (&self.overview, &self.created_at) {
      (Some(_), Some(t)) => t.elapsed().as_secs() < CACHE_TTL_SECS,
      _ => false,
    }
  }

  fn set(&mut self, overview: TodayOverview) {
    self.created_at = Some(Instant::now());
    self.overview = Some(overview);
  }

  fn stale(&self) -> bool {
    !self.get()
  }
}

pub fn validate_overview(text: &str) -> bool {
  let word_count = text.split_whitespace().count();
  word_count > 5 && word_count <= 50
}

fn build_prompt(signals: &[(String, String)]) -> String {
  let signal_list: String = signals
    .iter()
    .enumerate()
    .map(|(i, (title, summary))| format!("{}. {} — {}", i + 1, title, summary))
    .collect::<Vec<_>>()
    .join("\n");

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
    signal_list
  )
}

pub async fn generate_today_overview(
  conn: &mut SqliteConnection,
  llm: &dyn LLMProvider,
) -> Result<TodayOverview, String> {
  {
    let cache = OVERVIEW_CACHE.lock().map_err(|e| e.to_string())?;
    if cache.get() {
      if let Some(ref overview) = cache.overview {
        return Ok(overview.clone());
      }
    }
  }

  let total_signals: i64 = article_ai_analysis::table
    .filter(article_ai_analysis::summary.is_not_null())
    .filter(article_ai_analysis::relevance_score.is_not_null())
    .count()
    .first(conn)
    .map_err(|e| e.to_string())?;

  let total_articles: i64 = article_ai_analysis::table
    .count()
    .first(conn)
    .map_err(|e| e.to_string())?;

  let signal_count = total_signals as i32;
  let article_count = total_articles as i32;

  let rows: Vec<(Option<String>, Option<String>)> = article_ai_analysis::table
    .filter(article_ai_analysis::summary.is_not_null())
    .filter(article_ai_analysis::relevance_score.is_not_null())
    .order(article_ai_analysis::relevance_score.desc())
    .limit(8)
    .select((
      article_ai_analysis::signal_title,
      article_ai_analysis::summary,
    ))
    .load(conn)
    .map_err(|e| e.to_string())?;

  let signals: Vec<(String, String)> = rows
    .into_iter()
    .filter_map(|(title, summary)| {
      let t = title.unwrap_or_default();
      let s = summary.unwrap_or_default();
      if t.is_empty() && s.is_empty() {
        None
      } else {
        Some((t, s))
      }
    })
    .collect();

  if signals.is_empty() {
    let overview = TodayOverview {
      summary: format!("{} 篇新文章，{} 条 Signal", article_count, signal_count),
      signal_count,
      article_count,
      generated_at: Utc::now().to_rfc3339(),
      is_stale: false,
    };
    let mut cache = OVERVIEW_CACHE.lock().map_err(|e| e.to_string())?;
    cache.set(overview.clone());
    return Ok(overview);
  }

  let prompt = build_prompt(&signals);
  let system = "You are a precise intelligence analyst generating daily briefings.";

  let result = match llm.complete(&prompt, system).await {
    Ok(text) => {
      let trimmed = text.trim().to_string();
      if validate_overview(&trimmed) {
        trimmed
      } else {
        trimmed
      }
    }
    Err(_) => {
      format!("{} 篇新文章，{} 条 Signal", article_count, signal_count)
    }
  };

  let overview = TodayOverview {
    summary: result,
    signal_count,
    article_count,
    generated_at: Utc::now().to_rfc3339(),
    is_stale: false,
  };

  {
    let mut cache = OVERVIEW_CACHE.lock().map_err(|e| e.to_string())?;
    cache.set(overview.clone());
  }

  Ok(overview)
}

pub fn invalidate_cache() {
  if let Ok(mut cache) = OVERVIEW_CACHE.lock() {
    cache.overview = None;
    cache.created_at = None;
  }
}

pub fn is_cache_stale() -> bool {
  match OVERVIEW_CACHE.lock() {
    Ok(cache) => cache.stale(),
    Err(_) => true,
  }
}
