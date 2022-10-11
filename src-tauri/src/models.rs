use chrono::{DateTime};
use rusqlite::{Coonnection};

#[derive(Queryable)]
pub struct Feed {
  pub id: Int,
  pub uuid: String,
  pub title: String,
  pub link: String,
  pub image: String,
  pub feed_url: String,
  pub description: String,
  pub pub_date: DateTime,
}

#[derive(Queryable)]
pub struct FeedArticleRelation {
  pub id: String,
  pub feed_uuid: String,
  pub article_uuid: String,
}

#[derive(Queryable)]
pub struct Article {
  pub id: String,
  pub uuid: String,
  pub title: String,
  pub link: String,
  pub image: String,
  pub feed_url: String,
  pub description: String,
  pub content: String,
  pub pub_date: DateTime,
}
