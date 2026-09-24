import { formatDistanceToNow } from "date-fns";

/** 源行/源头栏的域名标签：hostname + 非根路径 */
export function getHostLabel(feed: {
  link?: string;
  feed_url?: string;
}): string {
  const url = feed.link || feed.feed_url || "";
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname === "/" ? "" : parsed.pathname}`;
  } catch {
    return url;
  }
}

/** 源的最近同步时间：今天显示 HH:mm，更早显示相对时间 */
export function formatFeedTime(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    const pad = (v: number) => v.toString().padStart(2, "0");
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  return formatDistanceToNow(date, { addSuffix: true });
}
