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
  conn: &SqliteConnection,
  channel: &'a models::NewFeed<'_>,
  articles: Vec<models::NewArticle>,
) -> String {
  let result = insert_into(schema::channels::dsl::channels)
    .values(channel)
    .execute(conn);
  let result = match result {
    Ok(r) => "OK".to_string(),
    Err(e) => e.to_string(),
  };

  println!(" new result {:?}", result);

  if result == "OK" {
    println!("start insert articles");

    let articles = insert_into(schema::articles::dsl::articles)
      .values(articles)
      .execute(conn);

      println!("articles {:?}", articles);
  }

  result
}

pub async fn remove_channel(conn: &mut SqliteConnection, uuid: String) -> usize {
  1
}

pub async fn add_articles(conn: &mut SqliteConnection, articles: Vec<models::Article>) -> usize {
  1
}
