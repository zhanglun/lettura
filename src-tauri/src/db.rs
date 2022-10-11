use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use self::models*;
use dotenv::dotenv;
use std::env;

pub fn establish_connection() -> SqliteConnection {
  dotenv().ok();

  let database_url = env::var("DATABASE_URL")
    .expect("DATABASE_URL must be set");
  SqliteConnection::establish(&database_url)
    .expect(&format!("Error connecting to {}", database_url))
}

pub fn get_feeds() -> Result<Vec<Feed>> {
  let connection = establish_connection();
  let results = feeds.limit(20).load::<Feed>(&connection);

  OK(results)
}

pub fn add_feed(conn: &mut SqliteConnection, feed: &mut models::NewPost) -> usize {

}
