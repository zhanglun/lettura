//! wbi 签名：B 站 web 接口的参数防伪（参考 bilibili-API-collect
//! docs/misc/sign/wbi.md）。流程：
//!   1. GET /x/web-interface/nav 拿 wbi_img.img_url / sub_url，
//!      取 URL 文件名（去扩展名）得 img_key / sub_key；
//!   2. 按混淆表重排 img_key+sub_key 取前 32 位得 mixin_key；
//!   3. 参数追加 wts → 按 key 字典序排序 → 值剔除 !'()* → URL 编码拼 query
//!      → 末尾拼 mixin_key → MD5 得 w_rid，最终请求带上 wts 与 w_rid。

use std::sync::Mutex;
use std::time::{Duration, Instant};

use md5::{Digest, Md5};
use once_cell::sync::Lazy;
use reqwest::Client;
use serde::Deserialize;

use crate::rate_limit;

/// 官方前端 JS 内置的固定置换表：决定 mixin_key 怎么从 64 位原始 key 里抽
const MIXIN_KEY_ENC_TAB: [usize; 64] = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29,
  28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25,
  54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52,
];

const NAV_URL: &str = "https://api.bilibili.com/x/web-interface/nav";
/// img/sub key 每日轮换：缓存 12 小时，既省请求又不会长时间踩在旧 key 上
const CACHE_TTL: Duration = Duration::from_secs(12 * 60 * 60);

/// nav 的 wbi_img 节点。未登录时外层 code 是 -101，但 wbi_img 照常返回，
/// 所以这里根本不看 code，只看有没有货。
#[derive(Deserialize)]
struct NavResp {
  #[serde(default)]
  data: NavData,
}

#[derive(Deserialize, Default)]
struct NavData {
  #[serde(default)]
  wbi_img: WbiImg,
}

#[derive(Deserialize, Default)]
struct WbiImg {
  #[serde(default)]
  img_url: String,
  #[serde(default)]
  sub_url: String,
}

/// 缓存 (写入时刻, mixin_key)
static MIXIN_CACHE: Lazy<Mutex<Option<(Instant, String)>>> = Lazy::new(|| Mutex::new(None));

/// 混淆表重排取前 32 位
pub fn mixin_key(img_key: &str, sub_key: &str) -> String {
  let raw: Vec<char> = format!("{}{}", img_key, sub_key).chars().collect();
  MIXIN_KEY_ENC_TAB
    .iter()
    .filter_map(|&i| raw.get(i))
    .take(32)
    .collect()
}

/// 取 nav 的 wbi key 并算出 mixin_key，带 12 小时缓存
pub async fn get_mixin_key(http: &Client, sessdata: Option<&str>) -> Result<String, String> {
  if let Some((at, key)) = &*MIXIN_CACHE.lock().unwrap() {
    if at.elapsed() < CACHE_TTL {
      return Ok(key.clone());
    }
  }

  rate_limit::pace().await;
  let resp: NavResp = http
    .get(NAV_URL)
    .headers(crate::browser_headers(sessdata))
    .send()
    .await
    .map_err(|e| format!("获取 B 站 wbi 密钥失败: {}", e))?
    .json()
    .await
    .map_err(|e| format!("解析 B 站 wbi 密钥响应失败: {}", e))?;

  let img_key = key_from_url(&resp.data.wbi_img.img_url);
  let sub_key = key_from_url(&resp.data.wbi_img.sub_url);
  if img_key.is_empty() || sub_key.is_empty() {
    return Err("B 站 nav 响应缺少 wbi_img，无法签名".into());
  }

  let key = mixin_key(&img_key, &sub_key);
  log::info!("刷新 B 站 wbi 密钥缓存");
  *MIXIN_CACHE.lock().unwrap() = Some((Instant::now(), key.clone()));
  Ok(key)
}

/// key 藏在 URL 文件名里：…/wbi/{key}.png → {key}
fn key_from_url(url: &str) -> String {
  let file = url.rsplit('/').next().unwrap_or("");
  match file.rsplit_once('.') {
    Some((key, _)) => key.to_string(),
    None => file.to_string(),
  }
}

