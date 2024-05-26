use chrono::{TimeZone, Utc};
use dotenv::dotenv;
use serde::{Deserialize, Serialize};
use std::{env, fs, path, path::PathBuf};
use toml;

#[derive(Debug, Serialize, Deserialize)]
pub enum ColorScheme {
  #[serde(rename = "light")]
  Light,
  #[serde(rename = "dark")]
  Dark,
  #[serde(rename = "system")]
  System,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Proxy {
  pub server: String,
  pub port: String,
  pub username: Option<String>,
  pub password: Option<String>,
  pub enable: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CustomizeStyle {
  typeface: String,
  font_size: i32,
  line_height: f32,
  line_width: i32,
}

impl Default for CustomizeStyle {
  fn default() -> Self {
    Self {
      typeface: String::from("var(--sans-font)"),
      font_size: 14,
      line_height: 1.4,
      line_width: 648,
    }
  }
}

macro_rules! generate_set_property {
    ($config:ident, $method:ident, $field:ident, $field_type:ty) => {
        pub fn $method(mut $config, value: $field_type) -> Self {
            $config.$field = value;
            $config
        }
    };
    ($config:ident, $method:ident, $field:ident, Option<$field_type:ty>) => {
        pub fn $method(mut $config, value: Option<$field_type>) -> Self {
            $config.$field = value;
            $config
        }
    };
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserConfig {
  pub threads: i32,
  pub theme: String,
  pub color_scheme: ColorScheme,

  pub update_interval: u64,
  pub last_sync_time: String,

  pub proxy: Option<Vec<Proxy>>,
  pub customize_style: CustomizeStyle,
  pub purge_on_days: u64,
  pub purge_unread_articles: bool,
  pub proxy_rules: Vec<String>,
}

impl Default for UserConfig {
  fn default() -> Self {
    Self {
      threads: 1,
      theme: String::from("default"),
      color_scheme: ColorScheme::System,
      update_interval: 0,
      last_sync_time: Utc
        .timestamp_millis_opt(0)
        .unwrap()
        .to_rfc3339_opts(chrono::SecondsFormat::Secs, true),
      proxy: None,
      proxy_rules: vec![],
      customize_style: CustomizeStyle::default(),
      purge_on_days: 0,
      purge_unread_articles: true,
    }
  }
}

impl UserConfig {
  generate_set_property!(self, set_threads, threads, i32);
  generate_set_property!(self, set_theme, theme, String);
  generate_set_property!(self, set_update_interval, update_interval, u64);
  generate_set_property!(self, set_purge_on_days, purge_on_days, u64);
  generate_set_property!(self, set_purge_unread_articles, purge_unread_articles, bool);

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

  pub fn add_proxy(&mut self, proxy: Proxy) -> Result<(), String> {
    let server_port = format!("{}:{}", proxy.server, proxy.port);
    if self.proxy.as_ref().map_or(true, |proxies| {
      !proxies
        .iter()
        .any(|p| format!("{}:{}", p.server, p.port) == server_port)
    }) {
      match &mut self.proxy {
        Some(proxies) => proxies.push(proxy),
        None => self.proxy = Some(vec![proxy]),
      }
      Ok(())
    } else {
      Err(format!("Duplicate ip+port combination: {}", server_port))
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

pub fn get_user_config() -> UserConfig {
  let user_config_path = get_user_config_path();

  println!("===> {:?}", user_config_path);

  if !user_config_path.exists() {
    fs::File::create(&user_config_path).expect("create user config failed");
    let data = UserConfig::default();

    let content = toml::to_string(&data).unwrap();

    fs::write(&user_config_path, content).expect("update threads error");

    println!("====> return default");

    return data;
  }

  let content = match fs::read_to_string(&user_config_path) {
    Ok(content) => content,
    Err(_) => "".to_string(),
  };

  println!("====> return default {:?}", content);

  let data: Option<UserConfig> = match toml::from_str(&content) {
    Ok(data) => {
      println!("====> data 11 return default {:?}", data);
      Some(data)
    }
    Err(_) => {
      eprintln!("Unable to load data from `{:?}`", content);
      Some(UserConfig::default())
    }
  };

  println!("====> data return default {:?}", data);

  match data {
    Some(data) => data,
    None => UserConfig::default(),
  }
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
    data.insert(
      String::from("customize_style"),
      toml::Value::try_from::<CustomizeStyle>(CustomizeStyle::default()).unwrap(),
    );
  }

  if !data.contains_key("threads") {
    data.insert(
      String::from("threads"),
      toml::Value::try_from::<i32>(5).unwrap(),
    );
  }

  if !data.contains_key("theme") {
    data.insert(
      String::from("theme"),
      toml::Value::try_from::<String>(String::from("system")).unwrap(),
    );
  }

  if !data.contains_key("color_scheme") {
    data.insert(
      String::from("color_scheme"),
      toml::Value::try_from::<ColorScheme>(ColorScheme::System).unwrap(),
    );
  }

  if !data.contains_key("update_interval") {
    data.insert(
      String::from("update_interval"),
      toml::Value::try_from::<i32>(0).unwrap(),
    );
  }

  if !data.contains_key("last_sync_time") {
    data.insert(
      String::from("last_sync_time"),
      toml::Value::try_from::<String>(
        Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true),
      )
      .unwrap(),
    );
  }

  if !data.contains_key("purge_on_days") {
    data.insert(
      String::from("purge_on_days"),
      toml::Value::try_from::<u64>(0).unwrap(),
    );
  }

  if !data.contains_key("purge_unread_articles") {
    data.insert(
      String::from("purge_unread_articles"),
      toml::Value::try_from::<bool>(true).unwrap(),
    );
  }

  log::debug!("USER CONFIG: {:?}", data);

  Some(data.try_into::<UserConfig>().expect("config data error"))
}

pub fn add_proxy(proxy_cfg: Proxy) -> Result<Option<Vec<Proxy>>, String> {
  let mut data = get_user_config();
  let user_config_path = get_user_config_path();

  match data.add_proxy(proxy_cfg) {
    Ok(_) => {
      let content = toml::to_string(&data).unwrap();

      match fs::write(user_config_path, content) {
        Ok(_) => Ok(data.proxy),
        Err(err) => Err(err.to_string()),
      }
    }
    Err(err) => {
      println!("{}", err);
      Err(err.to_string())
    }
  }
}

pub fn update_proxy(id: String, proxy_cfg: Proxy) -> Result<Option<Vec<Proxy>>, String> {
  let mut data = get_user_config();
  let user_config_path = get_user_config_path();
  let mut proxies = data.proxy.unwrap_or_default();

  if let Some(proxy) = proxies
    .iter_mut()
    .find(|p| format!("socks5://{}:{}", p.server, p.port) == id)
  {
    proxy.server = proxy_cfg.server;
    proxy.port = proxy_cfg.port;
    proxy.enable = proxy_cfg.enable;
    proxy.username = proxy_cfg.username;
    proxy.password = proxy_cfg.password;
  }

  data.proxy = Some(proxies);

  let content = toml::to_string(&data).unwrap();

  match fs::write(user_config_path, content) {
    Ok(_) => Ok(data.proxy),
    Err(err) => Err(err.to_string()),
  }
}

pub fn delete_proxy(id: String, proxy_cfg: Proxy) -> Result<Option<Vec<Proxy>>, String> {
  let mut data = get_user_config();
  let user_config_path = get_user_config_path();
  let mut proxies = data.proxy.unwrap_or_default();

  if let Some(index) = proxies
    .iter_mut()
    .position(|p| format!("socks5://{}:{}", p.server, p.port) == id)
  {
    println!("index ===> {:?}", index);
    proxies.remove(index);
  }

  data.proxy = Some(proxies);

  let content = toml::to_string(&data).unwrap();

  match fs::write(user_config_path, content) {
    Ok(_) => Ok(data.proxy),
    Err(err) => Err(err.to_string()),
  }
}

pub fn update_threads(threads: i32) -> usize {
  let data = get_user_config();
  let user_config_path = get_user_config_path();
  let a = data.set_threads(threads);

  let content = toml::to_string(&a).unwrap();

  fs::write(user_config_path, content).expect("update threads error");

  return 1;
}

pub fn update_theme(theme: String) -> usize {
  let data = get_user_config();
  let user_config_path = get_user_config_path();

  println!("data {:?}", data);

  let a = data.set_theme(theme);

  let content = toml::to_string(&a).unwrap();

  println!("content {:?}", content);

  fs::write(user_config_path, content).expect("update theme error");

  return 1;
}

pub fn update_user_config(cfg: UserConfig) -> String {
  let user_config_path = get_user_config_path();

  let content = toml::to_string(&cfg).unwrap();

  fs::write(user_config_path, &content).expect("update threads error");

  return content;
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
