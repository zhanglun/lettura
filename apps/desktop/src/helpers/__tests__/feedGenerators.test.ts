import { describe, expect, it } from "vitest";
import { matchGenerator } from "../feedGenerators";

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