/// 对参数做 wbi 签名，返回可直接拼到 URL 的 query（含 wts 与 w_rid）
pub fn sign_query(params: &[(&str, &str)], mixin_key: &str, wts: i64) -> String {
  let mut pairs: Vec<(&str, String)> = params.iter().map(|(k, v)| (*k, v.to_string())).collect();
  pairs.push(("wts", wts.to_string()));
  pairs.sort_by(|a, b| a.0.cmp(b.0));

  let query = pairs
    .iter()
    .map(|(k, v)| {
      format!(
        "{}={}",
        percent_encode(k),
        percent_encode(&strip_reserved(v))
      )
    })
    .collect::<Vec<_>>()
    .join("&");

  let w_rid = md5_hex(&format!("{}{}", query, mixin_key));
  format!("{}&w_rid={}", query, w_rid)
}

/// 签名前置过滤：这五个字符服务端会剔除，留在值里签名必炸
fn strip_reserved(value: &str) -> String {
  value
    .chars()
    .filter(|c| !matches!(c, '!' | '\'' | '(' | ')' | '*'))
    .collect()
}

/// encodeURIComponent 语义：字母数字与 -_.~ 保留，其余按 UTF-8 转 %XX
fn percent_encode(s: &str) -> String {
  let mut out = String::with_capacity(s.len());
  for byte in s.bytes() {
    match byte {
      b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => out.push(byte as char),
      other => out.push_str(&format!("%{:02X}", other)),
    }
  }
  out
}

fn md5_hex(s: &str) -> String {
  let mut hasher = Md5::new();
  hasher.update(s.as_bytes());
  hasher
    .finalize()
    .iter()
    .map(|b| format!("{:02x}", b))
    .collect()
}

#[cfg(test)]
mod tests {
  use super::*;

  // bilibili-API-collect wbi.md 的文档示例 key
  const IMG_KEY: &str = "7cd084941338484aae1ad9425b84077c";
  const SUB_KEY: &str = "4932caff0ff746eab6f01bf08b70ac45";

  #[test]
  fn mixin_key_applies_confusion_table() {
    let key = mixin_key(IMG_KEY, SUB_KEY);
    // 文档示例 key 的 mixin 结果是 ea1db124…（bilibili-API-collect 同款），锚定混淆表没抄错
    assert!(key.starts_with("ea1db"));
    assert_eq!(key.len(), 32);
    assert_eq!(key, mixin_key(IMG_KEY, SUB_KEY));
  }

  #[test]
  fn sign_query_sorts_keys_and_is_deterministic() {
    let mixin = mixin_key(IMG_KEY, SUB_KEY);
    let params = [("mid", "546195"), ("foo", "bar")];
    let a = sign_query(&params, &mixin, 1714564800);
    let b = sign_query(&params, &mixin, 1714564800);
    assert_eq!(a, b, "同一输入（含固定 wts）签名必须一致");

    // key 字典序：foo 排在 mid 前；wts 与 w_rid 必须在 query 里
    assert!(a.find("foo=").unwrap() < a.find("mid=").unwrap());
    assert!(a.contains("wts=1714564800"));
    let rid = a.rsplit("w_rid=").next().unwrap();
    assert_eq!(rid.len(), 32, "w_rid 是 32 位 hex");
  }

  #[test]
  fn encodes_values_and_strips_reserved_chars() {
    assert_eq!(percent_encode("a b"), "a%20b");
    assert_eq!(percent_encode("中文"), "%E4%B8%AD%E6%96%87");
    assert_eq!(percent_encode("a-b_c.d~e"), "a-b_c.d~e");
    assert_eq!(strip_reserved("h!'()*i"), "hi");

    let mixin = mixin_key(IMG_KEY, SUB_KEY);
    let q = sign_query(&[("kw", "hi!'()*中 文")], &mixin, 1);
    // 值里的 !'()* 被剔除、中文与空格被编码，不会以任何形式出现在 query 里
    assert!(q.contains("kw=hi%E4%B8%AD%20%E6%96%87"));
    assert!(!q.contains('!') && !q.contains('\'') && !q.contains('*'));
  }

  #[test]
  fn key_from_url_takes_filename_without_ext() {
    assert_eq!(
      key_from_url("https://i0.hdslb.com/bfs/wbi/7cd084941338484aae1ad9425b84077c.png"),
      "7cd084941338484aae1ad9425b84077c"
    );
    assert_eq!(key_from_url("abc"), "abc");
  }
}
