//! 站点规则 fetcher：长尾站点的「本地 RSSHub」。
//!
//! 两层来源：
//!   1. `src/sites/` 硬编码站点——需要编排/清洗、规则表达不了的（t.me 频道）
//!   2. site-rules TOML 规则——内置包 + 用户目录 `~/.lettura/rules/*.toml`
//!      （同 key 覆盖内置，每次加载都重读目录 = 热加载）
//!
//! 归一化产物与其他 fetcher 一致：`FetchedArticle`，入库链路零适配。

use std::collections::HashMap;
use std::path::PathBuf;

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use fetcher_core::{
  Carrier, DetectInput, DetectOutput, FeedDraft, FetchContext, Fetcher, FetchedArticle,
};
use regex::Regex;
use scraper::{Html, Selector};
use site_rules::Rule;

pub mod sites;

use sites::tme;

pub struct SiteFetcher;

// ── 规则装载 ────────────────────────────────────────────────────────

fn user_rules_dir() -> Option<PathBuf> {
  std::env::var("HOME")
    .ok()
    .map(|home| PathBuf::from(home).join(".lettura").join("rules"))
}

/// 内置规则 + 用户目录规则（同 key 覆盖）。每次调用重读目录——热加载。
pub fn load_rules() -> Vec<Rule> {
  let mut rules = site_rules::builtin_rules();

  if let Some(dir) = user_rules_dir() {
    if let Ok(read_dir) = std::fs::read_dir(&dir) {
      let paths: Vec<PathBuf> = read_dir
        .flatten()
        .map(|e| e.path())
        .filter(|p| p.extension().map(|ext| ext == "toml").unwrap_or(false))
        .collect();
      for path in paths {
        match std::fs::read_to_string(&path)
          .map_err(|e| e.to_string())
          .and_then(|content| site_rules::parse_rule(&content))
        {
          Ok(rule) => {
            rules.retain(|r| r.key != rule.key);
            rules.push(rule);
          }
          Err(err) => {
            log::warn!("用户规则 {} 加载失败，已跳过: {}", path.display(), err);
          }
        }
      }
    }
  }

  rules
}

/// 找到第一条匹配 raw 的规则 + 命名捕获组
fn find_rule(raw: &str) -> Option<(Rule, HashMap<String, String>)> {
  for rule in load_rules() {
    let Ok(re) = Regex::new(&rule.pattern) else { continue };
    if let Some(caps) = re.captures(raw) {
      let mut params = HashMap::new();
      for name in re.capture_names().flatten() {
        if let Some(value) = caps.name(name) {
          params.insert(name.to_string(), value.as_str().to_string());
        }
      }
      return Some((rule, params));
    }
  }
  None
}

/// 模板插值：{name} → 参数值（未知占位保持原样，方便排错）
pub fn interpolate(template: &str, params: &HashMap<String, String>) -> String {
  let re = Regex::new(r"\{(\w+)\}").unwrap();
  re.replace_all(template, |caps: &regex::Captures| {
    params
      .get(&caps[1])
      .cloned()
      .unwrap_or_else(|| caps[0].to_string())
  }).into_owned()
}

// ── JSONPath 子集（$、.、[*]）──────────────────────────────────────

fn json_select<'a>(root: &'a serde_json::Value, path: &str) -> Vec<&'a serde_json::Value> {
  let body = path.strip_prefix('$').unwrap_or(path);
  let body = body.strip_prefix('.').unwrap_or(body);
  let mut current: Vec<&serde_json::Value> = vec![root];

  for seg in body.split('.').filter(|s| !s.is_empty()) {
    let (name, wildcard) = match seg.strip_suffix("[*]") {
      Some(name) => (name, true),
      None => (seg, false),
    };
    let mut next = Vec::new();
    for value in &current {
      let stepped = if name.is_empty() {
        Some(*value)
      } else {
        value.get(name)
      };
      if let Some(step) = stepped {
        if wildcard {
          if let serde_json::Value::Array(arr) = step {
            next.extend(arr.iter());
          }
        } else {
          next.push(step);
        }
      }
    }
    current = next;
  }

  current
}

fn json_string(value: &serde_json::Value, path: &str) -> Option<String> {
  let first = json_select(value, path).into_iter().next()?;
  match first {
    serde_json::Value::String(s) => Some(s.clone()),
    serde_json::Value::Null => None,
    other => Some(other.to_string()),
  }
}

// ── HTML 字段（CSS 选择器 + @attr/@text）──────────────────────────

