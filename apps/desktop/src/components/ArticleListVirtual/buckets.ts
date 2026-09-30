/**
 * 时间流日期桶（list-prism 契约，2026-09-29 定稿）：滚动窗口，与后端
 * `ArticleFilter.day_bucket`（article.rs 条件构建器）严格同口径——
 * week=前天~6天前、lastweek=7~13、month=14~29、earlier=更早。
 * 分隔条全量渲染六桶（真实计数来自 get_article_summary）。
 */
export const BUCKET_ORDER = [
  "today",
  "yesterday",
  "week",
  "lastweek",
  "month",
  "earlier",
] as const;

export type DayBucket = (typeof BUCKET_ORDER)[number];
