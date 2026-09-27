use crate::core::config;

pub mod article;
pub mod channel;
pub mod collection;
pub mod folder;
pub mod opml;
pub mod tag;

// 抓取/解析/发现层已迁移到 packages/fetcher-rss（registry 见 crate::fetchers）。
// 这里只保留客户端构造：代理/UA/超时策略是 app 级配置，由这里统一决定后
// 经 DetectInput/FetchContext 递给各 fetcher——fetcher 内不自建 client。

/// 探测/抓取的客户端：**必须带超时**——reqwest 默认没有总超时，
/// 一个不回包的站点会让"正在检测"无限转圈（同步路径同样受益：不再有卡死的 worker）。
/// 也补上 UA：不少站点对无 UA 的请求直接挂起或 403。
pub fn create_client(url: &str) -> reqwest::Client {
  let proxy = find_proxy(url);
  let client_builder = reqwest::Client::builder()
    .timeout(std::time::Duration::from_secs(12))
    .connect_timeout(std::time::Duration::from_secs(5))
    .user_agent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 \
       (KHTML, like Gecko) Lettura/0.2.0 Safari/537.36",
    );

  if let Some(proxy) = proxy {
    let scheme = format!("socks5h://{}:{}", proxy.server, proxy.port);

    return client_builder
      .proxy(reqwest::Proxy::all(scheme).unwrap())
      .build()
      .unwrap();
  }

  client_builder.build().unwrap()
}

pub fn find_proxy(url: &str) -> Option<config::Proxy> {
  let user_config = config::get_user_config();
  let proxies = user_config.proxy;
  let rules = user_config.proxy_rules;

  let mut server_port = "";

  for elem in rules.iter() {
    let parts: Vec<_> = elem.split(",").collect();

    if parts.len() >= 2 && parts[1] == url {
      server_port = parts[0];
    }
  }

  match proxies {
    Some(proxies) => {
      for proxy in proxies.into_iter() {
        let key = format!("{}:{}", proxy.server, proxy.port);

        if key == server_port && proxy.enable {
          return Some(proxy);
        }
      }
      None
    }
    None => None,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_create_client_builds() {
    // 无代理规则时也能构造成功（带 UA 与超时）
    let client = create_client("https://example.com/feed");
    let _ = client.get("https://example.com");
  }
}
