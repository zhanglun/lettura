//! 真网络联调测试：默认 #[ignore] 跳过，需要时手动
//! `cargo test -p fetcher-bilibili -- --ignored`。
//! 依赖 B 站接口可达与风控放行；无 SESSDATA 也应能读到公开数据。

use std::time::Duration;

use fetcher_bilibili::BilibiliFetcher;
use fetcher_core::{Carrier, DetectInput, FeedView, FetchContext, Fetcher};

/// 影视飓风的公开主页
const MID: u64 = 546195;

fn client() -> reqwest::Client {
  reqwest::Client::builder()
    .timeout(Duration::from_secs(20))
    .build()
    .expect("build client")
}

fn space_view() -> FeedView {
  FeedView {
    uuid: "test-uuid".into(),
    feed_url: format!("https://space.bilibili.com/{}", MID),
    provider: "bilibili".into(),
    origin: String::new(),
    carrier: Carrier::Video,
    source_config: serde_json::json!({ "mid": MID }),
  }
}

#[tokio::test]
#[ignore = "真网络：依赖 B 站接口可达与风控状态"]
async fn detect_real_space() {
  let input = DetectInput {
    raw: format!("https://space.bilibili.com/{}", MID),
    provider_hint: None,
    carrier_hint: None,
    account: None,
    http: client(),
  };
  let out = BilibiliFetcher.detect(&input).await.expect("detect 应成功");
  assert_eq!(out.provider, "bilibili");
  assert!(!out.feed.title.is_empty(), "应拿到 UP 昵称");
  assert_eq!(out.feed.carrier, Carrier::Video);
  assert_eq!(
    out.resolved_url,
    format!("https://space.bilibili.com/{}", MID)
  );
  assert_eq!(out.source_config["mid"], MID);
}

#[tokio::test]
#[ignore = "真网络：依赖 B 站接口可达与风控状态"]
async fn fetch_real_dynamics() {
  let ctx = FetchContext {
    feed: space_view(),
    account: None,
    http: client(),
  };
  let items = BilibiliFetcher.fetch(&ctx).await.expect("fetch 应成功");
  assert!(!items.is_empty(), "正常 UP 主应有动态");
  assert!(items.iter().all(|a| a.link.starts_with("https://")));
}
