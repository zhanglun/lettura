use std::env;
use std::error::Error;

use diesel::insert_into;
use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use dotenv::dotenv;

use crate::models as models;
use crate::schema as schema;

pub fn establish_connection() -> SqliteConnection {
  dotenv().ok();

  let database_url = env::var("DATABASE_URL")
    .expect("DATABASE_URL must be set");
  SqliteConnection::establish(&database_url)
    .expect(&format!("Error connecting to {}", database_url))
}

pub fn get_channels() -> Vec<models::Feed> {
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

pub async fn remove_channel(conn: &mut SqliteConnection, uuid: String) -> usize {
  1
}

pub async fn add_articles(conn: &mut SqliteConnection, articles: Vec<models::Article>) -> usize {
  1
}
