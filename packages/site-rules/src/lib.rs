//! site-rules：站点抓取规则（TOML）的解析、校验与内置规则包。
//!
//! 一条规则 = 「怎么读一个站点」：URL 正则 + 抓取方式（JSON API / HTML 页）
//! + 字段映射（JSONPath / CSS 选择器）。长尾站点不写 Rust 代码就能接入——
//! 规则是数据，可热加载（用户目录 `~/.lettura/rules/*.toml` 覆盖内置同 key）。
//!
//! 本 crate 是纯数据 + 校验；抓取执行在 fetcher-site。

use regex::Regex;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleFile {
  pub route: Rule,
}

/// 一条站点规则。TOML 形如：
///
/// ```toml
/// [route]
/// key = "github-commits"
/// pattern = 'github\.com/(?P<owner>[\w.-]+)/(?P<repo>[\w.-]+)'
/// title = "GitHub · {owner}/{repo} commits"
///
/// [route.fetch]
/// url = "https://api.github.com/repos/{owner}/{repo}/commits?per_page=30"
/// type = "json"            # json(JSONPath) | html(CSS 选择器)
///
/// [route.item]
/// list  = "$[*]"
/// title = "$.commit.message"
/// link  = "$.html_url"
/// date  = "$.commit.author.date"
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rule {
  /// 规则标识：`[a-z0-9][a-z0-9-]*`，同时是用户目录里的文件名
  pub key: String,
  /// 匹配用户粘贴的 URL；命名捕获组 (?P<x>...) 可注入 fetch.url 与 title
  pub pattern: String,
  /// 源标题模板，可用 {x} 引用捕获组
  pub title: String,
  #[serde(default)]
  pub description: String,
  pub fetch: FetchSpec,
  pub item: ItemSpec,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FetchSpec {
  pub url: String,
  /// json | html
  #[serde(rename = "type")]
  pub kind: String,
  #[serde(default)]
  pub headers: std::collections::HashMap<String, String>,
}

/// 字段映射。
/// - json：每项是 JSONPath 子集（`$.a.b[*].c`）
/// - html：每项是 CSS 选择器，可带 `@attr` 取属性（`a@href`）、`@text` 取文本；
///   不带后缀取 inner_html；`@` 前留空表示取列表元素自身（`@href`）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ItemSpec {
  pub list: String,
  pub title: String,
  pub link: String,
  #[serde(default)]
  pub date: String,
  #[serde(default)]
  pub author: String,
  #[serde(default)]
  pub content: String,
}

/// 校验失败的错误：字段名 + 原因，设置页导入时要给到人看
pub fn parse_rule(toml_str: &str) -> Result<Rule, String> {
  let file: RuleFile = toml::from_str(toml_str).map_err(|e| format!("规则 TOML 解析失败: {e}"))?;
  validate(file.route)
}

pub fn validate(rule: Rule) -> Result<Rule, String> {
  if !Regex::new(r"^[a-z0-9][a-z0-9-]*$")
    .unwrap()
    .is_match(&rule.key)
  {
    return Err(format!(
      "规则 key `{}` 不合法：只能用小写字母/数字/连字符（它同时是文件名）",
      rule.key
    ));
  }
  Regex::new(&rule.pattern).map_err(|e| format!("规则 pattern 编译失败: {e}"))?;
  if rule.fetch.url.is_empty() {
    return Err("route.fetch.url 不能为空".into());
  }
  if !matches!(rule.fetch.kind.as_str(), "json" | "html") {
    return Err(format!(
      "route.fetch.type 必须是 json 或 html，当前是 `{}`",
      rule.fetch.kind
    ));
  }
  for (name, path) in [
    ("item.list", &rule.item.list),
    ("item.title", &rule.item.title),
    ("item.link", &rule.item.link),
  ] {
    if path.is_empty() {
      return Err(format!("{name} 不能为空"));
    }
  }
  Ok(rule)
}

/// 内置规则包（编译进二进制）；用户目录同 key 规则覆盖
pub const BUILTIN_RULES: &[(&str, &str)] = &[
  (
    "github-commits",
    include_str!("../rules/github-commits.toml"),
  ),
  ("hn-front", include_str!("../rules/hn-front.toml")),
];

/// 解析内置包；内置规则损坏是编译期事故，unwrap 即可
pub fn builtin_rules() -> Vec<Rule> {
  BUILTIN_RULES
    .iter()
    .map(|(_, content)| parse_rule(content).expect("builtin rule broken"))
    .collect()
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn builtin_rules_all_valid() {
    let rules = builtin_rules();
    assert_eq!(rules.len(), BUILTIN_RULES.len());
    for r in rules {
      assert!(Regex::new(&r.pattern).is_ok());
    }
  }

  #[test]
  fn parse_and_reject() {
    let ok = parse_rule(
      r#"
      [route]
      key = "demo"
      pattern = 'example\.com/(?P<cat>[\w-]+)'
      title = "Demo · {cat}"
      [route.fetch]
      url = "https://example.com/api/{cat}"
      type = "json"
      [route.item]
      list = "$[*]"
      title = "$.t"
      link = "$.u"
      "#,
    );
    assert!(ok.is_ok());

    assert!(parse_rule("not toml").is_err());
    assert!(parse_rule(
      r#"
      [route]
      key = "Bad_Key"
      pattern = "x"
      title = "t"
      [route.fetch]
      url = "https://x"
      type = "json"
      [route.item]
      list = "$[*]"
      title = "$.t"
      link = "$.u"
      "#
    )
    .is_err());
    assert!(parse_rule(
      r#"
      [route]
      key = "demo"
      pattern = "x"
      title = "t"
      [route.fetch]
      url = "https://x"
      type = "csv"
      [route.item]
      list = "$[*]"
      title = "$.t"
      link = "$.u"
      "#
    )
    .is_err());
  }
}
