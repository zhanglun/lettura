import { describe, expect, it } from "vitest";
import {
  BUILTIN_GENERATORS,
  matchGenerator,
  parseUserGenerators,
} from "../feedGenerators";

describe("matchGenerator（内置便利表）", () => {
  it("Substack 是原生地址，且声明载体 email", () => {
    const hit = matchGenerator("https://example.substack.com/about");
    expect(hit?.generator.key).toBe("newsletter");
    expect(hit?.generator.carrier).toBe("email");
    expect(hit?.route).toBe("https://example.substack.com/feed");
    expect(hit?.generator.nativeFeed).toBe(true);
  });

  it("不认识就返回 null（交给发现层，不猜）", () => {
    expect(matchGenerator("https://blog.example.com/post")).toBeNull();
  });
});

describe("parseUserGenerators（设置里的自定义规则）", () => {
  it("解析一行一条，支持 => -> →，右侧是完整的 feed 地址", () => {
    const generators = parseUserGenerators([
      "example.com/blog -> https://example.com/blog/feed => text",
      "",
      "# 注释跳过",
      "坏正则(( => https://x.example.com/feed",
    ]);

    expect(generators).toHaveLength(1);
    expect(generators[0].route).toBe("https://example.com/blog/feed");
    expect(generators[0].carrier).toBe("text");

    const hit = matchGenerator("https://example.com/blog/post-1", generators);
    expect(hit?.route).toBe("https://example.com/blog/feed");
  });

  it("用户表可以覆盖内置表（同 key 先命中者胜）", () => {
    const mine = parseUserGenerators(["substack.com => https://mirror.example.com/substack/feed"]);
    const hit = matchGenerator("https://foo.substack.com", [...mine, ...BUILTIN_GENERATORS]);
    expect(hit?.route).toBe("https://mirror.example.com/substack/feed");
  });
});
