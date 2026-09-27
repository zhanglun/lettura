//! 「任意地址 → feed」的请求与发现层（自 `feed/mod.rs` 搬运，行为不变）。
//! 客户端由调用方传入：fetcher 内不自建 client，代理/UA/超时策略单一出口。

use feed_rs::parser;
use scraper::{Html, Selector};
use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

/// 发现层预算：候选整体超时 + 最多试几个候选（每请求另有 12s 超时）
pub const DISCOVERY_BUDGET: Duration = Duration::from_secs(6);
pub const DISCOVERY_MAX_CANDIDATES: usize = 3;

// ── 解析结果短时缓存（只服务添加订阅流程）────────────────────────────
// 预览阶段已经抓过一次，订阅时复用它：一次网络往返。同步路径不走缓存。
static PARSE_CACHE: OnceLock<Mutex<HashMap<String, (Instant, feed_rs::model::Feed)>>> =
  OnceLock::new();
const PARSE_CACHE_TTL: Duration = Duration::from_secs(600);

fn cache_store() -> &'static Mutex<HashMap<String, (Instant, feed_rs::model::Feed)>> {
  PARSE_CACHE.get_or_init(|| Mutex::new(HashMap::new()))
}

fn cache_get(url: &str) -> Option<feed_rs::model::Feed> {
  let mut store = cache_store().lock().ok()?;
  let expired = store.get(url).map(|(at, _)| at.elapsed() > PARSE_CACHE_TTL);
  match expired {
    Some(false) => store.get(url).map(|(_, feed)| feed.clone()),
    Some(true) => {
      store.remove(url);
      None
    }
    None => None,
  }
}

fn cache_put(url: &str, feed: &feed_rs::model::Feed) {
  if let Ok(mut store) = cache_store().lock() {
    store.retain(|_, (at, _)| at.elapsed() <= PARSE_CACHE_TTL);
    store.insert(url.to_string(), (Instant::now(), feed.clone()));
  }
}

/// 请求正文（返回 (body, 最终地址)）
pub async fn fetch_body(url: &str, client: &reqwest::Client) -> Result<(String, String), String> {
  let response = client
    .get(url)
    .header(
      "accept",
      "text/html,application/xhtml+xml,application/xml;q=0.9,application/atom+xml;q=0.8,*/*;q=0.8",
    )
    .send()
    .await
    .map_err(|error| {
      log::error!("ERROR: {:?}", error);
      error.to_string()
    })?;

  match response.status() {
    reqwest::StatusCode::OK => {
      let final_url = response.url().to_string();
      let body = response.text().await.map_err(|error| error.to_string())?;
      Ok((body, final_url))
    }
    reqwest::StatusCode::NOT_ACCEPTABLE => Err(
      "The server cannot produce a response that matches the accept headers sent by the client."
        .to_string(),
    ),
    reqwest::StatusCode::NOT_FOUND => Err(String::from("Could not find a feed at the location.")),
    // 状态码要出现在错误串里：403/401 在"生成器/实例"路径上是最常见的失败（公共实例限流），
    // 前端据此给出"换实例"的可操作提示，而不是笼统的"没找到 feed"。
    other => Err(format!(
      "HTTP {} {}",
      other.as_u16(),
      other.canonical_reason().unwrap_or("Error")
    )),
  }
}

/// 请求 → 解析为 feed（带缓存）：返回 (feed, 真正生效的地址)
pub async fn parse_feed_cached(
  url: &str,
  client: &reqwest::Client,
) -> Result<(feed_rs::model::Feed, String), String> {
  if let Some(feed) = cache_get(url) {
    return Ok((feed, url.to_string()));
  }

  let (body, final_url) = fetch_body(url, client).await?;
  match parser::parse(body.as_bytes()) {
    Ok(feed) => {
      cache_put(url, &feed);
      Ok((feed, final_url))
    }
    Err(error) => {
      log::error!("content parse error{:?}", error);
      Err(error.to_string())
    }
  }
}

