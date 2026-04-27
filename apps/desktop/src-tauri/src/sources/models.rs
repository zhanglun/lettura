use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Queryable, Serialize, QueryableByName)]
pub struct Source {
  #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Integer>)]
  pub id: Option<i32>,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub uuid: String,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub feed_url: String,
  #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Text>)]
  pub title: Option<String>,
  #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Text>)]
  pub site_url: Option<String>,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub source_type: String,
  #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Text>)]
  pub pack_id: Option<String>,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub language: String,
  #[diesel(sql_type = diesel::sql_types::Float)]
  pub quality_score: f32,
  #[diesel(sql_type = diesel::sql_types::Float)]
  pub weight: f32,
  #[diesel(sql_type = diesel::sql_types::Bool)]
  pub is_active: bool,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub create_date: String,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub update_date: String,
}

#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = crate::schema::sources)]
pub struct NewSource {
  pub uuid: String,
  pub feed_url: String,
  pub title: Option<String>,
  pub site_url: Option<String>,
  pub source_type: String,
  pub pack_id: Option<String>,
  pub language: String,
  pub quality_score: f32,
  pub weight: f32,
  pub is_active: bool,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct PackSource {
  pub feed_url: String,
  pub title: String,
  pub site_url: String,
  pub language: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct StarterPack {
  pub id: String,
  pub name: String,
  pub description: String,
  pub icon: String,
  pub language: String,
  pub tags: Vec<String>,
  pub sources: Vec<PackSource>,
}

#[derive(Debug, Clone, Serialize)]
pub struct StarterPackSummary {
  pub id: String,
  pub name: String,
  pub description: String,
  pub icon: String,
  pub source_count: usize,
  pub language: String,
  pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PackPreviewResponse {
  pub id: String,
  pub name: String,
  pub description: String,
  pub icon: String,
  pub language: String,
  pub tags: Vec<String>,
  pub sources: Vec<PackSource>,
}

#[derive(Debug, Clone, Serialize)]
pub struct InstallResult {
  pub installed_feeds: usize,
  pub installed_sources: usize,
  pub sync_started: bool,
}

