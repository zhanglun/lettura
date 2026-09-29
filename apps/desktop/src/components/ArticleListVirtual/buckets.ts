import dayjs from "dayjs";

/**
 * 时间流日期桶（list-prism 契约，2026-09-29 定稿）：滚动窗口，与后端
 * `ArticleFilter.day_bucket`（article.rs 条件构建器）严格同口径——
 * 排序时刻 = 发布时间优先缺省退创建时间；week=前天~6天前、lastweek=7~13、
 * month=14~29、earlier=更早。分隔条全量渲染六桶（真实计数来自
 * get_article_summary），不再"加载到哪显示到哪"。
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

export function bucketOf(
  a: { pub_date?: string | null; create_date?: string | null },
  now = dayjs(),
): DayBucket {
  const raw = a.pub_date || a.create_date;
  const m = raw ? dayjs(raw) : null;
  if (!m || !m.isValid()) return "earlier";
  if (m.isSame(now, "day")) return "today";
  if (m.isSame(now.subtract(1, "day"), "day")) return "yesterday";
  if (m.isAfter(now.subtract(6, "day"), "day")) return "week";
  if (m.isAfter(now.subtract(13, "day"), "day")) return "lastweek";
  if (m.isAfter(now.subtract(29, "day"), "day")) return "month";
  return "earlier";
}
