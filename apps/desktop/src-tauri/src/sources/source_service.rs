use super::models::{NewSource, Source};
use crate::db;
use crate::models::Feed;
use crate::schema;
use crate::feed;
use diesel::prelude::*;
use uuid::Uuid;

pub fn create_source(
  feed_url: &str,
  title: Option<&str>,
  site_url: Option<&str>,
  source_type: &str,
  pack_id: Option<&str>,
  language: &str,
) -> Result<Source, String> {
  let mut connection = db::establish_connection();

  let existing = schema::sources::dsl::sources
    .filter(schema::sources::feed_url.eq(feed_url))
    .filter(schema::sources::dsl::source_type.eq(source_type))
    .first::<Source>(&mut connection)
    .optional()
    .map_err(|e| format!("Database error: {}", e))?;

  if existing.is_some() {
    return Err("SRC_ALREADY_EXISTS".to_string());
  }

  let uuid = Uuid::new_v4().hyphenated().to_string();

  let new_source = NewSource {
    uuid,
    feed_url: feed_url.to_string(),
    title: title.map(|s| s.to_string()),
    site_url: site_url.map(|s| s.to_string()),
    source_type: source_type.to_string(),
    pack_id: pack_id.map(|s| s.to_string()),
    language: language.to_string(),
    quality_score: 0.5,
    weight: 1.0,
    is_active: true,
  };

  diesel::insert_into(schema::sources::dsl::sources)
    .values(&new_source)
    .execute(&mut connection)
    .map_err(|e| format!("Failed to create source: {}", e))?;

  schema::sources::dsl::sources
    .filter(schema::sources::uuid.eq(&new_source.uuid))
    .first::<Source>(&mut connection)
    .map_err(|e| format!("Failed to retrieve created source: {}", e))
}

pub fn get_sources_by_pack(pack_id: &str) -> Result<Vec<Source>, String> {
  let mut connection = db::establish_connection();

  schema::sources::dsl::sources
    .filter(schema::sources::pack_id.eq(pack_id))
    .load::<Source>(&mut connection)
    .map_err(|e| format!("Database error: {}", e))
}

pub fn get_sources_by_type(source_type: &str) -> Result<Vec<Source>, String> {
  let mut connection = db::establish_connection();

  schema::sources::dsl::sources
    .filter(schema::sources::dsl::source_type.eq(source_type))
    .load::<Source>(&mut connection)
    .map_err(|e| format!("Database error: {}", e))
}

#[derive(Debug, serde::Serialize, Clone)]
pub struct OpmlImportAsSourceResult {
  pub feed_count: usize,
  pub source_count: usize,
  pub new_feed_uuids: Vec<String>,
  pub failed_count: usize,
  pub errors: Vec<String>,
}

pub fn import_opml_as_source(opml_content: &str) -> Result<OpmlImportAsSourceResult, String> {
  let opml_import = feed::opml::import_opml(opml_content)?;

  let mut result = OpmlImportAsSourceResult {
    feed_count: opml_import.feed_count,
    source_count: 0,
    new_feed_uuids: Vec::new(),
    failed_count: opml_import.failed_count,
    errors: opml_import.errors,
  };

  let mut connection = db::establish_connection();

  let feeds: Vec<Feed> = schema::feeds::dsl::feeds.load(&mut connection)
    .map_err(|e| format!("Database error: {}", e))?;

  for feed_record in feeds {
    let src_result = create_source(
      &feed_record.feed_url,
      Some(&feed_record.title),
      Some(&feed_record.link),
      "opml_import",
      None,
      "en",
    );

    match src_result {
      Ok(source) => {
        diesel::update(
          schema::feeds::dsl::feeds.filter(schema::feeds::uuid.eq(&feed_record.uuid))
        )
        .set(schema::feeds::source_id.eq(source.id))
        .execute(&mut connection)
        .ok();
        result.source_count += 1;
        result.new_feed_uuids.push(feed_record.uuid);
      }
      Err(_) => {}
    }
  }

  Ok(result)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_create_source() {
    let result = create_source(
      "https://example.com/feed.xml",
      Some("Test Feed"),
      Some("https://example.com"),
      "starter_pack",
      Some("ai"),
      "en",
    );
    assert!(result.is_ok());
    let source = result.unwrap();
    assert_eq!(source.feed_url, "https://example.com/feed.xml");
  }

  #[test]
  fn test_create_duplicate_source() {
    let feed_url = "https://test-dup.example.com/feed.xml";
    create_source(feed_url, Some("Test"), None, "starter_pack", Some("ai"), "en").ok();
    let result = create_source(feed_url, Some("Test"), None, "starter_pack", Some("ai"), "en");
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("SRC_ALREADY_EXISTS"));
  }

  #[test]
  fn test_get_sources_by_pack() {
    create_source(
      "https://test-pack.example.com/feed.xml",
      Some("Test"),
      None,
      "starter_pack",
      Some("test_pack_query"),
      "en",
    )
    .ok();
    let result = get_sources_by_pack("test_pack_query");
    assert!(result.is_ok());
    assert!(!result.unwrap().is_empty());
  }

  #[test]
  fn test_get_sources_by_type() {
    let result = get_sources_by_type("starter_pack");
    assert!(result.is_ok());
  }
}