/// 从 HTML 里抠出声明的 feed 地址（`<link rel="alternate" type="application/rss+xml|atom+xml">`）
fn discover_links_from_html(base: &str, html: &str) -> Vec<String> {
  let document = Html::parse_document(html);
  let selector = Selector::parse("link[rel~=alternate]").unwrap();
  let mut found: Vec<String> = vec![];

  for element in document.select(&selector) {
    let kind = element.value().attr("type").unwrap_or("").to_lowercase();
    if !(kind.contains("rss") || kind.contains("atom") || kind.contains("xml")) {
      continue;
    }
    if let Some(href) = element.value().attr("href") {
      if let Some(url) = absolute_url(base, href) {
        if !found.contains(&url) {
          found.push(url);
        }
      }
    }
  }

  found
}

/// 相对地址 → 绝对地址（只用标准库，不引 url crate）
fn absolute_url(base: &str, href: &str) -> Option<String> {
  let href = href.trim();
  if href.is_empty() {
    return None;
  }
  if href.starts_with("http://") || href.starts_with("https://") {
    return Some(href.to_string());
  }
  // 取 base 的 origin（scheme://host[:port]）
  let scheme_end = base.find("://")? + 3;
  let origin_end = base[scheme_end..]
    .find('/')
    .map(|i| scheme_end + i)
    .unwrap_or(base.len());
  let origin = &base[..origin_end];

  if let Some(path) = href.strip_prefix("//") {
    return Some(format!("{}://{}", &base[..scheme_end - 3], path));
  }
  if href.starts_with('/') {
    return Some(format!("{}{}", origin, href));
  }
  Some(format!("{}/{}", origin, href))
}

/// 常见 feed 路径（拼在站点根上）
fn common_feed_paths(base: &str) -> Vec<String> {
  const PATHS: [&str; 6] = [
    "/feed",
    "/rss",
    "/feed.xml",
    "/rss.xml",
    "/atom.xml",
    "/index.xml",
  ];

  let Some(scheme_end) = base.find("://").map(|i| i + 3) else {
    return vec![];
  };
  let origin_end = base[scheme_end..]
    .find('/')
    .map(|i| scheme_end + i)
    .unwrap_or(base.len());
  let origin = &base[..origin_end];

  PATHS.iter().map(|p| format!("{}{}", origin, p)).collect()
}

/// 看起来像 HTML？（feed 解析失败时才做这一层判断）
fn looks_like_html(body: &str) -> bool {
  let head = body.trim_start().to_lowercase();
  let head = &head[..head.len().min(400)];
  head.starts_with("<!doctype html") || head.starts_with("<html") || head.contains("<head")
}

