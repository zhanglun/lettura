use serde::{Serialize};
use super::schema::{channels, articles};

#[derive(Debug, Queryable, Serialize)]
pub struct Channel {
  pub id: i32,
  pub uuid: String,
  pub title: String,
  pub link: String,
  pub feed_url: String,
  pub image: String,
  pub description: String,
  pub pub_date: String,
}

#[derive(Debug, Queryable, Serialize, Associations)]
#[diesel(belongs_to(Channel))]
pub struct Article {
  pub id: i32,
  pub uuid: String,
  pub channel_uuid: String,
  pub title: String,
  pub link: String,
  pub feed_url: String,
  pub description: String,
  pub content: String,
  pub pub_date: String,
  pub read_status: i32,
}

#[derive(Debug, Insertable)]
#[table_name = "channels"]
pub struct NewChannel {
  pub uuid: String,
  pub title: String,
  pub link: String,
  pub image: String,
  pub feed_url: String,
  pub description: String,
  pub pub_date: String,
}

#[derive(Debug, Insertable, Clone)]
#[table_name = "articles"]
pub struct NewArticle {
  pub uuid: String,
  pub channel_uuid: String,
  pub title: String,
  pub link: String,
  pub feed_url: String,
  pub description: String,
  pub content: String,
  pub pub_date: String,
}
