/**
 * Feed 地址生成器（**数据表，不是写死的清单**）
 *
 * 用户的输入不可控：自建、镜像、转发地址、我们没想到的形态都会出现。
 * 这里的职责是把「站点主页地址」翻译成它**自己提供**的 feed 地址
 * （如 Newsletter 的 `/feed`），不依赖任何第三方转换服务：
 *   - 内置表：常见形态的正则 → feed 地址（命中即自动预填，用户可改）
 *
 * 没有原生 feed 的平台（B站/微博/知乎…）不在此表——它们交给 0.2.0 之外的
 * 转换生态，或未来以插件形式回归。
 */

export interface FeedGenerator {
  /** 落库用的来源键（feeds.origin = generator:<key>） */
  key: string;
  /** 界面文案 */
  label: string;
  /** 匹配用户粘贴的地址；捕获组可用 $1..$n 注入 feed 地址 */
  pattern: RegExp;
  /** 生成的 feed 地址（可含 $1..$n） */
  route: string;
  /** 这条路由产出的载体（决定站内播/外跳/阅读）：text | audio | video | email */
  carrier: "text" | "audio" | "video" | "email";
  /**
   * 站点**自己有 feed**（页面里就声明了 alternate）：这种地址先走发现层——一次请求；
   * 生成器只作回落。内置表里全部是这种（Newsletter 的 `/feed` 是站点自带的）。
   */
  nativeFeed?: boolean;
}

/** 内置便利表（命中即预填，不命中就走发现层或手填地址） */
export const BUILTIN_GENERATORS: FeedGenerator[] = [
  {
    key: "newsletter",
    label: "Newsletter",
    pattern: /([\w-]+)\.substack\.com/i,
    route: "https://$1.substack.com/feed",
    carrier: "email",
    nativeFeed: true,
  },
];

/** 把模板里的 $1..$n 换成捕获组（不匹配返回 null） */
function expand(
  pattern: RegExp,
  template: string,
  input: string,
): string | null {
  const matched = input.match(pattern);
  if (!matched) return null;
  return template.replace(
    /\$(\d)/g,
    (_, index) => matched[Number(index)] ?? "",
  );
}

export interface GeneratorHit {
  generator: FeedGenerator;
  /** 生成的 feed 地址 */
  route: string;
}

/** 命中哪条内置生成器（不命中返回 null，交给发现层） */
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

