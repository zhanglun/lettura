use dotenv::dotenv;
use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path;
use std::path::PathBuf;

use toml;

#[derive(Debug, Serialize, Deserialize)]
pub struct LocalProxy {
  pub ip: String,
  pub port: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct RemoteProxy {
  ip: String,
  port: String,
  username: String,
  password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserConfig {
  pub local_proxy: Option<LocalProxy>,
}

pub fn get_user_config_path() -> PathBuf {
  dotenv().ok();

  let _env = env::var("LETTURA_ENV");

  match _env {
    Ok(_env) => {
      let user_config = path::Path::new("./lettura.toml").to_path_buf();

      println!("-->{:?}", user_config);

      user_config
    }
    Err(_) => {
      let home_dir = &tauri::api::path::home_dir().unwrap();
      let user_config = path::Path::new(home_dir);
      let user_config = user_config.join(".lettura");
      let user_config = user_config.join("lettura.toml");

      println!("-2->{:?}", user_config);

      user_config
    }
  }
}

pub fn read_user_config() {
  let user_config = get_user_config_path();

  println!("{:?}", user_config);

  // TODO: read yml
}

pub fn create_user_config() -> usize {
  let user_config = get_user_config_path();

  if !user_config.exists() {
    fs::File::create(user_config);
    1
  } else {
    0
  }
}

pub fn write_user_config() {}

pub fn get_user_config() -> Option<UserConfig> {
  let user_config_path = get_user_config_path();

  if !user_config_path.exists() {
    fs::File::create(&user_config_path);
  }

  let content = match fs::read_to_string(&user_config_path) {
    Ok(content) => content,
    Err(_) => "nocontent".to_string(),
  };

  println!("{:?}", content);

  let data: Option<UserConfig> = match toml::from_str(&content) {
    Ok(data) => Some(data),
    Err(_) => None,
  };

  data
}

#[cfg(test)]

mod tests {
  use super::*;

  #[test]
  fn test_get_user_config() {
    get_user_config();
  }

  #[test]
  fn test_read_user_config() {
    read_user_config();
  }

  #[test]
  fn test_create_user_config() {
    let res = create_user_config();

    println!("{}", res)
  }
}