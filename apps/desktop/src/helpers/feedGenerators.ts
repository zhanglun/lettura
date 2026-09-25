/**
 * 平台源生成器（**数据表，不是写死的清单**）
 *
 * 用户的输入不可控：自建 RSSHub、镜像、转发地址、我们没想到的平台都会出现。
 * 所以这里只提供"便利匹配"：
 *   - 内置表：常见平台的正则 → 路由（命中就自动预填，用户可改）
 *   - 配置表：用户在设置里按 `匹配 => 路由` 自行扩展（`helpers/feedGenerators` 合并两张表）
 *   - 手动路由：面板里可以直接改/填路由，不依赖任何表
 *
 * 落库为 `generator:<route key>`（feeds.origin）＋ 本条声明的载体（feeds.carrier / articles.carrier），
 * 未知平台在 UI 上回落通用徽章——不靠 URL 猜。
 */

export interface FeedGenerator {
  /** 落库用的路由键（feeds.origin = generator:<key>） */
  key: string;
  /** 界面文案 */
  label: string;
  /** 匹配用户粘贴的地址；捕获组可用 $1..$n 注入路由 */
  pattern: RegExp;
  /**
   * `rsshub` → `${instance}/${route}`；`native` → route 本身就是 feed 地址（可含 $1..$n）
   */
  target: "rsshub" | "native";
  route: string;
  /** 这条路由产出的载体（决定站内播/外跳/阅读）：text | audio | video | email */
  carrier: "text" | "audio" | "video" | "email";
  /**
   * 站点**自己有 feed**（页面里就声明了 alternate）：这种地址先走发现层——一次请求、
   * 不依赖第三方实例；生成器只作回落。没这个标记的（B站空间/知乎/微博…）才会走
   * 生成器快通道，因为那些平台确实不提供 feed。
   */
  nativeFeed?: boolean;
}

export const DEFAULT_RSSHUB_INSTANCE = "https://rsshub.app";

/** 内置便利表（命中即预填，不命中就走发现层或手填路由） */
export const BUILTIN_GENERATORS: FeedGenerator[] = [
  {
    key: "bilibili",
    label: "B站",
    pattern: /space\.bilibili\.com\/(\d+)/i,
    target: "rsshub",
    route: "bilibili/user/$1",
    carrier: "video",
  },
  {
    key: "zhihu",
    label: "知乎",
    pattern: /zhihu\.com\/people\/([\w-]+)/i,
    target: "rsshub",
    route: "zhihu/people/activities/$1",
    carrier: "text",
  },
  {
    key: "zhihu",
    label: "知乎",
    pattern: /zhihu\.com\/column\/([\w-]+)/i,
    target: "rsshub",
    route: "zhihu/column/$1",
    carrier: "text",
  },
  {
    key: "weibo",
    label: "微博",
    pattern: /weibo\.com\/(?:u\/)?(\d+)/i,
    target: "rsshub",
    route: "weibo/user/$1",
    carrier: "text",
  },
  // YouTube 频道页自己声明了 feed（youtube.com/feeds/videos.xml?channel_id=…），
  // 所以先让发现层去拿它；`/channel/` 与 `/user/`|`/c/` 在 RSSHub 上是不同路由。
  {
    key: "youtube",
    label: "YouTube",
    pattern: /youtube\.com\/channel\/(UC[\w-]+)/i,
    target: "rsshub",
    route: "youtube/channel/$1",
    carrier: "video",
    nativeFeed: true,
  },
  {
    key: "youtube",
    label: "YouTube",
    pattern: /youtube\.com\/(?:c|user)\/([\w-]+)/i,
    target: "rsshub",
    route: "youtube/user/$1",
    carrier: "video",
    nativeFeed: true,
  },
  {
    key: "newsletter",
    label: "Newsletter",
    pattern: /([\w-]+)\.substack\.com/i,
    target: "native",
    route: "https://$1.substack.com/feed",
    carrier: "email",
    nativeFeed: true,
  },
  {
    key: "newsletter",
    label: "Newsletter",
    pattern: /buttondown\.email\/([\w-]+)/i,
    target: "rsshub",
    route: "buttondown/$1",
    carrier: "email",
  },
];

/** 把模板里的 $1..$n 换成捕获组（不匹配返回 null） */
function expand(pattern: RegExp, template: string, input: string): string | null {
  const matched = input.match(pattern);
  if (!matched) return null;
  return template.replace(/\$(\d)/g, (_, index) => matched[Number(index)] ?? "");
}

export interface GeneratorHit {
  generator: FeedGenerator;
  /** 路由（未拼实例） */
  route: string;
}

/** 命中哪条生成器（内置表在前，用户表可覆盖同名 key） */
export function matchGenerator(
  input: string,
  generators: FeedGenerator[] = BUILTIN_GENERATORS,
): GeneratorHit | null {
  for (const generator of generators) {
    const route = expand(generator.pattern, generator.route, input);
    if (route) return { generator, route };
  }
  return null;
}

/** 路由 + 实例 → 真正可抓的 feed 地址 */
export function generateFeedUrl(
  hit: GeneratorHit,
  instance: string = DEFAULT_RSSHUB_INSTANCE,
): string {
  if (hit.generator.target === "native") return hit.route;
  const base = (instance || DEFAULT_RSSHUB_INSTANCE).replace(/\/+$/, "");
  return `${base}/${hit.route.replace(/^\/+/, "")}`;
}

/**
 * 解析设置里的自定义生成路由：一行一条
 *   `xiaohongshu.com/user/profile/(\w+) => xiaohongshu/user/$1`
 *   `example.com/blog => https://example.com/blog/feed`   （以 http 开头 = 直接可抓的地址）
 * 分隔符接受 `=>` `->` `→`；左侧按正则用（纯域名也是合法正则），右侧是路由/地址。
 */
export function parseUserGenerators(lines: string[] | undefined): FeedGenerator[] {
  const result: FeedGenerator[] = [];

  for (const raw of lines || []) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    // `匹配 => 路由` 或 `匹配 => 路由 => 载体`（载体可选：video/audio/email，缺省 text）
    const parts = line.split(/=>|->|→/);
    if (parts.length < 2) continue;

    const source = parts[0].trim();
    const route = parts[1].trim();
    const declared = (parts[2] || "").trim().toLowerCase();
    if (!(source && route)) continue;

    let pattern: RegExp;
    try {
      pattern = new RegExp(source, "i");
    } catch {
      continue; // 用户写坏的正则跳过，不影响其他行
    }

    result.push({
      key: route.split("/")[0] || "custom",
      label: source,
      pattern,
      target: route.startsWith("http") ? "native" : "rsshub",
      route,
      carrier:
        declared === "video" || declared === "audio" || declared === "email"
          ? declared
          : "text",
    });
  }

  return result;
}
