use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use std::path;

use dotenv::dotenv;
use std::env;

pub fn establish_connection() -> SqliteConnection {
  dotenv().ok();

  let _env = env::var("LETTURA_ENV");

  match _env {
    Ok(_env) => {
      let database_url = &env::var("DATABASE_URL").unwrap();

      SqliteConnection::establish(&database_url)
        .expect(&format!("Error connecting to {}", &database_url))
    }
    Err(_) => {
      println!("no LETTURA_ENV");

      let home_dir = env::var("HOME")
        .or_else(|_| env::var("USERPROFILE"))
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|_| std::path::PathBuf::from("/"));
      let database_url = path::Path::new(&home_dir)
        .join(".lettura")
        .join("lettura.db");

      let database_url = database_url.to_str().clone().unwrap();

      SqliteConnection::establish(&database_url)
        .expect(&format!("Error connecting to {}", &database_url))
    }
  }
}
