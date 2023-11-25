use diesel::prelude::*;

use crate::{
  db::establish_connection,
  feed::article::ArticleQueryResult,
  models::{self, Article},
  schema,
};

pub struct Common {}
pub struct GlobalSearchQuery {
  pub query: String,
  pub limit: Option<i64>,
  pub cursor: Option<i64>,
}

impl Common {
  pub fn global_search(search: GlobalSearchQuery) -> Vec<models::Article> {
    let mut connection = establish_connection();
    let query = search.query;
    let limit = search.limit.unwrap_or(12);
    let cursor = search.cursor.unwrap_or(1);

    let result = schema::articles::dsl::articles
      .filter(schema::articles::dsl::title.like(format!("%{}%", query)))
      .filter(schema::articles::dsl::content.like(format!("%{}%",query)))
      .limit(limit)
      .offset((cursor - 1) * limit)
      .load::<models::Article>(&mut connection)
      .unwrap();

    println!("result {:?}", result);
    result
  }
}
