use super::schema::{article_collections, article_tags, articles, collections, feed_metas, feeds, folders, tags, topic_follows, topics, topic_articles, user_feedback};
use diesel::sql_types::*;
use diesel::sqlite::Sqlite;
use serde::Serialize;

#[derive(Debug, Clone, Queryable, Serialize, QueryableByName)]
pub struct Feed {
  #[diesel(sql_type = Integer)]
  pub id: i32,

  #[diesel(sql_type = Text)]
  pub uuid: String,

  #[diesel(sql_type = Text)]
  pub title: String,

  #[diesel(sql_type = Text)]
  pub link: String,

  #[diesel(sql_type = Text)]
  pub feed_url: String,

  #[diesel(sql_type = Text)]
  pub feed_type: String,

  #[diesel(sql_type = Text)]
  pub description: String,

  #[diesel(sql_type = Text)]
  pub pub_date: String,

  #[diesel(sql_type = Text)]
  pub updated: String,

  #[diesel(sql_type = Text)]
  pub logo: String,

  #[diesel(sql_type = Integer)]
  pub health_status: i32,

  #[diesel(sql_type = Text)]
  pub failure_reason: String,

  #[diesel(sql_type = Integer)]
  pub sort: i32,

  #[diesel(sql_type = Integer)]
  pub sync_interval: i32,

  #[diesel(sql_type = Text)]
  pub last_sync_date: String,

  #[diesel(sql_type = Text)]
  pub create_date: String,

  #[diesel(sql_type = Text)]
  pub update_date: String,

  #[diesel(sql_type = Nullable<Integer>)]
  pub source_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Insertable)]
#[diesel(table_name = feeds)]
pub struct NewFeed {
  pub uuid: String,
  pub feed_type: String,
  pub title: String,
  pub link: String,
  pub logo: String,
  pub feed_url: String,
  pub description: String,
  pub pub_date: String,
  pub updated: String,
  pub sort: i32,
}

#[derive(Debug, Queryable, Serialize, QueryableByName, Selectable)]
#[diesel(check_for_backend(Sqlite))]
pub struct FeedMeta {
  #[diesel(sql_type = Integer)]
  pub id: i32,
  #[diesel(sql_type = Text)]
  pub uuid: String,
  #[diesel(sql_type = Text)]
  pub folder_uuid: String,
  #[diesel(sql_type = Integer)]
  pub sort: i32,
  #[diesel(sql_type = Text)]
  pub create_date: String,
  #[diesel(sql_type = Text)]
  pub update_date: String,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = feed_metas)]
pub struct NewFeedMeta {
  pub uuid: String,
  pub folder_uuid: String,
  pub sort: i32,
}

#[derive(Debug, Queryable, Serialize, Associations, QueryableByName)]
#[diesel(belongs_to(Feed, foreign_key = uuid))]
pub struct Article {
  #[diesel(sql_type = Integer)]
  pub id: i32,

  #[diesel(sql_type = Text)]
  pub uuid: String,

  #[diesel(sql_type = Text)]
  pub title: String,

  #[diesel(sql_type = Text)]
  pub link: String,

  #[diesel(sql_type = Text)]
  pub feed_url: String,

  #[diesel(sql_type = Text)]
  pub feed_uuid: String,

  #[diesel(sql_type = Text)]
  pub description: String,

  #[diesel(sql_type = Text)]
  pub author: String,

  #[diesel(sql_type = Text)]
  pub pub_date: String,

  #[diesel(sql_type = Text)]
  pub content: String,

  #[diesel(sql_type = Text)]
  pub create_date: String,

  #[diesel(sql_type = Text)]
  pub update_date: String,

  #[diesel(sql_type = Integer)]
  pub read_status: i32,

  #[diesel(sql_type = Text)]
  pub media_object: Option<String>,

  #[diesel(sql_type = Integer)]
  pub starred: i32,

  #[diesel(sql_type = Text)]
  pub starred_at: String,

  #[diesel(sql_type = Integer)]
  pub is_archived: i32,

  #[diesel(sql_type = Integer)]
  pub is_read_later: i32,

  #[diesel(sql_type = Text)]
  pub notes: String,
}

#[derive(Debug, Insertable, Clone)]
#[diesel(table_name = articles)]
pub struct NewArticle {
  pub uuid: String,
  pub feed_uuid: String,
  pub title: String,
  pub link: String,
  pub feed_url: String,
  pub description: String,
  pub content: String,
  pub author: String,
  pub pub_date: String,
  pub media_object: String,
}

#[derive(Debug, Queryable, QueryableByName, Clone, Serialize)]
pub struct Folder {
  #[diesel(sql_type = Integer)]
  pub id: i32,
  #[diesel(sql_type = Text)]
  pub uuid: String,
  #[diesel(sql_type = Text)]
  pub name: String,
  #[diesel(sql_type = Integer)]
  pub sort: i32,
  #[diesel(sql_type = Text)]
  pub create_date: String,
  #[diesel(sql_type = Text)]
  pub update_date: String,
}

#[derive(Debug, Insertable, Clone)]
#[diesel(table_name = folders)]
pub struct NewFolder {
  pub uuid: String,
  pub name: String,
  pub sort: i32,
}

