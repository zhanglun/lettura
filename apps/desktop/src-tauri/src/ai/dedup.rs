use crate::schema::article_ai_analysis;
use diesel::prelude::*;

const DEDUP_SIMILARITY_THRESHOLD: f64 = 0.85;
const LOW_DENSITY_CHAR_THRESHOLD: usize = 100;
const DENSITY_PENALTY: f64 = 0.3;

pub struct DuplicateGroup {
  pub primary_index: usize,
  pub primary_content_len: usize,
  pub duplicate_indices: Vec<usize>,
}

/// Find groups of duplicate articles based on embedding similarity.
///
/// Current implementation uses in-memory cosine similarity comparison.
/// TODO(v2.7+): Replace with sqlite-vec for O(n log n) ANN search when
/// article volume exceeds 1000+. The interface remains the same:
///   input:  embeddings + content_lengths
///   output: Vec<DuplicateGroup>
pub fn find_duplicate_groups(
  embeddings: &[Vec<f32>],
  content_lengths: &[usize],
) -> Vec<DuplicateGroup> {
  if embeddings.is_empty() {
    return vec![];
  }

  let n = embeddings.len();
  let mut marked: Vec<bool> = vec![false; n];
  let mut groups: Vec<DuplicateGroup> = vec![];

  for i in 0..n {
    if marked[i] {
      continue;
    }

    let mut group_indices: Vec<usize> = vec![i];

    for j in (i + 1)..n {
      if marked[j] {
        continue;
      }

      let sim = cosine_similarity(&embeddings[i], &embeddings[j]);
      if sim > DEDUP_SIMILARITY_THRESHOLD {
        group_indices.push(j);
        marked[j] = true;
      }
    }

    if group_indices.len() > 1 {
      let primary_idx = group_indices
        .iter()
        .copied()
        .max_by_key(|&idx| content_lengths[idx])
        .unwrap_or(i);

      let duplicate_indices: Vec<usize> = group_indices
        .into_iter()
        .filter(|&idx| idx != primary_idx)
        .collect();

      marked[primary_idx] = true;

      groups.push(DuplicateGroup {
        primary_content_len: content_lengths[primary_idx],
        primary_index: primary_idx,
        duplicate_indices,
      });
    }
  }

  groups
}

pub fn evaluate_information_density_rule_based(content: &str) -> f64 {
  let char_count = content.chars().count();
  if char_count == 0 {
    return 0.0;
  }

  let word_count = content.split_whitespace().count();
  let avg_word_length = if word_count > 0 {
    char_count as f64 / word_count as f64
  } else {
    0.0
  };

  let unique_chars: std::collections::HashSet<char> = content.chars().collect();
  let lexical_diversity = unique_chars.len() as f64 / char_count as f64;

  let length_score = (char_count as f64 / 500.0).min(1.0);
  let word_score = (avg_word_length / 8.0).min(1.0);
  let diversity_score = lexical_diversity.min(1.0);

  (0.4 * length_score + 0.3 * word_score + 0.3 * diversity_score).clamp(0.0, 1.0)
}

pub fn is_low_density(content: &str) -> bool {
  content.chars().count() < LOW_DENSITY_CHAR_THRESHOLD
}

pub fn density_penalty(content: &str) -> f64 {
  if is_low_density(content) {
    DENSITY_PENALTY
  } else {
    0.0
  }
}

pub fn persist_dedup_results(
  conn: &mut SqliteConnection,
  article_ids: &[i32],
  groups: &[DuplicateGroup],
  content_lengths: &[usize],
) -> Result<usize, String> {
  let mut count = 0;

  for group in groups {
    let primary_article_id = article_ids[group.primary_index];

    let primary_analysis_id: Option<i32> = article_ai_analysis::table
      .filter(article_ai_analysis::article_id.eq(primary_article_id))
      .select(article_ai_analysis::id)
      .first(conn)
      .ok()
      .flatten();

    let primary_aid = match primary_analysis_id {
      Some(id) => id,
      None => continue,
    };

    let density =
      evaluate_information_density_rule_based(&"x".repeat(content_lengths[group.primary_index]));

    diesel::update(article_ai_analysis::table.filter(article_ai_analysis::id.eq(primary_aid)))
      .set(article_ai_analysis::information_density.eq(Some(density as f32)))
      .execute(conn)
      .ok();

    for &dup_idx in &group.duplicate_indices {
      let dup_article_id = article_ids[dup_idx];

      diesel::update(
        article_ai_analysis::table.filter(article_ai_analysis::article_id.eq(dup_article_id)),
      )
      .set((
        article_ai_analysis::is_duplicate.eq(true),
        article_ai_analysis::duplicate_of.eq(Some(primary_aid)),
      ))
      .execute(conn)
      .ok();

      count += 1;
    }
  }

  for (i, article_id) in article_ids.iter().enumerate() {
    let is_dup = groups.iter().any(|g| g.duplicate_indices.contains(&i));
    if is_dup {
      continue;
    }

    let density = evaluate_information_density_rule_based(&"x".repeat(content_lengths[i]));

    diesel::update(
      article_ai_analysis::table.filter(article_ai_analysis::article_id.eq(*article_id)),
    )
    .set(article_ai_analysis::information_density.eq(Some(density as f32)))
    .execute(conn)
    .ok();
  }

  Ok(count)
}

