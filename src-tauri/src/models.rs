use super::schema::{articles, feeds, feed_metas, folder_channel_relations, folders};
use diesel::sql_types::*;
use serde::Serialize;

#[derive(Debug, Clone, Queryable, Serialize, QueryableByName)]
pub struct Feed {
  #[diesel(sql_type = Integer)]
  pub id: i32,
  #[diesel(sql_type = Text)]
  pub uuid: String,
  #[diesel(sql_type = Text)]
  pub feed_type: String,
  #[diesel(sql_type = Text)]
  pub title: String,
  #[diesel(sql_type = Text)]
  pub link: String,
  #[diesel(sql_type = Text)]
  pub feed_url: String,
  #[diesel(sql_type = Text)]
  pub logo: String,
  #[diesel(sql_type = Text)]
  pub description: String,
  #[diesel(sql_type = Text)]
  pub pub_date: String,
  #[diesel(sql_type = Integer)]
  pub sync_interval: i32,
  #[diesel(sql_type = Text)]
  pub last_sync_date: String,
  #[diesel(sql_type = Integer)]
  pub sort: i32,
  #[diesel(sql_type = Text)]
  pub create_date: String,
  #[diesel(sql_type = Text)]
  pub update_date: String,
  #[diesel(sql_type = Text)]
  pub updated: String,
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
}

#[derive(Debug, Queryable, Serialize, QueryableByName)]
pub struct FeedMeta {
  #[diesel(sql_type = Integer)]
  pub id: i32,
  #[diesel(sql_type = Text)]
  pub child_uuid: String,
  #[diesel(sql_type = Text)]
  pub parent_uuid: String,
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
  pub child_uuid: String,
  pub parent_uuid: String,
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
  pub channel_uuid: String,
  #[diesel(sql_type = Text)]
  pub title: String,
  #[diesel(sql_type = Text)]
  pub link: String,
  #[diesel(sql_type = Text)]
  pub feed_url: String,
  #[diesel(sql_type = Text)]
  pub description: String,
  #[diesel(sql_type = Text)]
  pub content: String,
  #[diesel(sql_type = Text)]
  pub pub_date: String,
  #[diesel(sql_type = Text)]
  pub author: String,
  #[diesel(sql_type = Text)]
  pub create_date: String,
  #[diesel(sql_type = Text)]
  pub update_date: String,
  #[diesel(sql_type = Integer)]
  pub read_status: i32,
}

#[derive(Debug, Insertable, Clone)]
#[diesel(table_name = articles)]
pub struct NewArticle {
  pub uuid: String,
  pub channel_uuid: String,
  pub title: String,
  pub link: String,
  pub feed_url: String,
  pub description: String,
  pub content: String,
  pub author: String,
  pub pub_date: String,
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

#[derive(Debug, Queryable, Clone)]
pub struct FolderChannelRelation {
  #[diesel(sql_type = Integer)]
  pub id: i32,
  #[diesel(sql_type = Text)]
  pub folder_uuid: String,
  #[diesel(sql_type = Text)]
  pub channel_uuid: String,
  #[diesel(sql_type = Text)]
  pub create_date: String,
}
#[derive(Debug, Insertable, Clone)]
#[diesel(table_name = folder_channel_relations)]
pub struct NewFolderChannelRelation {
  pub channel_uuid: String,
  pub folder_uuid: String,
}
