use std::fs;
use std::path;
use std::path::PathBuf;

#[derive(Debug)]
struct LocalProxy {
  ip: String,
  port: String,
}

#[derive(Debug)]
struct RemoteProxy {
  ip: String,
  port: String,
  username: String,
  password: String,
}

#[derive(Debug)]
struct UserConfig {
  local_proxy: LocalProxy,
}

pub fn get_user_config_path () -> PathBuf {
  let home_dir = &tauri::api::path::home_dir().unwrap();
  let user_config = path::Path::new(home_dir);
  let user_config = user_config.join(".lettura");
  let user_config = user_config.join("config.yml");

  user_config
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

#[cfg(test)]

mod tests {
  use super::*;

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
