use std::env;

use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use dotenv::dotenv;
use serde::{Serialize};

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
  let results = schema::channels::dsl::channels
    .load::<models::Channel>(&connection)
    .expect("Expect loading posts");

  results
}

pub fn add_channel<'a>(
  channel: &'a models::NewChannel<'_>,
  articles: Vec<models::NewArticle>,
) -> usize {
  let connection = establish_connection();
  let result = diesel::insert_into(schema::channels::dsl::channels)
    .values(channel)
    .execute(&connection);
  let result = match result {
    Ok(r) => r,
    Err(_) => 0,
  };

  println!(" new result {:?}", result);

  if result == 1 {
    println!("start insert articles");

    let articles = diesel::insert_into(schema::articles::dsl::articles)
      .values(articles)
      .execute(&connection);

    println!("articles {:?}", articles);
  }

  result
}

pub fn delete_channel(uuid: String) -> usize {
  let connection = establish_connection();
  let channel = schema::channels::dsl::channels
    .filter(schema::channels::uuid.eq(&uuid))
    .load::<models::Channel>(&connection)
    .expect("Expect find channel");

  if channel.len() == 1 {
    let result =
      diesel::delete(schema::channels::dsl::channels.filter(schema::channels::uuid.eq(&uuid)))
        .execute(&connection)
        .expect("Expect delete channel");

    return result;
  } else {
    return 0;
  }
}

pub fn add_articles(articles: Vec<models::Article>) -> usize {
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

      ArticleQueryResult {
        list: results,
      }
    }
  }
}