/// 用户粘贴的任意地址 → 真正能喂给解析器的 feed
///
/// 1. 直接就是 feed → 用它
/// 2. 是网页 → 先认它声明的 `<link rel="alternate">`，再试常见路径
///
/// 返回 (feed, 生效地址, 尝试过的候选地址)；这一步就是“粘贴任何地址”的兑现。
pub async fn resolve_feed_input(
  input: &str,
  client: &reqwest::Client,
) -> Result<(feed_rs::model::Feed, String, Vec<String>), String> {
  if let Some(feed) = cache_get(input) {
    return Ok((feed, input.to_string(), vec![input.to_string()]));
  }

  let (body, final_url) = fetch_body(input, client).await?;

  // ① 直接是 feed
  if let Ok(feed) = parser::parse(body.as_bytes()) {
    cache_put(input, &feed);
    return Ok((feed, final_url, vec![input.to_string()]));
  }

  if !looks_like_html(&body) {
    return Err(String::from("Not a feed"));
  }

  // ② 网页：声明的 alternate 优先，其次常见路径。
  // 探测是**串行**的，所以给整段一个 deadline 并限制候选数——否则慢站点上
  // "正在检测"要等 1 + N 个请求全部超时；用户侧只感知到"卡住了"。
  let mut candidates = discover_links_from_html(&final_url, &body);
  candidates.extend(common_feed_paths(&final_url));
  candidates.truncate(DISCOVERY_MAX_CANDIDATES);

  let probing = async {
    for candidate in &candidates {
      // 命中即直接用这次解析结果（不重抓：命中已写进缓存）
      if let Ok((feed, _)) = parse_feed_cached(candidate, client).await {
        return Some((feed, candidate.to_string()));
      }
    }
    None
  };

  match tokio::time::timeout(DISCOVERY_BUDGET, probing).await {
    Ok(Some((feed, found))) => Ok((feed, found, candidates)),
    Ok(None) => Err(String::from("No feed found on that page")),
    Err(_) => Err(format!(
      "Feed discovery timed out after {}s",
      DISCOVERY_BUDGET.as_secs()
    )),
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_absolute_url() {
    let base = "https://sspai.com/post/1";
    assert_eq!(
      absolute_url(base, "/feed").unwrap(),
      "https://sspai.com/feed"
    );
    assert_eq!(
      absolute_url(base, "feed.xml").unwrap(),
      "https://sspai.com/feed.xml"
    );
    assert_eq!(
      absolute_url(base, "https://other.com/rss").unwrap(),
      "https://other.com/rss"
    );
    assert_eq!(
      absolute_url(base, "//cdn.com/rss").unwrap(),
      "https://cdn.com/rss"
    );
    assert!(absolute_url(base, "  ").is_none());
  }

  #[test]
  fn test_common_feed_paths_from_any_page() {
    let paths = common_feed_paths("https://sspai.com/post/1?x=1");
    assert!(paths.contains(&"https://sspai.com/feed".to_string()));
    assert!(paths.contains(&"https://sspai.com/atom.xml".to_string()));
    assert!(common_feed_paths("not a url").is_empty());
  }

  #[test]
  fn test_discover_links_from_html() {
    let html = r#"<html><head>
      <link rel="alternate" type="application/rss+xml" title="RSS" href="/feed">
      <link rel="alternate" type="application/atom+xml" href="https://cdn.example.com/atom.xml">
      <link rel="stylesheet" href="/style.css">
      <link rel="alternate" type="text/html" href="/amp">
      <link rel="alternate" type="application/rss+xml" href="/feed">
    </head><body></body></html>"#;

    let found = discover_links_from_html("https://blog.example.com/post", html);
    // 只认 rss/atom/xml，相对地址补全，去重
    assert_eq!(
      found,
      vec![
        "https://blog.example.com/feed".to_string(),
        "https://cdn.example.com/atom.xml".to_string()
      ]
    );
  }

  #[test]
  fn test_looks_like_html() {
    assert!(looks_like_html("<!DOCTYPE html><html>"));
    assert!(looks_like_html("  <html lang=\"zh\">"));
    assert!(!looks_like_html("<?xml version=\"1.0\"?><rss>"));
    assert!(!looks_like_html(""));
  }

  /// 真网络：探测耗时必须有界（超时改造前：无超时 → 慢站点无限转圈）
  #[tokio::test]
  #[ignore]
  async fn test_resolve_latency_is_bounded() {
    let client = reqwest::Client::new();
    for url in [
      "https://sspai.com",   // 首页不是 feed → 走发现层
      "https://example.com", // 没有 feed → 试完候选后报错
      "http://10.255.255.1", // 不回包 → 必须被连接超时截断
    ] {
      let started = std::time::Instant::now();
      let res = resolve_feed_input(url, &client).await;
      let elapsed = started.elapsed();
      println!(
        "{:28} {:>6.1}s  {}",
        url,
        elapsed.as_secs_f32(),
        match &res {
          Ok((feed, effective, _)) => format!(
            "OK → {} ({})",
            effective,
            feed
              .title
              .as_ref()
              .map(|t| t.content.clone())
              .unwrap_or_default()
          ),
          Err(err) => format!("ERR {}", err),
        }
      );
      assert!(
        elapsed < std::time::Duration::from_secs(20),
        "{} 耗时 {:?}，超出预算",
        url,
        elapsed
      );
    }
  }

  /// 真网络：粘贴站点首页应能发现 feed（默认 ignore，手动 `cargo test -- --ignored` 跑）
  #[tokio::test]
  #[ignore]
  async fn test_resolve_feed_input_on_a_website() {
    let client = reqwest::Client::new();
    let res = resolve_feed_input("https://sspai.com", &client).await;
    println!(
      "resolve: {:?}",
      res
        .as_ref()
        .map(|(f, url, c)| (f.title.clone(), url.clone(), c.len()))
    );
    assert!(res.is_ok(), "站点首页应能发现 feed");
  }

  #[tokio::test]
  async fn test_parse_feed() {
    let url = "https://www.treasurydirect.gov/TA_WS/securities/announced/rss";
    let client = reqwest::Client::new();
    let res = parse_feed_cached(url, &client).await;
    println!("{:?}", res);
  }
}