pub fn get_dedup_stats(conn: &mut SqliteConnection) -> Result<DedupStats, String> {
  let total: i64 = article_ai_analysis::table
    .count()
    .first(conn)
    .map_err(|e| e.to_string())?;

  let duplicates: i64 = article_ai_analysis::table
    .filter(article_ai_analysis::is_duplicate.eq(true))
    .count()
    .first(conn)
    .map_err(|e| e.to_string())?;

  let avg_density: Option<f64> = article_ai_analysis::table
    .filter(article_ai_analysis::information_density.is_not_null())
    .select(diesel::dsl::avg(article_ai_analysis::information_density))
    .first(conn)
    .map_err(|e| e.to_string())?;

  let distinct_primary_ids: Vec<i32> = article_ai_analysis::table
    .filter(article_ai_analysis::duplicate_of.is_not_null())
    .select(article_ai_analysis::duplicate_of)
    .load::<Option<i32>>(conn)
    .map_err(|e| e.to_string())?
    .into_iter()
    .flatten()
    .collect();

  let groups_with_dups = distinct_primary_ids.len() as i32;

  Ok(DedupStats {
    total_analyzed: total as i32,
    duplicates_found: duplicates as i32,
    duplicate_groups: groups_with_dups,
    avg_information_density: avg_density.unwrap_or(0.0) as f32,
  })
}

#[derive(Debug, serde::Serialize)]
pub struct DedupStats {
  pub total_analyzed: i32,
  pub duplicates_found: i32,
  pub duplicate_groups: i32,
  pub avg_information_density: f32,
}

fn cosine_similarity(a: &[f32], b: &[f32]) -> f64 {
  if a.len() != b.len() || a.is_empty() {
    return 0.0;
  }
  let dot: f64 = a
    .iter()
    .zip(b.iter())
    .map(|(x, y)| (*x as f64) * (*y as f64))
    .sum();
  let norm_a: f64 = a.iter().map(|x| (*x as f64).powi(2)).sum::<f64>().sqrt();
  let norm_b: f64 = b.iter().map(|x| (*x as f64).powi(2)).sum::<f64>().sqrt();
  if norm_a == 0.0 || norm_b == 0.0 {
    return 0.0;
  }
  dot / (norm_a * norm_b)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_find_duplicate_groups_empty() {
    let groups = find_duplicate_groups(&[], &[]);
    assert!(groups.is_empty());
  }

  #[test]
  fn test_find_duplicate_groups_no_duplicates() {
    let embeddings = vec![vec![1.0, 0.0, 0.0], vec![0.0, 1.0, 0.0]];
    let lengths = vec![500, 300];
    let groups = find_duplicate_groups(&embeddings, &lengths);
    assert!(groups.is_empty());
  }

  #[test]
  fn test_find_duplicate_groups_with_duplicates() {
    let embeddings = vec![
      vec![1.0, 0.0, 0.0],
      vec![0.999, 0.001, 0.0],
      vec![0.0, 1.0, 0.0],
    ];
    let lengths = vec![500, 300, 200];
    let groups = find_duplicate_groups(&embeddings, &lengths);
    assert_eq!(groups.len(), 1);
    assert_eq!(groups[0].primary_index, 0);
    assert_eq!(groups[0].duplicate_indices, vec![1]);
  }

  #[test]
  fn test_find_duplicate_groups_longer_content_is_primary() {
    let embeddings = vec![vec![1.0, 0.0, 0.0], vec![0.999, 0.001, 0.0]];
    let lengths = vec![100, 800];
    let groups = find_duplicate_groups(&embeddings, &lengths);
    assert_eq!(groups[0].primary_index, 1);
    assert_eq!(groups[0].duplicate_indices, vec![0]);
  }

  #[test]
  fn test_evaluate_information_density_empty() {
    let density = evaluate_information_density_rule_based("");
    assert!((density - 0.0).abs() < 0.01);
  }

  #[test]
  fn test_evaluate_information_density_short() {
    let density = evaluate_information_density_rule_based("hello world");
    assert!(density > 0.0);
    assert!(density < 0.5);
  }

  #[test]
  fn test_evaluate_information_density_long() {
    let content: String = "word ".repeat(200);
    let density = evaluate_information_density_rule_based(&content);
    assert!(density > 0.5);
  }

  #[test]
  fn test_is_low_density() {
    assert!(is_low_density("short"));
    assert!(!is_low_density(&"x".repeat(200)));
  }

  #[test]
  fn test_density_penalty() {
    assert_eq!(density_penalty("short"), 0.3);
    assert_eq!(density_penalty(&"x".repeat(200)), 0.0);
  }

  #[test]
  fn test_cosine_similarity_identical() {
    let a = vec![1.0, 0.0, 0.0];
    let sim = cosine_similarity(&a, &a);
    assert!((sim - 1.0).abs() < 0.001);
  }

  #[test]
  fn test_cosine_similarity_orthogonal() {
    let a = vec![1.0, 0.0];
    let b = vec![0.0, 1.0];
    let sim = cosine_similarity(&a, &b);
    assert!(sim.abs() < 0.001);
  }
}
