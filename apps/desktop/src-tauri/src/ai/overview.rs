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
    r#"你正在为技术专业人士生成每日情报简报概览。

根据今日最重要的信号，用一句话总结整体信息格局。

规则：
- 中文不超过60字，英文不超过40词
- 提及2-3个最突出的主题
- 使用具体的主题名称，不要用"几个主题"之类的说法
- 不要使用"今天"或"今日新闻中"——上下文已隐含
- 语气：冷静、信息丰富、不要紧迫感

今日重要信号：
{}

请直接输出概览内容，不要加前缀或引号。"#,
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
    } else if let Some(ref overview) = cache.overview {
      return Ok(TodayOverview {
        is_stale: true,
        ..overview.clone()
      });
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
      summary: format!("Daily briefing unavailable: {} articles, {} signals.", article_count, signal_count),
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
  let system = "你是一位精确的情报分析师，负责生成每日简报。请用中文输出。";

  let result = match llm.complete(&prompt, system).await {
    Ok(text) => {
      let trimmed = text.trim().to_string();
      if validate_overview(&trimmed) {
        trimmed
      } else {
        format!(
          "Daily briefing unavailable: {} articles, {} signals.",
          article_count, signal_count
        )
      }
    }
    Err(_) => {
      format!(
        "Daily briefing unavailable: {} articles, {} signals.",
        article_count, signal_count
      )
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
