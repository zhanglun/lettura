use chrono::{NaiveDateTime};
use serde::{Serialize};
use super::schema::feeds;

#[derive(Queryable, Serialize)]
pub struct Feed {
  pub id: i32,
  pub uuid: String,
  pub title: String,
  pub link: String,
  pub image: String,
  pub feed_url: String,
  pub description: String,
  pub pub_date: String,
}

#[derive(Queryable, Serialize)]
pub struct FeedArticleRelation {
  pub id: String,
  pub feed_uuid: String,
  pub article_uuid: String,
}

#[derive(Queryable, Serialize)]
pub struct Article {
  pub id: String,
  pub uuid: String,
  pub title: String,
  pub link: String,
  pub image: String,
  pub feed_url: String,
  pub description: String,
  pub content: String,
  pub pub_date: NaiveDateTime,
}

#[derive(Debug, Insertable)]
#[table_name = "feeds"]
pub struct NewFeed<'a> {
  pub uuid: &'a String,
  pub title: &'a String,
  pub link: &'a String,
  pub image: &'a String,
  pub feed_url: &'a String,
  pub description: &'a String,
  pub pub_date: &'a String,
}
