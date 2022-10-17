use std::env;

use diesel::insert_into;
use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use dotenv::dotenv;

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
    .limit(20)
    .load::<models::Channel>(&connection)
    .expect("Expect loading posts");

  results
}

pub fn add_channel<'a>(
  channel: &'a models::NewFeed<'_>,
  articles: Vec<models::NewArticle>,
) -> String {
  let connection = establish_connection();
  let result = insert_into(schema::channels::dsl::channels)
    .values(channel)
    .execute(&connection);
  let result = match result {
    Ok(r) => r.to_string(),
    Err(e) => e.to_string(),
  };

  println!(" new result {:?}", result);

  if result == "OK" {
    println!("start insert articles");

    let articles = insert_into(schema::articles::dsl::articles)
      .values(articles)
      .execute(&connection);

      println!("articles {:?}", articles);
  }

  result
}

pub fn remove_channel(uuid: String) -> usize {
  1
}

pub fn add_articles(articles: Vec<models::Article>) -> usize {
  1
}

pub fn get_article() -> Vec<models::Article> {
  let connection = establish_connection();
  let results = schema::articles::dsl::articles
    .load::<models::Article>(&connection)
    .expect("Expect loading articles");

  results
}
