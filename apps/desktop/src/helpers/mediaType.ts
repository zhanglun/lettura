/**
 * 媒体两轴读取（C 步：**载体 × 来源**取代「文章/播客/平台」三桶）
 *
 *  - 载体 `carrier`（条目级）：`text | audio | video | email` —— 决定怎么消费：
 *      audio → 站内播放（`canPlayInApp`）；video → 外跳（`opensExternally`）；text/email → 读。
 *  - 来源 `origin`（源级）：`native | generator:<route>` —— 决定内容从哪来（外跳与否由两轴推导）。
 *
 * 判定实现只有一处：`src-tauri/src/cmd.rs`（`classify_entry` / `feed_carrier_hint` / `resolve_origin`），
 * 由迁移 `2026-09-25-010000_carrier_origin` 重标签历史数据。
 * 这里只做「存下来的两轴 → 徽章字符 / 平台名」的映射：**没有 URL 正则，也没有逐个平台的特例**
 * （品牌字是"路由键 → 字"的一张表，未知路由回落载体字）。
 */

export type Carrier = "text" | "audio" | "video" | "email";
export type MediaBadge = { char: string; cls: string };

/** 条目载体（读到什么用什么，缺省 text） */
export function getCarrier(a: { carrier?: string | null }): Carrier {
  const carrier = a.carrier;
  if (carrier === "audio" || carrier === "video" || carrier === "email") {
    return carrier;
  }
  return "text";
}

/**
 * 源级载体（源列表图标用）：后端在订阅/同步时写过 `feeds.carrier`；
 * 没有时按来源路由推（老数据/局部对象兜底）。
 */
export function getFeedCarrier(feed: {
  carrier?: string | null;
  origin?: string | null;
}): Carrier {
  const stored = feed.carrier;
  if (stored === "audio" || stored === "video" || stored === "email" || stored === "text") {
    return stored;
  }
  const route = originRoute(feed.origin);
  if (route === "bilibili" || route === "douyin" || route === "youtube") return "video";
  if (route === "newsletter" || route === "buttondown" || route === "substack") return "email";
  return "text";
}

/** 来源 → 生成器路由键（`generator:bilibili` → `"bilibili"`；裸 `generator` → `""`；native → null） */
export function originRoute(origin?: string | null): string | null {
  if (!origin?.startsWith("generator")) return null;
  const [, route = ""] = origin.split(":");
  return route;
}

/** 能不能站内播（载体是音频） */
export const canPlayInApp = (carrier: Carrier): boolean => carrier === "audio";

/** 要不要外跳（载体是视频：0.2.0 不做站内视频） */
export const opensExternally = (carrier: Carrier): boolean => carrier === "video";

/** 已知生成器路由的品牌字（读者认字，所以保留；未知路由回落载体字） */
const BRAND_BADGE: Record<string, { char: string; cls: string }> = {
  bilibili: { char: "B", cls: "b-bil" },
  douyin: { char: "抖", cls: "b-dou" },
};

export const CARRIER_BADGE_CLS: Record<Carrier, string> = {
  text: "b-art",
  audio: "b-pod",
  video: "b-bil",
  email: "b-pod",
};

/**
 * 徽章 = 载体定字形（文/播/视/邮）＋ 品牌字优先；颜色：视频/品牌粉、音频靛、文章灰
 * （视觉与旧「文/播/B/抖/视」一致，但模型变成两轴 + 一张品牌表）
 */
export function mediaBadge(
  carrier: Carrier,
  origin: string | null | undefined,
  labels: { text: string; audio: string; video: string; email: string },
): MediaBadge {
  const route = originRoute(origin);
  if (carrier === "video" && route && BRAND_BADGE[route]) {
    return BRAND_BADGE[route];
  }
  return { char: labels[carrier], cls: CARRIER_BADGE_CLS[carrier] };
}

/** 平台全名（详情页用）：已知路由 → 品牌名，其余回落通用名 */
export function platformName(
  origin: string | null | undefined,
  names: { bilibili: string; douyin: string; youtube: string; generic: string },
): string {
  const route = originRoute(origin);
  if (route === "bilibili") return names.bilibili;
  if (route === "douyin") return names.douyin;
  if (route === "youtube") return names.youtube;
  return names.generic;
}
