use super::models::{PackSource, StarterPack, StarterPackSummary};
use super::source_service;
use crate::db;
use crate::models::{NewFeed, Feed};
use crate::schema;
use diesel::prelude::*;
use std::collections::HashSet;
use uuid::Uuid;

const PACK_IDS: &[&str] = &[
  "ai",
  "developer",
  "startup",
  "product",
  "design",
  "science",
  "business",
  "tech-news",
];

fn pack_json(id: &str) -> Result<&'static str, String> {
  match id {
    "ai" => Ok(include_str!("packs/ai.json")),
    "developer" => Ok(include_str!("packs/developer.json")),
    "startup" => Ok(include_str!("packs/startup.json")),
    "product" => Ok(include_str!("packs/product.json")),
    "design" => Ok(include_str!("packs/design.json")),
    "science" => Ok(include_str!("packs/science.json")),
    "business" => Ok(include_str!("packs/business.json")),
    "tech-news" => Ok(include_str!("packs/tech-news.json")),
    _ => Err(format!("SRC_NOT_FOUND: pack '{}' does not exist", id)),
  }
}

/// Parse a single StarterPack from JSON
pub fn load_pack(pack_id: &str) -> Result<StarterPack, String> {
  let json_str = pack_json(pack_id)?;
  let pack: StarterPack =
    serde_json::from_str(json_str).map_err(|e| format!("Failed to parse pack JSON: {}", e))?;

  if pack.id != pack_id {
    return Err(format!(
      "Pack ID mismatch: expected '{}', got '{}'",
      pack_id, pack.id
    ));
  }

  Ok(pack)
}

/// Get all available packs as summaries (without full source lists)
pub fn get_all_packs() -> Result<Vec<StarterPackSummary>, String> {
  let mut summaries = Vec::with_capacity(PACK_IDS.len());

  for id in PACK_IDS {
    let pack = load_pack(id)?;
    summaries.push(StarterPackSummary {
      id: pack.id,
      name: pack.name,
      description: pack.description,
      icon: pack.icon,
      source_count: pack.sources.len(),
      language: pack.language,
      tags: pack.tags,
    });
  }

  Ok(summaries)
}

pub struct InstallStats {
  pub installed_feeds: usize,
  pub installed_sources: usize,
  pub new_feed_uuids: Vec<String>,
}

pub fn install_packs_core(pack_ids: &[String]) -> Result<InstallStats, String> {
  let mut all_sources: Vec<(String, PackSource)> = Vec::new();
  let mut seen_feed_urls: HashSet<String> = HashSet::new();

  for pack_id in pack_ids {
    let pack = load_pack(pack_id).map_err(|e| {
      if e.contains("SRC_NOT_FOUND") {
        format!("SRC_NOT_FOUND: {}", e)
      } else {
        format!("SRC_INSTALL_FAILED: {}", e)
      }
    })?;

    for source in &pack.sources {
      if seen_feed_urls.insert(source.feed_url.clone()) {
        all_sources.push((pack_id.clone(), source.clone()));
      }
    }
  }

  let mut connection = db::establish_connection();
  let mut installed_feeds = 0;
  let mut installed_sources = 0;
  let mut new_feed_uuids: Vec<String> = Vec::new();

  let last_sort = {
    let last = schema::feeds::dsl::feeds
      .select(schema::feeds::sort)
      .order(schema::feeds::sort.desc())
      .first::<i32>(&mut connection)
      .optional()
      .unwrap_or(None);
    last.unwrap_or(0)
  };

  let mut sort_counter = last_sort + 1;

  for (pack_id, source) in &all_sources {
    let source_result = source_service::create_source(
      &source.feed_url,
      Some(&source.title),
      Some(&source.site_url),
      "starter_pack",
      Some(pack_id),
      &source.language,
    );

    let source = match source_result {
      Ok(s) => s,
      Err(e) if e == "SRC_ALREADY_EXISTS" => continue,
      Err(e) => return Err(format!("SRC_INSTALL_FAILED: {}", e)),
    };

    let existing_feed = schema::feeds::dsl::feeds
      .filter(schema::feeds::feed_url.eq(&source.feed_url))
      .first::<Feed>(&mut connection)
      .optional()
      .map_err(|e| format!("Database error: {}", e))?;

    if existing_feed.is_some() {
      continue;
    }

    let feed_uuid = Uuid::new_v4().hyphenated().to_string();
    let new_feed = NewFeed {
      uuid: feed_uuid.clone(),
      feed_type: "rss".to_string(),
      title: source.title.clone().unwrap_or_default(),
      link: source.site_url.clone().unwrap_or_default(),
      logo: String::new(),
      feed_url: source.feed_url.clone(),
      description: String::new(),
      pub_date: String::new(),
      updated: String::new(),
      sort: sort_counter,
    };

    diesel::insert_into(schema::feeds::dsl::feeds)
      .values(&new_feed)
      .execute(&mut connection)
      .map_err(|e| format!("Failed to create feed: {}", e))?;

    diesel::update(schema::feeds::dsl::feeds.filter(schema::feeds::uuid.eq(&feed_uuid)))
      .set(schema::feeds::source_id.eq(source.id))
      .execute(&mut connection)
      .map_err(|e| format!("Failed to link feed to source: {}", e))?;

    installed_feeds += 1;
    installed_sources += 1;
    sort_counter += 1;
    new_feed_uuids.push(feed_uuid);
  }

  Ok(InstallStats {
    installed_feeds,
    installed_sources,
    new_feed_uuids,
  })
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_load_ai_pack() {
    let pack = load_pack("ai").unwrap();
    assert_eq!(pack.id, "ai");
    assert!(!pack.sources.is_empty());
  }

  #[test]
  fn test_load_nonexistent_pack() {
    let result = load_pack("nonexistent");
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("SRC_NOT_FOUND"));
  }

  #[test]
  fn test_get_all_packs() {
    let packs = get_all_packs().unwrap();
    assert_eq!(packs.len(), 8);
  }

  #[test]
  fn test_pack_source_fields_not_empty() {
    let pack = load_pack("ai").unwrap();
    for source in &pack.sources {
      assert!(!source.feed_url.is_empty(), "feed_url should not be empty");
      assert!(!source.title.is_empty(), "title should not be empty");
    }
  }
}
