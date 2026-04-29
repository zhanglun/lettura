use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;

#[cfg(test)]
use diesel_migrations::MigrationHarness;
#[cfg(test)]
use std::sync::OnceLock;

#[cfg(test)]
static TEST_DB_PATH: OnceLock<String> = OnceLock::new();

#[cfg(not(test))]
use dotenv::dotenv;
#[cfg(not(test))]
use std::env;
#[cfg(not(test))]
use std::path;

#[cfg(not(test))]
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

#[cfg(test)]
pub fn establish_connection() -> SqliteConnection {
  let db_path = TEST_DB_PATH.get_or_init(|| {
    let temp = std::env::temp_dir().join("lettura_test.db");
    let _ = std::fs::remove_file(&temp);
    let path = temp.to_str().unwrap().to_string();

    let mut conn = SqliteConnection::establish(&path).expect("Failed to create test DB");
    conn
      .run_pending_migrations(crate::MIGRATIONS)
      .expect("Test DB migration failed");

    diesel::sql_query("PRAGMA journal_mode=WAL")
      .execute(&mut conn)
      .expect("Failed to set WAL mode");
    diesel::sql_query("PRAGMA busy_timeout=5000")
      .execute(&mut conn)
      .expect("Failed to set busy_timeout");

    path
  });

  let mut conn = SqliteConnection::establish(db_path).expect("Failed to connect to test DB");
  diesel::sql_query("PRAGMA busy_timeout=5000")
    .execute(&mut conn)
    .expect("Failed to set busy_timeout");
  conn
}
