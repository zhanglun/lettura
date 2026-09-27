//! 邮件 → 阅读器条目的字段映射。
//!
//! 纯函数、不碰网络：给一段 RFC822 原文和一个 uid，产出 [`FetchedArticle`]。
//! 全部离线可测，这里是用例最密的地方。

use fetcher_core::{Carrier, FetchedArticle};
use mail_parser::{DateTime, Message, MessageParser, PartType};

/// 摘要截断长度（按字符数不是字节——中文一个字算一个）
const SUMMARY_MAX_CHARS: usize = 200;

/// 一封原始邮件 → 阅读器条目。连有效头都没有的原文视为脏数据，返回 Err
/// 让上层中断本次同步（宁可少一篇，不可静默丢字段入库）。
pub fn article_from_raw(
  account_uuid: &str,
  uid: u32,
  raw: &[u8],
) -> Result<FetchedArticle, String> {
  let message = MessageParser::default()
    .parse(raw)
    .ok_or_else(|| format!("uid {uid} 的邮件内容无法解析（缺少有效邮件头）"))?;
  Ok(article_from_message(account_uuid, uid, &message))
}

/// 已解析邮件 → 阅读器条目。
///
/// uid 必须取自 FETCH 响应的 UID 属性：link 尾段就是它，主库靠 link 去重，
/// 改这个格式等于把每封邮件重新灌一遍。
pub fn article_from_message(account_uuid: &str, uid: u32, message: &Message) -> FetchedArticle {
  // body_text 会自动兜底：有 text 部分取原文，否则把 html 转成纯文本
  let text = message.body_text(0).map(|cow| cow.into_owned());
  // 正文 HTML 优先（阅读器渲染链路吃 html）。注意 mail-parser 会把 text 部分
  // 同时挂到 html_body 下做自动转换（包 <html><body>），所以「是不是真 html」
  // 要看 part 本体类型，不能只看 html_body 非空；纯文本邮件按契约包 <pre>。
  let content_html = message
    .html_part(0)
    .or_else(|| message.text_part(0))
    .and_then(|part| match &part.body {
      PartType::Html(html) => Some(html.as_ref().to_string()),
      PartType::Text(text) => Some(format!("<pre>{}</pre>", escape_html(text.trim()))),
      _ => None,
    });

  FetchedArticle {
    title: message
      .subject()
      .filter(|s| !s.is_empty())
      .unwrap_or("(无主题)")
      .to_string(),
    link: format!("urn:lettura:mail/{account_uuid}/{uid}"),
    content_html,
    summary: make_summary(text.as_deref()),
    author: author_of(message),
    published_at: message.date().map(format_utc).unwrap_or_default(),
    media: Vec::new(),
    carrier: Carrier::Email,
  }
}

/// Date 头 → UTC `YYYY-MM-DD HH:MM:SS`，与主库 pub_date 列格式一致
pub fn format_utc(date: &DateTime) -> String {
  chrono::DateTime::from_timestamp(date.to_timestamp(), 0)
    .map(|t| t.format("%Y-%m-%d %H:%M:%S").to_string())
    .unwrap_or_default()
}

/// 发件人展示名：有 name 用 name，否则退回地址本身
fn author_of(message: &Message) -> Option<String> {
  let addr = message.from().and_then(|a| a.first())?;
  addr
    .name()
    .map(str::to_string)
    .or_else(|| addr.address().map(str::to_string))
}

/// 摘要 = 纯文本前 200 字符。text 传 `body_text(0)` 的结果——mail-parser
/// 对 HTML-only 邮件会自动做 html→text（含实体/标签处理），无需自己剥标签。
fn make_summary(text: Option<&str>) -> Option<String> {
  let plain = text?.trim();
  if plain.is_empty() {
    return None;
  }
  let summary: String = plain.chars().take(SUMMARY_MAX_CHARS).collect();
  Some(summary)
}

/// 纯文本正文包 <pre> 前的最小转义，防止正文里的 < 被当标签渲染
fn escape_html(s: &str) -> String {
  s.replace('&', "&amp;")
    .replace('<', "&lt;")
    .replace('>', "&gt;")
}

#[cfg(test)]
mod tests {
  use super::*;

