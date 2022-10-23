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

pub fn add_channel(
  channel: models::NewChannel,
  articles: Vec<models::NewArticle>,
) -> usize {
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

      diesel::delete(schema::articles::dsl::articles.filter(schema::articles::channel_uuid.eq(&uuid)))
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