#[derive(Debug, Queryable, QueryableByName, Serialize)]
#[diesel(table_name = user_feedback)]
pub struct UserFeedback {
  #[diesel(sql_type = Nullable<Integer>)]
  pub id: Option<i32>,
  #[diesel(sql_type = Integer)]
  pub signal_id: i32,
  #[diesel(sql_type = Varchar)]
  pub feedback_type: String,
  #[diesel(sql_type = Nullable<Text>)]
  pub comment: Option<String>,
  #[diesel(sql_type = Timestamp)]
  pub create_date: chrono::NaiveDateTime,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = user_feedback)]
pub struct NewUserFeedback {
  pub signal_id: i32,
  pub feedback_type: String,
  pub comment: Option<String>,
}

#[derive(Debug, Queryable, QueryableByName, Serialize, Clone)]
pub struct Topic {
  #[diesel(sql_type = Integer)]
  pub id: i32,
  #[diesel(sql_type = Text)]
  pub uuid: String,
  #[diesel(sql_type = Text)]
  pub title: String,
  #[diesel(sql_type = Text)]
  pub description: String,
  #[diesel(sql_type = Text)]
  pub status: String,
  #[diesel(sql_type = Integer)]
  pub article_count: i32,
  #[diesel(sql_type = Integer)]
  pub source_count: i32,
  #[diesel(sql_type = Timestamp)]
  pub first_seen_at: chrono::NaiveDateTime,
  #[diesel(sql_type = Timestamp)]
  pub last_updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = topics)]
pub struct NewTopic {
  pub uuid: String,
  pub title: String,
  pub description: String,
  pub status: String,
  pub article_count: i32,
  pub source_count: i32,
}

#[derive(Debug, Queryable, QueryableByName, Serialize, Clone)]
#[diesel(table_name = topic_articles)]
pub struct TopicArticle {
  #[diesel(sql_type = Integer)]
  pub id: i32,
  #[diesel(sql_type = Integer)]
  pub topic_id: i32,
  #[diesel(sql_type = Integer)]
  pub article_id: i32,
  #[diesel(sql_type = Float)]
  pub relevance_score: f32,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = topic_articles)]
pub struct NewTopicArticle {
  pub topic_id: i32,
  pub article_id: i32,
  pub relevance_score: f32,
}

#[derive(Debug, Queryable, Serialize)]
pub struct TopicFollow {
  pub id: Option<i32>,
  pub topic_id: i32,
  pub followed_at: chrono::NaiveDateTime,
  pub status: String,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = topic_follows)]
pub struct NewTopicFollow {
  pub topic_id: i32,
  pub status: Option<String>,
}

#[derive(Debug, Clone, Queryable, Serialize, QueryableByName)]
pub struct Collection {
  #[diesel(sql_type = Integer)]
  pub id: i32,
  #[diesel(sql_type = Text)]
  pub uuid: String,
  #[diesel(sql_type = Text)]
  pub name: String,
  #[diesel(sql_type = Text)]
  pub description: String,
  #[diesel(sql_type = Text)]
  pub icon: String,
  #[diesel(sql_type = Integer)]
  pub sort_order: i32,
  #[diesel(sql_type = Text)]
  pub create_date: String,
  #[diesel(sql_type = Text)]
  pub update_date: String,
}

#[derive(Debug, Insertable, Clone)]
#[diesel(table_name = collections)]
pub struct NewCollection {
  pub uuid: String,
  pub name: String,
  pub description: String,
  pub icon: String,
  pub sort_order: i32,
}

#[derive(Debug, Clone, Queryable, Serialize, QueryableByName)]
pub struct ArticleCollection {
  #[diesel(sql_type = Integer)]
  pub id: i32,
  #[diesel(sql_type = Integer)]
  pub article_id: i32,
  #[diesel(sql_type = Integer)]
  pub collection_id: i32,
  #[diesel(sql_type = Text)]
  pub create_date: String,
}

#[derive(Debug, Insertable, Clone)]
#[diesel(table_name = article_collections)]
pub struct NewArticleCollection {
  pub article_id: i32,
  pub collection_id: i32,
}

#[derive(Debug, Clone, Queryable, Serialize, QueryableByName)]
pub struct Tag {
  #[diesel(sql_type = Integer)]
  pub id: i32,
  #[diesel(sql_type = Text)]
  pub uuid: String,
  #[diesel(sql_type = Text)]
  pub name: String,
  #[diesel(sql_type = Text)]
  pub create_date: String,
}

#[derive(Debug, Insertable, Clone)]
#[diesel(table_name = tags)]
pub struct NewTag {
  pub uuid: String,
  pub name: String,
}

#[derive(Debug, Clone, Queryable, Serialize, QueryableByName)]
pub struct ArticleTag {
  #[diesel(sql_type = Integer)]
  pub id: i32,
  #[diesel(sql_type = Integer)]
  pub article_id: i32,
  #[diesel(sql_type = Integer)]
  pub tag_id: i32,
  #[diesel(sql_type = Text)]
  pub create_date: String,
}

#[derive(Debug, Insertable, Clone)]
#[diesel(table_name = article_tags)]
pub struct NewArticleTag {
  pub article_id: i32,
  pub tag_id: i32,
}