  /// 完整 RFC822 样本：multipart/alternative（text + html 双部分）、带时区 Date、
  /// 带显示名的 From——newsletter 邮件的标准长相。
  const DIGEST_RAW: &str = "From: \"Ada Lovelace\" <ada@analytical.engine>\r\n\
    To: reader@example.com\r\n\
    Subject: Weekly Digest #12\r\n\
    Date: Mon, 7 Jul 2025 08:30:00 +0200\r\n\
    Message-ID: <digest-12@analytical.engine>\r\n\
    MIME-Version: 1.0\r\n\
    Content-Type: multipart/alternative; boundary=\"BOUND42\"\r\n\
    \r\n\
    --BOUND42\r\n\
    Content-Type: text/plain; charset=utf-8\r\n\
    \r\n\
    Hello plain world. Issue twelve.\r\n\
    --BOUND42\r\n\
    Content-Type: text/html; charset=utf-8\r\n\
    \r\n\
    <html><body><h1>Hello</h1><p>Issue <b>twelve</b>.</p></body></html>\r\n\
    --BOUND42--\r\n";

  #[test]
  fn digest_maps_all_fields() {
    let article = article_from_raw("acc-1", 42, DIGEST_RAW.as_bytes()).expect("解析成功");

    assert_eq!(article.title, "Weekly Digest #12");
    assert_eq!(article.link, "urn:lettura:mail/acc-1/42");
    // html 部分优先于 text 部分
    assert_eq!(
      article.content_html.as_deref(),
      Some("<html><body><h1>Hello</h1><p>Issue <b>twelve</b>.</p></body></html>")
    );
    // 摘要取纯文本部分
    assert_eq!(
      article.summary.as_deref(),
      Some("Hello plain world. Issue twelve.")
    );
    // 有显示名用显示名，不用裸地址
    assert_eq!(article.author.as_deref(), Some("Ada Lovelace"));
    // 08:30 +0200 → 06:30 UTC
    assert_eq!(article.published_at, "2025-07-07 06:30:00");
    assert_eq!(article.carrier, Carrier::Email);
    assert!(article.media.is_empty());
  }

  #[test]
  fn text_only_mail_wraps_pre_and_escapes() {
    let raw = "From: bot@example.com\r\nSubject: 纯文本通知\r\n\
      Date: Tue, 1 Jan 2025 00:30:00 -0100\r\n\
      Content-Type: text/plain; charset=utf-8\r\n\r\n\
      1 < 2 且 a & b\r\n";
    let article = article_from_raw("acc-1", 7, raw.as_bytes()).expect("解析成功");

    assert_eq!(
      article.content_html.as_deref(),
      Some("<pre>1 &lt; 2 且 a &amp; b</pre>")
    );
    // 00:30 -0100 → 01:30 UTC（西半球偏移反着加）
    assert_eq!(article.published_at, "2025-01-01 01:30:00");
  }

  #[test]
  fn missing_subject_and_date_fall_back() {
    let raw = "From: n@x.com\r\nContent-Type: text/plain\r\n\r\nbody\r\n";
    let article = article_from_raw("acc-1", 8, raw.as_bytes()).expect("解析成功");
    assert_eq!(article.title, "(无主题)");
    assert_eq!(article.published_at, "", "缺 Date 落空串，与主库兜底一致");
    assert_eq!(
      article.author.as_deref(),
      Some("n@x.com"),
      "无显示名退回地址"
    );
  }

  #[test]
  fn html_only_mail_still_has_summary() {
    let raw = "From: h@x.com\r\nSubject: html only\r\nDate: Wed, 2 Jul 2025 12:00:00 +0000\r\n\
      Content-Type: text/html; charset=utf-8\r\n\r\n\
      <p>标题一</p><p>标题二 &amp; 补充</p>\r\n";
    let article = article_from_raw("acc-1", 9, raw.as_bytes()).expect("解析成功");
    // body_text 对 HTML-only 邮件自动做 html→text（<p> 换行、实体已解）
    assert_eq!(article.summary.as_deref(), Some("标题一\n标题二 & 补充"));
    // 正文仍是邮件本来的 html，没有被再包一层
    assert!(article.content_html.unwrap().contains("<p>标题一</p>"));
  }

  #[test]
  fn summary_truncates_by_chars() {
    let body = "字".repeat(500);
    let raw =
      format!("From: a@b.com\r\nSubject: long\r\nContent-Type: text/plain\r\n\r\n{body}\r\n");
    let article = article_from_raw("acc-1", 10, raw.as_bytes()).expect("解析成功");
    let summary = article.summary.expect("有摘要");
    assert_eq!(summary.chars().count(), SUMMARY_MAX_CHARS);
    assert_eq!(summary, "字".repeat(SUMMARY_MAX_CHARS));
  }

  #[test]
  fn unparsable_and_garbage_raw() {
    // 空原文连头都没有，必须 Err
    assert!(article_from_raw("acc-1", 11, b"").is_err());
    // mail-parser 是宽松解析器：垃圾字节不 panic、best-effort 出条目即可
    let article = article_from_raw("acc-1", 12, b"\x00\xff\xfe garbage").expect("宽松解析不 panic");
    assert_eq!(article.link, "urn:lettura:mail/acc-1/12");
  }
}
