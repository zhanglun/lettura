interface ProcessOptions {
  baseUrl?: string;
}

/**
 * 列表行缩略图取图（客户端，零 schema）：feed 的 description 里第一张图 >
 * media_object 里的图片附件 > 无（退 feed 图标/预设色块）。图片不入库，
 * og:image 实时代理只用于详情，列表不走网络。
 */
export function pickThumbUrl(a: {
  description?: string | null;
  media_object?: string | null;
}): string {
  const img = a.description?.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (img?.[1]) return img[1];

  try {
    const medias = JSON.parse(a.media_object || "[]");
    if (Array.isArray(medias)) {
      for (const m of medias) {
        const url = (m?.content ?? []).find(
          (c: any) =>
            typeof c?.url === "string" &&
            c.url &&
            typeof c?.content_type === "string" &&
            c.content_type.indexOf("image") === 0,
        )?.url;
        if (url) return url as string;
      }
    }
  } catch {
    // media_object 非法 JSON 时静默退级
  }
  return "";
}

/**
 * Pick the richer content between `content` and `description`.
 * Falls back to the optional `fallback` string when both are empty.
 */
export function pickArticleContent(
  content: string | undefined | null,
  description: string | undefined | null,
  fallback?: string | null,
): string {
  if (content && description) {
    return content.length > description.length ? content : description;
  }
  if (content || description) {
    return content || description || "";
  }
  return fallback?.trim() || "";
}

/**
 * Pre-process raw article HTML before sanitisation:
 * 1. Ensures every `<a>` has `target="_blank"`.
 * 2. When `options.baseUrl` is provided, converts relative image `src`
 *    attributes to absolute URLs.
 * 3. Lifts the code block language (`<code class="language-xxx">`) into a
 *    `<span class="code-lang">` at the top-right of its `<pre>`
 *    (detail.html 契约：代码块右上语言标).
 *
 * Does NOT run DOMPurify — the caller (or ContentRender) is responsible
 * for the final sanitisation step.
 */
export function processArticleHtml(
  html: string,
  options?: ProcessOptions,
): string {
  let result = html;

  result = result.replace(/<a[^>]+>/gi, (a: string) => {
    if (!/\starget\s*=/gi.test(a)) {
      return a.replace(/^<a\s/, '<a target="_blank"');
    }
    return a;
  });

  if (options?.baseUrl) {
    result = result.replace(
      /<img\s+(?:[^>]*?\s+)?src="([^"]*)"[^>]*>/g,
      (match, src) => {
        try {
          const absoluteUrl = new URL(src, options.baseUrl!).href;
          return `<img src="${absoluteUrl}" />`;
        } catch {
          return match;
        }
      },
    );
  }

  result = result.replace(
    /<pre([^>]*)>\s*(<code[^>]*class="[^"]*\b(?:language|lang)-([a-z0-9+#.-]+)[^"]*"[^>]*>)/gi,
    (_match, preAttrs: string, codeOpen: string, lang: string) =>
      `<pre${preAttrs}><span class="code-lang">${lang.toUpperCase()}</span>${codeOpen}`,
  );

  return result;
}
