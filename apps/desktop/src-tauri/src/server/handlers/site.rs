//! 站点规则（site-rules）的 HTTP 面：
//!   - GET /api/rules           规则清单（设置页展示 / 外部工具发现）
//!   - GET /api/generated/{key} 规则产出供应为真实 RSS——Lettura 同时是
//!     一台本地转换服务，局域网内其他阅读器也能订阅这些地址

use actix_web::{get, web, HttpResponse, Responder};
use serde::Serialize;

use crate::feed;
use fetcher_site::SiteFetcher;
use std::collections::HashMap;

#[derive(Serialize)]
struct RuleSummary {
  key: String,
  title: String,
  pattern: String,
  kind: String,
  source: String,
}

#[get("/api/rules")]
pub async fn handle_list_rules() -> impl Responder {
  let rules: Vec<RuleSummary> = fetcher_site::load_rules()
    .into_iter()
    .map(|rule| RuleSummary {
      source: String::from("builtin"),
      key: rule.key,
      title: rule.title,
      pattern: rule.pattern,
      kind: rule.fetch.kind,
    })
    .collect();
  HttpResponse::Ok().json(rules)
}

/// /api/generated/{key}?param=value —— 查询参数即规则的命名捕获组。
/// 例：/api/generated/github-commits?owner=direktiv&repo=xxx
#[get("/api/generated/{key}")]
pub async fn handle_generated(
  key: web::Path<String>,
  query: web::Query<HashMap<String, String>>,
) -> impl Responder {
  let key = key.into_inner();
  let params = query.into_inner();
  // 与探测路径同一客户端构造（代理/UA/超时单一出口）
  let client = feed::create_client("https://t.me");

  match fetcher_site::fetch_rule(&key, &params, &client).await {
    Ok((title, entries)) => HttpResponse::Ok()
      .content_type("application/rss+xml; charset=utf-8")
      .body(fetcher_site::to_rss(&title, "", &entries)),
    Err(err) => HttpResponse::NotFound().json(serde_json::json!({ "error": err })),
  }
}

// SiteFetcher 的 fetch 走同一引擎；此引用仅为类型层面说明其关系
#[allow(dead_code)]
fn _same_engine(_f: &SiteFetcher) {}

pub fn config(cfg: &mut web::ServiceConfig) {
  cfg.service(handle_list_rules).service(handle_generated);
}
