import { format, formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { getSavedLang } from "./lang";

/** 界面语言是否中文。不直接 import i18n 实例——避免把 i18n 初始化
 *  拖进纯工具模块的依赖树；语言读取统一走 helpers/lang */
function isZhUi(): boolean {
  return getSavedLang().startsWith("zh");
}

/** 相对时间（跟随界面语言）：date-fns 默认英文，中文模式必须传 zhCN locale */
export function formatRelative(
  date: Date,
  options: { includeSeconds?: boolean } = {},
): string {
  return formatDistanceToNow(date, {
    addSuffix: true,
    includeSeconds: options.includeSeconds,
    locale: isZhUi() ? zhCN : undefined,
  });
}

/** 桶内精确时间（A′ 2026-10-10）：组头已给出粒度，行内不再用相对时间重述——
 *  today→HH:mm、yesterday→昨天 HH:mm、week→周六 HH:mm、lastweek/month→M月d日、
 *  earlier→yyyy/M/d。bucket 为空（源队列帧无分组）或未知时退回相对时间。
 *  键集合与 BUCKET_ORDER 同属「改桶集合要同步的两处清单」（DESIGN 契约） */
export function formatBucketTime(
  date: Date,
  bucket: string | null | undefined,
): string {
  if (Number.isNaN(date.getTime())) return "";
  const zh = isZhUi();
  const locale = zh ? zhCN : undefined;
  switch (bucket) {
    case "today":
      return format(date, "HH:mm");
    case "yesterday":
      return `${zh ? "昨天" : "Yesterday"} ${format(date, "HH:mm")}`;
    case "week":
      return format(date, "EEE HH:mm", { locale });
    case "lastweek":
    case "month":
      return format(date, zh ? "M月d日" : "MMM d", { locale });
    case "earlier":
      return format(date, "yyyy/M/d");
    default:
      return formatRelative(date);
  }
}

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
  return formatRelative(date);
}
