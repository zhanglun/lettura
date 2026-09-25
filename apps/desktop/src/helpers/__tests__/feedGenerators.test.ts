import { describe, expect, it } from "vitest";
import {
  BUILTIN_GENERATORS,
  generateFeedUrl,
  matchGenerator,
  parseUserGenerators,
} from "../feedGenerators";

describe("matchGenerator（内置便利表）", () => {
  it("B站主页 → bilibili/user/<uid>", () => {
    const hit = matchGenerator("https://space.bilibili.com/2207410");
    expect(hit?.generator.key).toBe("bilibili");
    expect(hit?.route).toBe("bilibili/user/2207410");
  });

  it("知乎人/专栏、微博、YouTube 各有路由", () => {
    expect(matchGenerator("https://www.zhihu.com/people/abc")?.route).toBe(
      "zhihu/people/activities/abc",
    );
    expect(matchGenerator("https://zhuanlan.zhihu.com/column/c_1")?.route).toBe(
      "zhihu/column/c_1",
    );
    expect(matchGenerator("https://weibo.com/u/1234567890")?.route).toBe("weibo/user/1234567890");
    // /channel/ 与 /user/ 在 RSSHub 上不是同一条路由
    expect(matchGenerator("https://www.youtube.com/channel/UCabc")?.route).toBe(
      "youtube/channel/UCabc",
    );
    expect(matchGenerator("https://www.youtube.com/user/someone")?.route).toBe(
      "youtube/user/someone",
    );
  });

  it("站点自带 feed 的平台标了 nativeFeed（先发现、生成器只作回落）", () => {
    // YouTube 频道页声明了 feeds/videos.xml、Substack 页面声明了 /rss/ → 不该被生成器抢走
    expect(matchGenerator("https://www.youtube.com/channel/UCabc")?.generator.nativeFeed).toBe(true);
    expect(matchGenerator("https://foo.substack.com")?.generator.nativeFeed).toBe(true);
    // 这些平台自己不提供 feed → 走生成器快通道
    expect(matchGenerator("https://space.bilibili.com/2207410")?.generator.nativeFeed).toBeFalsy();
    expect(matchGenerator("https://weibo.com/u/1234567890")?.generator.nativeFeed).toBeFalsy();
    expect(matchGenerator("https://www.zhihu.com/people/abc")?.generator.nativeFeed).toBeFalsy();
  });

  it("Substack 是原生地址（不经 RSSHub），且声明载体 email", () => {
    const hit = matchGenerator("https://example.substack.com/about");
    expect(hit?.generator.target).toBe("native");
    expect(hit?.generator.carrier).toBe("email");
    expect(generateFeedUrl(hit!, "https://my-rsshub.internal")).toBe(
      "https://example.substack.com/feed",
    );
  });

  it("不认识就返回 null（交给发现层或手填路由，不猜）", () => {
    expect(matchGenerator("https://blog.example.com/post")).toBeNull();
  });
});

describe("generateFeedUrl（实例可替换）", () => {
  it("默认拼公共实例，自建实例同样生效（含尾部斜杠归一）", () => {
    const hit = matchGenerator("https://space.bilibili.com/2207410")!;
    expect(generateFeedUrl(hit)).toBe("https://rsshub.app/bilibili/user/2207410");
    expect(generateFeedUrl(hit, "https://rsshub.mine.dev/")).toBe(
      "https://rsshub.mine.dev/bilibili/user/2207410",
    );
  });
});

describe("parseUserGenerators（设置里的自定义路由）", () => {
  it("解析一行一条，支持 => -> →，rsshub 与直接地址两种目标", () => {
    const generators = parseUserGenerators([
      "xiaohongshu.com/user/profile/(\\w+) => xiaohongshu/user/$1 => video",
      "example.com/blog -> https://example.com/blog/feed",
      "",
      "# 注释跳过",
      "坏正则(( => x/y",
    ]);

    expect(generators).toHaveLength(2);
    expect(generators[0].target).toBe("rsshub");
    expect(generators[0].carrier).toBe("video");
    expect(generators[1].target).toBe("native");
    expect(generators[1].carrier).toBe("text");

    const hit = matchGenerator("https://www.xiaohongshu.com/user/profile/5f2b", generators);
    expect(hit?.route).toBe("xiaohongshu/user/5f2b");
    expect(generateFeedUrl(hit!, "https://rsshub.app")).toBe(
      "https://rsshub.app/xiaohongshu/user/5f2b",
    );
  });

  it("用户表可以覆盖内置表（同 key 先命中者胜）", () => {
    const mine = parseUserGenerators(["space.bilibili.com/(\\d+) => bilibili/custom/$1"]);
    const hit = matchGenerator("https://space.bilibili.com/1", [...mine, ...BUILTIN_GENERATORS]);
    expect(hit?.route).toBe("bilibili/custom/1");
  });
});
