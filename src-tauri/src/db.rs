use std::env;

use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use dotenv::dotenv;
use serde::Serialize;

use crate::models;
use crate::schema;

pub fn establish_connection() -> SqliteConnection {
  dotenv().ok();

  let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
  SqliteConnection::establish(&database_url)
    .expect(&format!("Error connecting to {}", database_url))
}

pub fn get_channels() -> Vec<models::Channel> {
  let connection = establish_connection();
  let results = schema::feeds::dsl::feeds
    .limit(20)
    .load::<models::Feed>(&connection)
    .expect("Expect loading posts");

  results
}

pub async fn add_channel<'a>(conn: &mut SqliteConnection, feed: &'a models::NewFeed<'_>,) -> usize {
  //TODO: save to Db
  let result = insert_into(schema::feeds::dsl::feeds)
    .values(feed)
    .execute(conn)
    .expect("error");
  println!(" new result {:?}", result);
  println!("11111");
  1
}

pub fn add_articles(articles: Vec<models::Article>) -> usize {
  1
}

pub async fn add_articles(conn: &mut SqliteConnection, articles: Vec<models::Article>) -> usize {
  1
}

pub struct ArticleFilter {
  pub channel_uuid: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ArticleQueryResult {
  pub list: Vec<models::Article>,
  // pub count: i32,
}

pub fn get_article(filter: ArticleFilter) -> ArticleQueryResult {
  let connection = establish_connection();
  match filter.channel_uuid {
    Some(uuid) => {
      let results = schema::articles::dsl::articles
        .filter(schema::articles::channel_uuid.eq(uuid))
        .load::<models::Article>(&connection)
        .expect("Expect loading articles");
      // let count = schema::channels::dsl::channels
      //   .filter(schema::articles::channel_uuid.eq(uuid))
      //   .count()
      //   .get_result(&connection)
      //   .expect("Expect articles count");

      ArticleQueryResult {
        list: results,
        // count,
      }
    }
    None => {
      let results = schema::articles::dsl::articles
        .load::<models::Article>(&connection)
        .expect("Expect loading articles");
      // let count = schema::channels::dsl::channels
      //   .count()
      //   .get_result(&connection)
      //   .optional()
      //   .expect("Expect articles count");

      ArticleQueryResult { list: results }
    }
  }
>>>>>>> sqlite
}
