use chrono::{TimeZone, Utc};
use dotenv::dotenv;
use serde::{Deserialize, Serialize};
use std::{
  collections::HashSet,
  env, fs,
  path::{self, PathBuf},
};
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

#[derive(Debug, Serialize, Deserialize, Clone)]
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
  pub proxy_rules: Vec<String>,

  pub customize_style: CustomizeStyle,
  pub purge_on_days: u64,
  pub purge_unread_articles: bool,
  pub port: u16,
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
      port: 3456,
    }
  }
}

impl UserConfig {
  generate_set_property!(self, set_threads, threads, i32);
  generate_set_property!(self, set_theme, theme, String);
  generate_set_property!(self, set_port, port,  u16);
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

  if !user_config_path.exists() {
    fs::File::create(&user_config_path).expect("create user config failed");
    let data = UserConfig::default();

    let content = toml::to_string_pretty(&data).unwrap();

    fs::write(&user_config_path, content).expect("update threads error");

    return data;
  }

  let content = match fs::read_to_string(&user_config_path) {
    Ok(content) => content,
    Err(_) => "".to_string(),
  };

  let data: Option<UserConfig> = match toml::from_str(&content) {
    Ok(data) => {
      Some(data)
    }
    Err(_) => {
      eprintln!("Unable to load data from `{:?}`", content);
      Some(UserConfig::default())
    }
  };

  match data {
    Some(data) => data,
    None => UserConfig::default(),
  }
}

pub fn add_proxy(proxy_cfg: Proxy, allow_list: Vec<String>) -> Result<Option<Vec<Proxy>>, String> {
  let mut data = get_user_config();
  let user_config_path = get_user_config_path();

  match data.add_proxy(proxy_cfg.clone()) {
    Ok(_) => {
      let set: HashSet<String> = data
        .proxy_rules
        .into_iter()
        .chain(
          allow_list
            .into_iter()
            .map(|l| format!("{}:{},{}", proxy_cfg.server, proxy_cfg.port, l)),
        )
        .collect();

      data.proxy_rules =  set.into_iter().collect();

      let content = toml::to_string_pretty(&data).unwrap();

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

pub fn update_proxy(
  id: String,
  proxy_cfg: Proxy,
  allow_list: Option<Vec<String>>,
) -> Result<Option<Vec<Proxy>>, String> {
  let mut data = get_user_config();
  let user_config_path = get_user_config_path();
  let mut proxies = data.proxy.unwrap_or_default();

  if let Some(proxy) = proxies
    .iter_mut()
    .find(|p| format!("socks5://{}:{}", p.server, p.port) == id)
  {
    proxy.server = proxy_cfg.server.clone();
    proxy.port = proxy_cfg.port.clone();
    proxy.enable = proxy_cfg.enable.clone();
    proxy.username = proxy_cfg.username.clone();
    proxy.password = proxy_cfg.password.clone();
  }

  if allow_list.is_some() {
    let mut rules: Vec<String> = allow_list
      .unwrap()
      .into_iter()
      .map(|l| {
        format!(
          "{}:{},{}",
          proxy_cfg.clone().server,
          proxy_cfg.clone().port,
          l
        )
      })
      .collect();
    data.proxy_rules.retain(|rule| {
      !rule.starts_with(&format!("{}:{}", proxy_cfg.server, proxy_cfg.port))
    });

    let set: HashSet<String> = data
      .proxy_rules
      .into_iter()
      .chain(rules.into_iter())
      .collect();

    rules = set.into_iter().collect();
    data.proxy_rules = rules;
  } else {
    data.proxy_rules.retain(|rule| {
      !rule.starts_with(&format!("{}:{},{}", proxy_cfg.server, proxy_cfg.port, rule))
    });
  }

  data.proxy = Some(proxies);

  let content = toml::to_string_pretty(&data).unwrap();

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
    proxies.remove(index);

    data
      .proxy_rules
      .retain(|rule| !rule.starts_with(&format!("{}:{}", proxy_cfg.server, proxy_cfg.port)));
  }

  data.proxy = Some(proxies);

  let content = toml::to_string_pretty(&data).unwrap();

  match fs::write(user_config_path, content) {
    Ok(_) => Ok(data.proxy),
    Err(err) => Err(err.to_string()),
  }
}

pub fn update_threads(threads: i32) -> usize {
  let data = get_user_config();
  let user_config_path = get_user_config_path();
  let a = data.set_threads(threads);

  let content = toml::to_string_pretty(&a).unwrap();

  fs::write(user_config_path, content).expect("update threads error");

  return 1;
}

pub fn update_theme(theme: String) -> usize {
  let data = get_user_config();
  let user_config_path = get_user_config_path();

  println!("data {:?}", data);

  let a = data.set_theme(theme);

  let content = toml::to_string_pretty(&a).unwrap();

  println!("content {:?}", content);

  fs::write(user_config_path, content).expect("update theme error");

  return 1;
}

pub fn update_port(port: u16) -> usize {
  let data = get_user_config();
  let user_config_path = get_user_config_path();

  let a = data.set_port(port);

  let content = toml::to_string_pretty(&a).unwrap();

  println!("content {:?}", content);

  fs::write(user_config_path, content).expect("update theme error");

  return 1;
}

pub fn update_user_config(cfg: UserConfig) -> String {
  let user_config_path = get_user_config_path();

  let content = toml::to_string_pretty(&cfg).unwrap();

  fs::write(user_config_path, &content).expect("update threads error");

  return content;
}
