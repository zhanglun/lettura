import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

/** 界面语言是否中文（与 i18n.ts 的语言源一致：lang localStorage → navigator）。
 *  不直接 import i18n 实例——避免把 i18n 初始化拖进纯工具模块的依赖树 */
function isZhUi(): boolean {
  const lang =
    window.localStorage.getItem("lang") || navigator.language || "en";
  return lang.startsWith("zh");
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
