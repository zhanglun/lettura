use dotenv::dotenv;
use serde::{Deserialize, Serialize};
use std::{env, fs, io, path, path::PathBuf};
use toml;
enum ConfigError {
  IoError(io::Error),
  InvalidConfig(toml::de::Error),
}

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
pub struct CustomizeStyle {
  typeface: String,
  font_size: i32,
  line_width: i32,
}

impl Default for CustomizeStyle {
  fn default() -> Self {
    Self {
      typeface: String::from("adsf"),
      font_size: 14,
      line_width: 1,
    }
  }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserConfig {
  pub threads: i32,
  pub theme: String,
  pub local_proxy: Option<LocalProxy>,
  pub customize_style: CustomizeStyle,
}

impl Default for UserConfig {
  fn default() -> Self {
    Self {
      threads: 1,
      theme: String::from('1'),
      local_proxy: Some(LocalProxy {
        ip: "".to_string(),
        port: "".to_string(),
      }),

      customize_style: CustomizeStyle {
        typeface: String::from(""),
        font_size: 14,
        line_width: 2,
      },
    }
  }
}

impl UserConfig {
  fn update_threads(&mut self, threads: i32) -> &mut UserConfig {
    self.threads = threads;

    self
  }

  fn update_theme(&mut self, theme: String) -> &mut UserConfig {
    self.theme = theme;

    self
  }

  fn update_proxy(&mut self, ip: String, port: String) -> &mut UserConfig {
    self.local_proxy = Some(LocalProxy { ip, port });

    self
  }

  /// init use config
  pub fn init_config() -> UserConfig {
    let home_dir = tauri::api::path::home_dir();
    match home_dir {
      Some(home_dir) => {
        let app_config = path::Path::new(&home_dir);
        let app_config = app_config.join(".lettura");

        println!("{:?}", app_config);
        fs::create_dir_all(app_config).unwrap();

        println!("{:?}", env::current_dir());
        println!("{:?}", env::current_exe());

        UserConfig::default()
      }
      None => UserConfig::default(),
    }
  }
}

pub fn get_user_config_path() -> PathBuf {
  dotenv().ok();

  let _env = env::var("LETTURA_ENV");

  match _env {
    Ok(_env) => {
      let user_config = path::Path::new("./lettura.toml").to_path_buf();

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

pub fn get_user_config() -> Option<UserConfig> {
  let user_config_path = get_user_config_path();

  if !user_config_path.exists() {
    fs::File::create(&user_config_path).expect("create user config failed");
  }

  let content = match fs::read_to_string(&user_config_path) {
    Ok(content) => content,
    Err(_) => "".to_string(),
  };

  let data: Option<UserConfig> = match toml::from_str(&content) {
    Ok(data) => Some(data),
    Err(_) => None,
  };

  data
}

pub fn load_or_initial() -> Option<UserConfig> {
  let user_config_path = get_user_config_path();

  if !user_config_path.exists() {
    fs::File::create(&user_config_path).expect("create user config failed");
  }

  let content = match fs::read_to_string(&user_config_path) {
    Ok(content) => content,
    Err(_) => "".to_string(),
  };

  let mut data = match content.parse::<toml::Table>() {
    Ok(data) => data,
    Err(err) => {
      println!("error ==> {:?}", err);
      toml::map::Map::new()
    }
  };

  if !data.contains_key("customize_style") {
    data.insert(String::from("customize_style"), toml::Value::try_from::<CustomizeStyle>(CustomizeStyle::default()).unwrap());
  }

  println!("data: {:?}", data);

  Some(data.try_into::<UserConfig>().unwrap_or(UserConfig::default()))
}

pub fn update_proxy(ip: String, port: String) -> usize {
  let data = get_user_config();

  let mut data = match data {
    Some(data) => data,
    None => UserConfig::default(),
  };

  let user_config_path = get_user_config_path();
  let a = data.update_proxy(ip, port);
  let content = toml::to_string(a).unwrap();

  fs::write(user_config_path, content).expect("update proxy error");

  return 1;
}

pub fn update_threads(threads: i32) -> usize {
  let data = get_user_config();

  let mut data = match data {
    Some(data) => data,
    None => UserConfig::default(),
  };

  let user_config_path = get_user_config_path();
  let a = data.update_threads(threads);

  let content = toml::to_string(a).unwrap();

  fs::write(user_config_path, content).expect("update threads error");

  return 1;
}

pub fn update_theme(theme: String) -> usize {
  let data = get_user_config();

  let mut data = match data {
    Some(data) => data,
    None => UserConfig::default(),
  };

  let user_config_path = get_user_config_path();

  println!("data {:?}", data);

  let a = data.update_theme(theme);

  let content = toml::to_string(a).unwrap();

  fs::write(user_config_path, content).expect("update threads error");

  return 1;
}

#[cfg(test)]

mod tests {
  use super::*;

  #[test]
  fn test_load_or_initial() {
    let res = load_or_initial();

    println!("test_load_or_initial res {:?}", res);
  }
}
