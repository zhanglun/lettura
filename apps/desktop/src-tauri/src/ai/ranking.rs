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

pub fn rank_articles(
    articles: &[(i32, f64, f64, f64, f64)],
) -> Vec<(i32, f64)> {
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
}
