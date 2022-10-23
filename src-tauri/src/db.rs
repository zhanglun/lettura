use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use dotenv::dotenv;
use serde::Serialize;

use crate::models;
use crate::schema;

pub fn establish_connection() -> SqliteConnection {
  dotenv().ok();

  let database_url = "./lettura.db";
  SqliteConnection::establish(&database_url)
    .expect(&format!("Error connecting to {}", database_url))
}

pub fn get_channels() -> Vec<models::Channel> {
  let mut connection = establish_connection();
  let results = schema::channels::dsl::channels
    .load::<models::Channel>(&mut connection)
    .expect("Expect loading posts");

  results
}

pub fn add_channel(channel: models::NewChannel, articles: Vec<models::NewArticle>) -> usize {
  let mut connection = establish_connection();
  let result = diesel::insert_or_ignore_into(schema::channels::dsl::channels)
    .values(channel)
    .execute(&mut connection);
  let result = match result {
    Ok(r) => r,
    Err(_) => 0,
  };

  println!(" new result {:?}", result);

  if result == 1 {
    println!("start insert articles");

    let articles = diesel::insert_or_ignore_into(schema::articles::dsl::articles)
      .values(articles)
      .execute(&mut connection);

    println!("articles {:?}", articles);
  }

  result
}

pub fn delete_channel(uuid: String) -> usize {
  let mut connection = establish_connection();
  let channel = schema::channels::dsl::channels
    .filter(schema::channels::uuid.eq(&uuid))
    .load::<models::Channel>(&mut connection)
    .expect("Expect find channel");

  if channel.len() == 1 {
    let result =
      diesel::delete(schema::channels::dsl::channels.filter(schema::channels::uuid.eq(&uuid)))
        .execute(&mut connection)
        .expect("Expect delete channel");

    diesel::delete(
      schema::articles::dsl::articles.filter(schema::articles::channel_uuid.eq(&uuid)),
    )
    .execute(&mut connection)
    .expect("Expect delete channel");

    return result;
  } else {
    return 0;
  }
}

pub fn get_channel_by_uuid(channel_uuid: String) -> Option<models::Channel> {
  let mut connection = establish_connection();
  let mut channel = schema::channels::dsl::channels
    .filter(schema::channels::uuid.eq(&channel_uuid))
    .load::<models::Channel>(&mut connection)
    .expect("Expect find channel");

  if channel.len() == 1 {
    return channel.pop();
  } else {
    return None;
  }
}

#[derive(Debug, Queryable, Serialize, QueryableByName)]
pub struct UnreadTotal {
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub channel_uuid: String,
  #[diesel(sql_type = diesel::sql_types::Integer)]
  pub unread_count: i32,
}

pub fn get_unread_total() -> Vec<UnreadTotal> {
  const SQL_QUERY_UNREAD_TOTAL: &str = "
 SELECT id, channel_uuid, count(read_status) as unread_count FROM articles WHERE read_status = 1 group by channel_uuid;
";
  let mut connection = establish_connection();
  let record = diesel::sql_query(SQL_QUERY_UNREAD_TOTAL)
    .load::<UnreadTotal>(&mut connection)
    .unwrap_or(vec![]);

  record
}

pub fn add_articles(channel_uuid: String, articles: Vec<models::NewArticle>) -> usize {
  let mut connection = establish_connection();
  let channel = schema::channels::dsl::channels
    .filter(schema::channels::uuid.eq(&channel_uuid))
    .load::<models::Channel>(&mut connection)
    .expect("Expect find channel");

  if channel.len() == 1 {
    let result = diesel::insert_or_ignore_into(schema::articles::dsl::articles)
      .values(articles)
      .execute(&mut connection)
      .expect("Expect add articles");

    return result;
  } else {
    return 0;
  }
}

pub struct ArticleFilter {
  pub channel_uuid: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ArticleQueryResult {
  pub list: Vec<models::Article>,
  // pub count: i32,
}

pub fn get_article_with_uuid(uuid: String) -> Option<models::Article> {
  let mut connection = establish_connection();
  let mut result = schema::articles::dsl::articles
    .filter(schema::articles::uuid.eq(&uuid))
    .load::<models::Article>(&mut connection)
    .unwrap_or(vec![]);

  if result.len() == 1 {
    return result.pop();
  } else {
    return None;
  }
}

pub fn update_article_read_status(uuid: String, status: i32) -> usize {
  let mut connection = establish_connection();
  let article = get_article_with_uuid(String::from(&uuid));

  match article {
    Some(_article) => {
      let res = diesel::update(schema::articles::dsl::articles.filter(schema::articles::uuid.eq(&uuid)))
        .set(schema::articles::read_status.eq(status))
        .execute(&mut connection);

      match res {
        Ok(r) => r,
        Err(_) => 0
      }
    }
    None => 0,
  }
}

pub fn get_article(filter: ArticleFilter) -> ArticleQueryResult {
  let mut connection = establish_connection();
  match filter.channel_uuid {
    Some(uuid) => {
      let results = schema::articles::dsl::articles
        .filter(schema::articles::channel_uuid.eq(uuid))
        .load::<models::Article>(&mut connection)
        .expect("Expect loading articles");
      // let count = schema::channels::dsl::channels
      //   .filter(schema::articles::channel_uuid.eq(uuid))
      //   .count()
      //   .get_result(&mut connection)
      //   .expect("Expect articles count");

      ArticleQueryResult {
        list: results,
        // count,
      }
    }
    None => {
      let results = schema::articles::dsl::articles
        .load::<models::Article>(&mut connection)
        .expect("Expect loading articles");
      // let count = schema::channels::dsl::channels
      //   .count()
      //   .get_result(&mut connection)
      //   .optional()
      //   .expect("Expect articles count");

      ArticleQueryResult { list: results }
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_get_unread_total() {
    get_unread_total();
  }
}