fn html_string(item: scraper::ElementRef, spec: &str) -> Option<String> {
  let (selector_part, take) = match spec.split_once('@') {
    Some((sel, attr)) => (sel, attr.to_string()),
    None => (spec, String::new()),
  };

  if selector_part.is_empty() {
    // "@href"：取列表元素自身的属性/文本
    return match take.as_str() {
      "" => Some(item.inner_html()),
      "text" => Some(item.text().collect()),
      attr => item.value().attr(attr).map(str::to_string),
    };
  }

  let selector = Selector::parse(selector_part).ok()?;
  let el = item.select(&selector).next()?;
  match take.as_str() {
    "" => Some(el.inner_html()),
    "text" => Some(el.text().collect()),
    attr => el.value().attr(attr).map(str::to_string),
  }
}

// ── 执行规则 ────────────────────────────────────────────────────────

/// 日期尽量归一成主库 pub_date 格式；解析不了就原样存（查询层有兜底）
fn normalize_date(raw: String) -> String {
  if let Ok(dt) = DateTime::parse_from_rfc3339(&raw) {
    return dt
      .with_timezone(&Utc)
      .naive_utc()
      .format("%Y-%m-%d %H:%M:%S")
      .to_string();
  }
  raw
}

fn first_line(s: &str) -> String {
  s.lines().next().unwrap_or_default().trim().to_string()
}

/// 跑一条规则：插值 URL → 抓取（json/html）→ 映射条目。
/// /api/generated 端点与 detect/fetch 共用这一段。
pub async fn run_rule(
  rule: &Rule,
  params: &HashMap<String, String>,
  http: &reqwest::Client,
) -> Result<Vec<FetchedArticle>, String> {
  let url = interpolate(&rule.fetch.url, params);
  let mut request = http.get(&url);
  for (key, value) in &rule.fetch.headers {
    request = request.header(key, value);
  }
  let response = request
    .send()
    .await
    .map_err(|e| format!("规则 {} 请求失败: {e}", rule.key))?;
  if !response.status().is_success() {
    return Err(format!("规则 {} 请求 HTTP {}", rule.key, response.status()));
  }

  match rule.fetch.kind.as_str() {
    "json" => {
      let value: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("规则 {} 响应不是合法 JSON: {e}", rule.key))?;
      let entries = json_select(&value, &rule.item.list)
        .into_iter()
        .map(|item| FetchedArticle {
          title: json_string(item, &rule.item.title)
            .map(|t| first_line(&t))
            .unwrap_or_default(),
          link: json_string(item, &rule.item.link).unwrap_or_default(),
          content_html: if rule.item.content.is_empty() {
            None
          } else {
            json_string(item, &rule.item.content)
          },
          summary: None,
          author: if rule.item.author.is_empty() {
            None
          } else {
            json_string(item, &rule.item.author)
          },
          published_at: if rule.item.date.is_empty() {
            String::new()
          } else {
            json_string(item, &rule.item.date)
              .map(normalize_date)
              .unwrap_or_default()
          },
          media: vec![],
          carrier: Carrier::Text,
        })
        .collect();
      Ok(entries)
    }
    "html" => {
      let body = response.text().await.map_err(|e| e.to_string())?;
      let document = Html::parse_document(&body);
      let list_selector = Selector::parse(&rule.item.list)
        .map_err(|e| format!("规则 {} 的 list 选择器非法: {e}", rule.key))?;
      let entries = document
        .select(&list_selector)
        .filter_map(|item| {
          let title = html_string(item, &rule.item.title)
            .map(|t| first_line(&t))
            .unwrap_or_default();
          let link = html_string(item, &rule.item.link).unwrap_or_default();
          if title.is_empty() && link.is_empty() {
            return None;
          }
          Some(FetchedArticle {
            title,
            link,
            content_html: if rule.item.content.is_empty() {
              None
            } else {
              html_string(item, &rule.item.content)
            },
            summary: None,
            author: if rule.item.author.is_empty() {
              None
            } else {
              html_string(item, &rule.item.author)
            },
            published_at: if rule.item.date.is_empty() {
              String::new()
            } else {
              html_string(item, &rule.item.date)
                .map(normalize_date)
                .unwrap_or_default()
            },
            media: vec![],
            carrier: Carrier::Text,
          })
        })
        .collect();
      Ok(entries)
    }
    other => Err(format!("规则 {} 的 type 未知: {other}", rule.key)),
  }
}

/// 供 /api/generated 与订阅探测复用：按 key 取规则并执行
pub async fn fetch_rule(
  key: &str,
  params: &HashMap<String, String>,
  http: &reqwest::Client,
) -> Result<(String, Vec<FetchedArticle>), String> {
  let rule = load_rules()
    .into_iter()
    .find(|r| r.key == key)
    .ok_or_else(|| format!("规则 {key} 不存在"))?;
  let entries = run_rule(&rule, params, http).await?;
  Ok((interpolate(&rule.title, params), entries))
}

