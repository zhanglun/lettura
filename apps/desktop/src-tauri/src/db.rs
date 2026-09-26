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

  let database_url = match _env {
    Ok(_env) => env::var("DATABASE_URL").unwrap(),
    Err(_) => {
      println!("no LETTURA_ENV");

      let home_dir = env::var("HOME")
        .or_else(|_| env::var("USERPROFILE"))
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|_| std::path::PathBuf::from("/"));
      let database_url = path::Path::new(&home_dir)
        .join(".lettura")
        .join("lettura.db");

      database_url.to_str().clone().unwrap().to_string()
    }
  };

  let mut connection = SqliteConnection::establish(&database_url)
    .expect(&format!("Error connecting to {}", &database_url));

  // 并发写保护（段头「全部已读」等批量写、同步与用户操作并行）：
  // 无 busy_timeout 时并发写立即 SQLITE_BUSY，而 update handler 把 Err 吞成 0，
  // 失败对客户端不可见。journal_mode 是库级持久设置（重复执行幂等），
  // busy_timeout 是连接级（须每次设置）。
  diesel::sql_query("PRAGMA journal_mode=WAL")
    .execute(&mut connection)
    .expect("Failed to set WAL mode");
  diesel::sql_query("PRAGMA busy_timeout=5000")
    .execute(&mut connection)
    .expect("Failed to set busy_timeout");

  connection
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
