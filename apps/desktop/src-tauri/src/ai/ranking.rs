use chrono::Utc;

pub fn compute_relevance_score(
  cluster_distance: f64,
  source_quality: f64,
  article_age_hours: f64,
  density_penalty: f64,
) -> f64 {
  let distance_score = 1.0 - cluster_distance;
  let time_decay = (-article_age_hours / 168.0).exp();
  let raw = 0.5 * distance_score + 0.3 * source_quality + 0.2 * time_decay;
  (raw - density_penalty).clamp(0.0, 1.0)
}

pub fn rank_articles(articles: &[(i32, f64, f64, f64, f64)]) -> Vec<(i32, f64)> {
  let mut scored: Vec<(i32, f64)> = articles
    .iter()
    .map(|(id, distance, quality, age_hours, density_penalty)| {
      let score = compute_relevance_score(*distance, *quality, *age_hours, *density_penalty);
      (*id, score)
    })
    .collect();

  scored.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
  scored
}

fn normalize(value: f64, min: f64, max: f64) -> f64 {
  ((value - min) / (max - min)).clamp(0.0, 1.0)
}

pub fn compute_topic_relevance(
  article_count: i32,
  source_count: i32,
  recent_change_rate: f64,
  avg_feedback_score: f64,
  is_following: bool,
) -> f64 {
  let w1 = 0.25;
  let w2 = 0.20;
  let w3 = 0.30;
  let w4 = 0.15;
  let w5 = 0.10;

  let article_score = normalize(article_count as f64, 1.0, 50.0);
  let source_score = normalize(source_count as f64, 1.0, 20.0);
  let recency_score = recent_change_rate.clamp(0.0, 1.0);
  let feedback_score = (avg_feedback_score + 1.0) / 2.0;
  let follow_bonus = if is_following { 1.0 } else { 0.0 };

  (w1 * article_score + w2 * source_score + w3 * recency_score
    + w4 * feedback_score + w5 * follow_bonus)
    .min(1.0)
}

pub fn compute_topic_relevance_simple(
  article_count: i32,
  source_count: i32,
  last_updated_at: &str,
  now: &chrono::NaiveDateTime,
  is_following: bool,
) -> f64 {
  let recency_hours = match chrono::NaiveDateTime::parse_from_str(last_updated_at, "%Y-%m-%d %H:%M:%S") {
    Ok(dt) => (*now - dt).num_seconds() as f64 / 3600.0,
    Err(_) => 168.0,
  };
  let recent_change_rate = (-recency_hours / 48.0).exp();
  let w1 = 0.30;
  let w2 = 0.25;
  let w3 = 0.35;
  let w5 = 0.10;

  let article_score = normalize(article_count as f64, 1.0, 50.0);
  let source_score = normalize(source_count as f64, 1.0, 20.0);
  let follow_bonus = if is_following { 1.0 } else { 0.0 };

  (w1 * article_score + w2 * source_score + w3 * recent_change_rate + w5 * follow_bonus).min(1.0)
}

fn hours_since(pub_date_str: &str) -> f64 {
  let pub_date = chrono::DateTime::parse_from_rfc3339(pub_date_str);
  match pub_date {
    Ok(dt) => {
      let now = Utc::now();
      (now - dt.with_timezone(&Utc)).num_seconds() as f64 / 3600.0
    }
    Err(_) => 168.0,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_relevance_score_range() {
    let score = compute_relevance_score(0.2, 0.8, 24.0, 0.0);
    assert!((0.0..=1.0).contains(&score));
  }

  #[test]
  fn test_higher_quality_gets_higher_score() {
    let low_quality = compute_relevance_score(0.2, 0.3, 24.0, 0.0);
    let high_quality = compute_relevance_score(0.2, 0.9, 24.0, 0.0);
    assert!(high_quality > low_quality);
  }

  #[test]
  fn test_closer_distance_gets_higher_score() {
    let far = compute_relevance_score(0.8, 0.7, 24.0, 0.0);
    let close = compute_relevance_score(0.1, 0.7, 24.0, 0.0);
    assert!(close > far);
  }

  #[test]
  fn test_density_penalty_reduces_score() {
    let no_penalty = compute_relevance_score(0.2, 0.8, 24.0, 0.0);
    let with_penalty = compute_relevance_score(0.2, 0.8, 24.0, 0.3);
    assert!(no_penalty > with_penalty);
  }

  #[test]
  fn test_rank_articles_sorted() {
    let articles = vec![
      (1, 0.5, 0.5, 48.0, 0.0),
      (2, 0.1, 0.9, 2.0, 0.0),
      (3, 0.8, 0.3, 72.0, 0.0),
    ];
    let ranked = rank_articles(&articles);
    assert_eq!(ranked[0].0, 2);
    assert!(ranked[0].1 >= ranked[1].1);
  }

  #[test]
  fn test_topic_relevance_followed_higher() {
    let not_followed = compute_topic_relevance(10, 5, 0.5, 0.0, false);
    let followed = compute_topic_relevance(10, 5, 0.5, 0.0, true);
    assert!(followed > not_followed);
  }

  #[test]
  fn test_topic_relevance_range() {
    let score = compute_topic_relevance(20, 10, 0.8, 0.5, true);
    assert!((0.0..=1.0).contains(&score));
  }

  #[test]
  fn test_topic_relevance_simple_followed_higher() {
    let now = chrono::Utc::now().naive_utc();
    let ts = "2026-06-01 12:00:00".to_string();
    let not_followed = compute_topic_relevance_simple(10, 5, &ts, &now, false);
    let followed = compute_topic_relevance_simple(10, 5, &ts, &now, true);
    assert!(followed > not_followed);
  }
}
