use serde::Serialize;
use tauri::{command, Emitter, WebviewWindow};
use uuid::Uuid;

use fetcher_core::DetectInput;

use crate::core::config;
use crate::fetchers;
use crate::models;
use crate::{feed, sources};

#[derive(Debug, Serialize)]
pub struct FeedFetchResponse {
  feed: models::NewFeed,
  message: String,
}

/// 预览用的一行条目（订阅前让用户看到"我会得到什么"）
#[derive(Debug, Clone, Serialize)]
pub struct PreviewEntry {
  pub title: String,
  pub link: String,
  /// RFC3339（UTC，带 Z）——前端 `new Date()` 按绝对时刻渲染，格式不能换成 naive 串
  pub pub_date: String,
  /// 播客单集时长（秒），来自 enclosure/itunes:duration
  pub duration: Option<i64>,
}

/// 添加订阅的探测结果：fetcher 的 detect 负责"任意输入 → 源"
#[derive(Debug, Serialize)]
pub struct FeedPreview {
  pub feed: Option<models::NewFeed>,
  /// 真正生效的 feed 地址（粘贴网页时 != 输入）
  pub resolved_url: String,
  /// 探测过程中试过的候选地址（多个时界面列出来让用户换）
  pub candidates: Vec<String>,
  /// 最近条目（最多 6 条）
  pub entries: Vec<PreviewEntry>,
  pub message: String,
}

fn to_preview_entries(items: &[fetcher_core::FetchedArticle]) -> Vec<PreviewEntry> {
  items
    .iter()
    .take(6)
    .map(|item| PreviewEntry {
      title: item.title.clone(),
      link: item.link.clone(),
      // published_at 是归一化 UTC 串（YYYY-MM-DD HH:MM:SS），补回 RFC3339 的 Z
      pub_date: if item.published_at.is_empty() {
        String::new()
      } else {
        format!("{}Z", item.published_at.replace(' ', "T"))
      },
      duration: fetchers::item_duration(item),
    })
    .collect()
}

fn detect_input(
  raw: String,
  carrier: Option<String>,
  provider_hint: Option<String>,
  account_uuid: Option<String>,
) -> DetectInput {
  DetectInput {
    carrier_hint: carrier.as_deref().and_then(fetchers::carrier_from_str),
    account: account_uuid
      .as_deref()
      .and_then(sources::account_service::account_material),
    http: feed::create_client(&raw),
    provider_hint,
    raw,
  }
}

/// 预览：先"发现"（HTML 里声明的 feed、常见路径），再回预览卡需要的一切
#[command]
pub async fn fetch_feed(
  url: String,
  origin: Option<String>,
  carrier: Option<String>,
  provider_hint: Option<String>,
  account_uuid: Option<String>,
) -> FeedPreview {
  let empty = |message: String, candidates: Vec<String>| FeedPreview {
    feed: None,
    resolved_url: String::new(),
    candidates,
    entries: vec![],
    message,
  };

  match fetchers::detect(&detect_input(url, carrier, provider_hint, account_uuid)).await {
    Ok(output) => {
      let channel_uuid = Uuid::new_v4().hyphenated().to_string();
      let origin_value = resolve_origin(origin.as_deref());
      let feed_model = fetchers::to_new_feed(
        &channel_uuid,
        &output.resolved_url,
        &output.provider,
        &output.feed,
        &origin_value,
      );
      let entries = to_preview_entries(&output.entries);

      FeedPreview {
        feed: Some(feed_model),
        resolved_url: output.resolved_url,
        candidates: output.candidates,
        entries,
        message: String::new(),
      }
    }
    Err(err) => empty(err, vec![]),
  }
}

/// 来源判定（订阅时一次，之后不再猜）：`native` | `generator:<route>`
/// 客户端已知的生成器路由优先（用户粘贴平台主页时我们生成的）；否则 native。
pub fn resolve_origin(client_origin: Option<&str>) -> String {
  match client_origin {
    Some(origin) if !origin.is_empty() => origin.to_string(),
    _ => String::from("native"),
  }
}

#[command]
pub async fn move_channel_into_folder(
  channel_uuid: String,
  folder_uuid: String,
  sort: i32,
) -> usize {
  let result = feed::channel::update_feed_meta(
    channel_uuid,
    feed::channel::FeedMetaUpdateRequest {
      folder_uuid: folder_uuid,
      sort,
    },
  );

  result
}

#[command]
pub async fn add_feed(
  url: String,
  origin: Option<String>,
  carrier: Option<String>,
  provider_hint: Option<String>,
  account_uuid: Option<String>,
) -> (Option<models::Feed>, usize, String) {
  println!("request channel {}", &url);

  // 预览阶段刚抓过 → detect 命中短时缓存/账户，不再二次网络往返
  match fetchers::detect(&detect_input(url, carrier, provider_hint, account_uuid)).await {
    Ok(output) => {
      let channel_uuid = Uuid::new_v4().hyphenated().to_string();
      let origin_value = resolve_origin(origin.as_deref());
      let feed_model = fetchers::to_new_feed(
        &channel_uuid,
        &output.resolved_url,
        &output.provider,
        &output.feed,
        &origin_value,
      );
      let articles = output
        .entries
        .iter()
        .map(|item| fetchers::to_new_article(&channel_uuid, &output.resolved_url, item))
        .collect();

      let result = feed::channel::add_feed(feed_model, articles);

      // 邮件源默认 15 分钟一查（source-level sync_interval 优先于全局节奏）
      if result.1 > 0 && output.provider == "mail" {
        feed::channel::update_feed_sync_interval(&channel_uuid, 900);
      }

      result
    }
    Err(err) => (None, 0, err),
  }
}