fn source_params(config: &serde_json::Value) -> HashMap<String, String> {
  config
    .get("params")
    .and_then(|v| v.as_object())
    .map(|map| {
      map
        .iter()
        .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
        .collect()
    })
    .unwrap_or_default()
}

// ── Fetcher 实现 ────────────────────────────────────────────────────

#[async_trait]
impl Fetcher for SiteFetcher {
  fn id(&self) -> &'static str {
    "site"
  }

  fn carrier_hint(&self) -> Carrier {
    Carrier::Text
  }

  fn claims(&self, raw: &str) -> bool {
    tme::claims(raw) || find_rule(raw).is_some()
  }

  async fn detect(&self, input: &DetectInput) -> Result<DetectOutput, String> {
    // 硬编码站点优先：需要编排/清洗的站，规则表达不了
    if let Some((params, url)) = tme::parse(&input.raw) {
      let (title, entries) = tme::fetch(&url, &input.http).await?;
      return Ok(DetectOutput {
        provider: self.id().to_string(),
        feed: FeedDraft {
          title,
          link: url.clone(),
          carrier: Carrier::Text,
          ..Default::default()
        },
        resolved_url: url,
        candidates: vec![],
        entries,
        source_config: serde_json::json!({ "site": "tme", "params": params }),
      });
    }

    if let Some((rule, params)) = find_rule(&input.raw) {
      let entries = run_rule(&rule, &params, &input.http).await?;
      return Ok(DetectOutput {
        provider: self.id().to_string(),
        feed: FeedDraft {
          title: interpolate(&rule.title, &params),
          description: rule.description.clone(),
          carrier: Carrier::Text,
          ..Default::default()
        },
        // 粘贴的 URL 本身就是订阅标识（唯一且稳定）
        resolved_url: input.raw.clone(),
        candidates: vec![],
        entries,
        source_config: serde_json::json!({ "rule": rule.key, "params": params }),
      });
    }

    Err("没有站点规则匹配该地址".to_string())
  }

  async fn fetch(&self, ctx: &FetchContext) -> Result<Vec<FetchedArticle>, String> {
    let config = &ctx.feed.source_config;

    if config.get("site").and_then(|v| v.as_str()) == Some("tme") {
      let params = source_params(config);
      let url = tme::url_from_params(&params)?;
      let (_title, entries) = tme::fetch(&url, &ctx.http).await?;
      return Ok(entries);
    }

    if let Some(key) = config.get("rule").and_then(|v| v.as_str()) {
      let rule = load_rules()
        .into_iter()
        .find(|r| r.key == key)
        .ok_or_else(|| format!("规则 {key} 不存在（可能已被删除）"))?;
      return run_rule(&rule, &source_params(config), &ctx.http).await;
    }

    Err("source_config 缺少 rule/site 字段".to_string())
  }
}

// ── RSS 渲染（/api/generated 用）───────────────────────────────────

fn xml_escape(s: &str) -> String {
  s.replace('&', "&amp;")
    .replace('<', "&lt;")
    .replace('>', "&gt;")
    .replace('"', "&quot;")
}

