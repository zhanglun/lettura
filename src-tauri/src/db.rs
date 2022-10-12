use std::env;
use std::error::Error;

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

pub fn get_feeds() -> String {
  let connection = establish_connection();
  let results = schema::feeds::dsl::feeds
    .limit(20)
    .load::<models::Feed>(&connection)
    .expect("Expect loading posts");

  let serialized = serde_json::to_string(&results).unwrap();
  serialized
}

pub fn add_feed(conn: &mut SqliteConnection, feed: &mut models::NewFeed) -> usize {
  1
}
