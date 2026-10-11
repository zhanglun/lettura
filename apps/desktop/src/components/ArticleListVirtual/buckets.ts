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

/** A′ 默认展开（2026-10-10，取代 09-30「只展开第一个非空组」）：
 *  按时间序展开非空桶，估高到列表视口 fillRatio（约 55%）为止——
 *  稀疏日自动续借下一桶，首屏是内容而不是收起细行。
 *  估高 = 分组头 30px + 行步距 42px（--row-h 40 + 2px 呼吸缝，A′ 去缩略图后）×
 *  min(真实计数, 100)（initial-sections 首屏播种上限，超出部分懒加载
 *  不在默认展开里发生）。只依赖桶计数与视口高，纯函数可测 */
export function defaultExpandedBuckets(
  counts: Record<string, number>,
  viewportHeight: number,
  fillRatio = 0.55,
): Set<string> {
  const ROW_STEP = 42;
  const HEAD_H = 30;
  const SEED_CAP = 100;
  let estimated = 0;
  const expanded = new Set<string>();
  for (const bucket of BUCKET_ORDER) {
    const count = counts[bucket] ?? 0;
    if (count <= 0) continue;
    if (estimated >= viewportHeight * fillRatio) break;
    expanded.add(bucket);
    estimated += HEAD_H + Math.min(count, SEED_CAP) * ROW_STEP;
  }
  return expanded;
}