/// RSS 2.0 渲染：把规则产出供应为真实 feed（Lettura = 本地 RSS 服务）
pub fn to_rss(title: &str, link: &str, entries: &[FetchedArticle]) -> String {
  let mut xml = String::from("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
  xml.push_str("<rss version=\"2.0\"><channel>");
  xml.push_str(&format!(
    "<title>{}</title><link>{}</link><description>{}</description>",
    xml_escape(title),
    xml_escape(link),
    xml_escape(title)
  ));

  for entry in entries {
    // CDATA 里唯一的雷是 "]]>"：拆开写
    let description = entry
      .content_html
      .as_deref()
      .or(entry.summary.as_deref())
      .unwrap_or("")
      .replace("]]>", "]]]]><![CDATA[>");
    let pub_date = if entry.published_at.is_empty() {
      String::new()
    } else {
      chrono::NaiveDateTime::parse_from_str(&entry.published_at, "%Y-%m-%d %H:%M:%S")
        .ok()
        .map(|d| DateTime::<Utc>::from_naive_utc_and_offset(d, Utc).to_rfc2822())
        .unwrap_or_default()
    };

    xml.push_str(&format!(
      "<item><title>{}</title><link>{}</link><guid>{}</guid>{}<description><![CDATA[{}]]></description></item>",
      xml_escape(&entry.title),
      xml_escape(&entry.link),
      xml_escape(&entry.link),
      if pub_date.is_empty() {
        String::new()
      } else {
        format!("<pubDate>{}</pubDate>", xml_escape(&pub_date))
      },
      description,
    ));
  }

  xml.push_str("</channel></rss>");
  xml
}

#[cfg(test)]
mod tests {
  use super::*;
  use site_rules::parse_rule;

  const JSON_RULE: &str = r#"
    [route]
    key = "demo-json"
    pattern = 'example\.com/(?P<cat>[\w-]+)'
    title = "Demo · {cat}"
    [route.fetch]
    url = "https://api.example.com/{cat}/list"
    type = "json"
    [route.item]
    list = "$.posts[*]"
    title = "$.title"
    link = "$.url"
    date = "$.at"
    author = "$.by"
  "#;

  const HTML_RULE: &str = r#"
    [route]
    key = "demo-html"
    pattern = 'html\.example\.com'
    title = "HTML Demo"
    [route.fetch]
    url = "https://html.example.com/"
    type = "html"
    [route.item]
    list = "li.post"
    title = "a"
    link = "a@href"
    date = "time@datetime"
    content = ".body"
  "#;

  #[test]
  fn json_rule_mapping() {
    let rule = parse_rule(JSON_RULE).unwrap();
    let payload = serde_json::json!({
      "posts": [
        {"title": "第一篇\n第二行", "url": "https://example.com/1", "at": "2026-09-27T08:30:00Z", "by": "alice"},
        {"title": 42, "url": "https://example.com/2"}
      ]
    });

    let entries: Vec<FetchedArticle> = json_select(&payload, &rule.item.list)
      .into_iter()
      .map(|item| FetchedArticle {
        title: json_string(item, &rule.item.title)
          .map(|t| first_line(&t))
          .unwrap_or_default(),
        link: json_string(item, &rule.item.link).unwrap_or_default(),
        published_at: json_string(item, &rule.item.date)
          .map(normalize_date)
          .unwrap_or_default(),
        ..Default::default()
      })
      .collect();

    assert_eq!(entries[0].title, "第一篇");
    assert_eq!(entries[0].link, "https://example.com/1");
    assert_eq!(entries[0].published_at, "2026-09-27 08:30:00");
    // 非字符串字段转字符串
    assert_eq!(entries[1].title, "42");
  }

  #[test]
  fn html_rule_mapping() {
    let rule = parse_rule(HTML_RULE).unwrap();
    let html = r#"<ul>
      <li class="post"><a href="/a">文章 A</a><time datetime="2026-09-27T01:00:00Z"></time><div class="body"><p>正文</p></div></li>
      <li class="post"><a href="/b">文章 B</a></li>
    </ul>"#;
    let document = Html::parse_document(html);
    let selector = Selector::parse(&rule.item.list).unwrap();

    let entries: Vec<FetchedArticle> = document
      .select(&selector)
      .filter_map(|item| {
        Some(FetchedArticle {
          title: html_string(item, &rule.item.title)?,
          link: html_string(item, &rule.item.link)?,
          published_at: html_string(item, &rule.item.date)
            .map(normalize_date)
            .unwrap_or_default(),
          content_html: html_string(item, &rule.item.content),
          ..Default::default()
        })
      })
      .collect();

    assert_eq!(entries.len(), 2);
    assert_eq!(entries[0].title, "文章 A");
    assert_eq!(entries[0].link, "/a");
    assert_eq!(entries[0].published_at, "2026-09-27 01:00:00");
    assert_eq!(entries[0].content_html, Some("<p>正文</p>".to_string()));
    assert_eq!(entries[1].published_at, "");
  }

  #[test]
  fn test_interpolate() {
    let mut params = HashMap::new();
    params.insert("cat".to_string(), "tech".to_string());
    assert_eq!(interpolate("x/{cat}/y", &params), "x/tech/y");
    assert_eq!(interpolate("x/{unknown}", &params), "x/{unknown}");
  }

  #[test]
  fn test_to_rss_escapes() {
    let entry = FetchedArticle {
      title: "a<b>&\"c".into(),
      link: "https://example.com/1".into(),
      content_html: Some("<p>x</p>]]>".into()),
      summary: None,
      author: None,
      published_at: "2026-09-27 08:30:00".into(),
      media: vec![],
      carrier: Carrier::Text,
    };
    let xml = to_rss("Demo", "https://example.com", &[entry]);
    assert!(xml.contains("<title>a&lt;b&gt;&amp;&quot;c</title>"));
    assert!(xml.contains("]]]]><![CDATA[>"));
    assert!(xml.contains("<pubDate>"));
  }
}