// ── 来源账户（IMAP / B站 cookie 等凭据的宿主）────────────────────

#[command]
pub fn list_source_accounts() -> Vec<models::SourceAccount> {
  sources::account_service::list_accounts()
}

#[command]
pub fn save_source_account(
  provider: String,
  label: String,
  settings: String,
) -> Result<models::SourceAccount, String> {
  sources::account_service::save_account(&provider, &label, &settings)
}

#[command]
pub fn delete_source_account(uuid: String) -> usize {
  sources::account_service::delete_account(&uuid)
}

#[command]
pub async fn test_source_account(provider: String, settings: String) -> Result<String, String> {
  sources::account_service::test_account(&provider, &settings).await
}

// ── 站点规则（site-rules：本地转换引擎的配置面）──────────────────

/// 规则摘要（设置页展示 + /api/rules）
#[derive(Debug, Serialize)]
pub struct RuleSummary {
  pub key: String,
  pub title: String,
  pub pattern: String,
  pub kind: String,
  pub source: String,
}

#[command]
pub fn list_site_rules() -> Vec<RuleSummary> {
  fetcher_site::load_rules()
    .into_iter()
    .map(|rule| RuleSummary {
      source: String::from("builtin"),
      key: rule.key,
      title: rule.title,
      pattern: rule.pattern,
      kind: rule.fetch.kind,
    })
    .collect()
}

/// 导入规则到 ~/.lettura/rules/{key}.toml（校验通过才落盘；同 key 覆盖）
#[command]
pub fn import_site_rule(content: String) -> Result<String, String> {
  let rule = site_rules::parse_rule(&content)?;
  let dir = std::env::var("HOME")
    .map(|home| {
      std::path::PathBuf::from(home)
        .join(".lettura")
        .join("rules")
    })
    .map_err(|_| "无法定位用户目录".to_string())?;
  std::fs::create_dir_all(&dir).map_err(|e| format!("创建规则目录失败: {e}"))?;
  let path = dir.join(format!("{}.toml", rule.key));
  std::fs::write(&path, &content).map_err(|e| format!("写入规则失败: {e}"))?;
  Ok(rule.key)
}

// the payload type must implement `Serialize` and `Clone`.
#[derive(Clone, serde::Serialize)]
struct Payload {
  message: String,
}

#[command]
pub fn init_process(window: WebviewWindow) {
  std::thread::spawn(move || loop {
    window
      .emit(
        "event-name",
        Payload {
          message: "Tauri is awesome!".into(),
        },
      )
      .unwrap();
  });
}

#[command]
pub fn update_threads(threads: i32) -> usize {
  config::update_threads(threads);
  1
}

#[command]
pub fn update_user_config(user_cfg: config::UserConfig) -> usize {
  println!("user_cfg {:?}", user_cfg);

  config::update_user_config(user_cfg);

  1
}

#[command]
pub fn create_folder(name: String) -> (usize, String) {
  feed::folder::create_folder(name)
}

#[command]
pub fn delete_folder(uuid: String) -> (usize, usize) {
  feed::folder::delete_folder(uuid)
}

#[command]
pub fn update_folder(uuid: String, name: String) -> (usize, String) {
  feed::folder::update_folder(uuid, name)
}

#[command]
pub async fn update_icon(uuid: String, url: String) -> usize {
  let favicon = feed::channel::update_icon(&uuid, &url).await;

  favicon
}

#[command]
pub async fn get_server_port() -> u16 {
  let cfg = config::get_user_config();
  return cfg.port;
}

#[command]
pub fn export_opml() -> Result<String, String> {
  feed::opml::export_opml()
}

#[command]
pub fn import_opml(opml_content: String) -> Result<feed::opml::OpmlImportResult, String> {
  feed::opml::import_opml(&opml_content)
}

#[command]
pub fn import_opml_as_source(
  opml_content: String,
) -> Result<sources::source_service::OpmlImportAsSourceResult, String> {
  sources::source_service::import_opml_as_source(&opml_content)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_resolve_origin() {
    assert_eq!(
      resolve_origin(Some("generator:bilibili")),
      "generator:bilibili"
    );
    assert_eq!(resolve_origin(Some("")), "native");
    assert_eq!(resolve_origin(None), "native");
  }

  #[test]
  fn test_preview_entry_rfc3339() {
    // 归一化 UTC 串 → RFC3339（带 Z），前端 new Date() 才能按绝对时刻渲染
    let item = fetcher_core::FetchedArticle {
      title: "t".into(),
      link: "l".into(),
      content_html: None,
      summary: None,
      author: None,
      published_at: "2026-09-27 08:30:00".into(),
      media: vec![],
      carrier: fetcher_core::Carrier::Text,
    };
    let entries = to_preview_entries(std::slice::from_ref(&item));
    assert_eq!(entries[0].pub_date, "2026-09-27T08:30:00Z");
  }

  #[tokio::test]
  async fn test_add_feed() {
    let url = "http://www.ximalaya.com/album/39643321.xml".to_string();
    // let url = "http://www.smashingmagazine.com/feed/".to_string();
    let result = add_feed(url, None, None, None, None).await;

    println!("result: {:?}", result);
  }
}
