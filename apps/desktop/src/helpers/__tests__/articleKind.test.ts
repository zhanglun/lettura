import { describe, expect, it } from "vitest";
import { getArticleKind, getPlatformBadge } from "../articleKind";

describe("getArticleKind", () => {
  it("classifies bilibili / douyin / youtube URLs as platform", () => {
    expect(getArticleKind({ link: "https://www.bilibili.com/video/BV1xx" })).toBe("platform");
    expect(getArticleKind({ link: "https://b23.tv/abc", feed_url: "" })).toBe("platform");
    expect(getArticleKind({ feed_url: "https://rsshub.app/douyin/user/123" })).toBe("platform");
    expect(getArticleKind({ link: "https://www.youtube.com/watch?v=x" })).toBe("platform");
  });

  it("classifies media_object with enclosure as podcast", () => {
    const media = JSON.stringify([
      { content: [{ url: "https://cdn.example.com/ep1.mp3", content_type: "audio/mpeg" }] },
    ]);
    expect(getArticleKind({ media_object: media })).toBe("podcast");
  });

  it("does not misclassify non-audio media:content as podcast", () => {
    const thumb = JSON.stringify([
      { content: [{ url: "https://cdn.example.com/thumb.jpg", content_type: "image/jpeg" }] },
    ]);
    expect(getArticleKind({ media_object: thumb })).toBe("article");
    const noType = JSON.stringify([{ content: [{ url: "https://x.com/v" }] }]);
    expect(getArticleKind({ media_object: noType })).toBe("article");
  });

  it("classifies everything else as article", () => {
    expect(getArticleKind({ link: "https://blog.example.com/post" })).toBe("article");
    expect(getArticleKind({ media_object: "" })).toBe("article");
    expect(getArticleKind({ media_object: "not-json" })).toBe("article");
    expect(getArticleKind({ media_object: JSON.stringify([{ content: [] }]) })).toBe("article");
  });
});

describe("getPlatformBadge", () => {
  const labels = { platform: "视", douyin: "抖" };

  it("picks douyin / bilibili specific badges", () => {
    expect(getPlatformBadge({ link: "https://www.douyin.com/video/1" }, labels)).toEqual({
      char: "抖",
      cls: "b-dou",
    });
    expect(getPlatformBadge({ link: "https://www.bilibili.com/x" }, labels)).toEqual({
      char: "B",
      cls: "b-bil",
    });
  });

  it("falls back to generic platform badge", () => {
    expect(getPlatformBadge({ link: "https://www.youtube.com/watch?v=x" }, labels)).toEqual({
      char: "视",
      cls: "b-bil",
    });
  });
});
