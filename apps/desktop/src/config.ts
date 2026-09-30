export enum RouteConfig {
  LOCAL_ALL = "/local/all",
  LOCAL_STARRED = "/local/starred",
  LOCAL_TODAY = "/local/today",
  LOCAL_FEEDS = "/local/feeds",
  LOCAL_FEED = "/local/feeds/:uuid",
  LOCAL_ARTICLE = "/local/feeds/:uuid/articles/:id",

  SETTINGS = "/settings",
}

/**
 * 邮件订阅（Newsletter 走 IMAP）的能力开关。
 *
 * 后端能力完整保留（fetcher-mail、source_accounts、按 provider 同步），
 * 但入口暂时隐藏（2026-09-28）：IMAP host/授权码的配置门槛 + 用户不知道
 * 发件人地址，首次体验站不住。等「服务商预设 + 收件箱发件人扫描」落地后
 * 翻回 true 放出。
 */
export const EMAIL_SUBSCRIPTION_ENABLED = false;
