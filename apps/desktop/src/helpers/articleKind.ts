/**
 * fusion 壳的文章类型分类（客户端，零 schema）：
 * YouTube / B站 / 抖音 URL → platform；media_object 含 enclosure → podcast；否则 article。
 * Ground truth: apps/desktop/.impeccable/mocks/decision/fusion.html
 */

export type ArticleKind = "article" | "podcast" | "platform";

const PLATFORM_RE = /(bilibili\.com|b23\.tv|\/bilibili\/|douyin\.com|\/douyin\/|youtube\.com|youtu\.be)/i;
const BILIBILI_RE = /(bilibili\.com|b23\.tv|\/bilibili\/)/i;
const DOUYIN_RE = /(douyin\.com|\/douyin\/)/i;

function articleUrl(a: { link?: string; feed_url?: string }): string {
  return `${a.link || ""} ${a.feed_url || ""}`;
}

function hasAudioEnclosure(mediaObject?: string): boolean {
  try {
    const medias = JSON.parse(mediaObject || "[]");
    if (!Array.isArray(medias)) return false;
    // ponytail: 只认 content[].url 存在即为播客，不做 content_type 细分，误判时再收紧
    return medias.some((m: any) =>
      Array.isArray(m?.content) && m.content.some((c: any) => typeof c?.url === "string" && c.url),
    );
  } catch {
    return false;
  }
}

export function getArticleKind(
  a: { link?: string; feed_url?: string; media_object?: string },
): ArticleKind {
  if (PLATFORM_RE.test(articleUrl(a))) return "platform";
  if (hasAudioEnclosure(a.media_object)) return "podcast";
  return "article";
}

export type PlatformBadge = { char: string; cls: string };

/** 平台细分徽章（B站=B / 抖音=抖 / 其余平台=视） */
export function getPlatformBadge(
  a: { link?: string; feed_url?: string },
  labels: { platform: string; douyin: string },
): PlatformBadge {
  if (DOUYIN_RE.test(articleUrl(a))) return { char: labels.douyin, cls: "b-dou" };
  if (BILIBILI_RE.test(articleUrl(a))) return { char: "B", cls: "b-bil" };
  return { char: labels.platform, cls: "b-bil" };
}

/** 平台全名（详情页用） */
export function getPlatformName(
  a: { link?: string; feed_url?: string },
  names: { bilibili: string; douyin: string; youtube: string; generic: string },
): string {
  if (DOUYIN_RE.test(articleUrl(a))) return names.douyin;
  if (BILIBILI_RE.test(articleUrl(a))) return names.bilibili;
  if (/youtube\.com|youtu\.be/i.test(articleUrl(a))) return names.youtube;
  return names.generic;
}
