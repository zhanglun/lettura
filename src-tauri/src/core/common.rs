use diesel::{prelude::*, sql_types::*};
use serde::Serialize;
use crate::db;

#[derive(Debug, Queryable, Serialize, QueryableByName)]
pub struct ArticleQueryItem {
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
  pub feed_title: String,

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
}
pub struct Common {}
pub struct GlobalSearchQuery {
  pub query: String,
  pub limit: Option<i32>,
  pub cursor: Option<i32>,
}

impl Common {
  pub fn global_search(search: GlobalSearchQuery) -> Vec<ArticleQueryItem> {
    let mut connection = db::establish_connection();
    let query = search.query;
    let limit = search.limit.unwrap_or(12);
    let cursor = search.cursor.unwrap_or(1);
    let mut query_boxed = diesel::sql_query("").into_boxed();
    query_boxed = query_boxed.sql(format!(
      "
        SELECT
          A.id,
          A.uuid,
          A.title,
          A.link,
          F.feed_url as feed_url,
          F.uuid as feed_uuid,
          F.title as feed_title,
          A.description,
          A.author,
          A.pub_date,
          A.content,
          A.create_date,
          A.update_date,
          A.read_status
        FROM
          articles AS A
        LEFT JOIN feeds as F
        WHERE
          A.title LIKE ?
          AND
          A.content LIKE ?
          AND A.feed_uuid = F.uuid
        LIMIT ? OFFSET ?
        ;"
    ));

    let result = query_boxed
      .bind::<Text, _>(format!("%{}%", query))
      .bind::<Text, _>(format!("%{}%", query))
      .bind::<Integer, _>(limit)
      .bind::<Integer, _>((cursor - 1) * limit)
      .get_results(&mut connection)
      .unwrap();

    result
  }
}
