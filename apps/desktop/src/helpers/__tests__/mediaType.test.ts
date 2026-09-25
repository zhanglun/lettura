import { describe, expect, it } from "vitest";
import {
  canPlayInApp,
  getCarrier,
  getFeedCarrier,
  mediaBadge,
  opensExternally,
  originRoute,
  platformName,
} from "../mediaType";

const LABELS = { text: "文", audio: "播", video: "视", email: "邮" };

describe("载体读取（条目级）", () => {
  it("读到什么用什么", () => {
    expect(getCarrier({ carrier: "audio" })).toBe("audio");
    expect(getCarrier({ carrier: "video" })).toBe("video");
    expect(getCarrier({ carrier: "email" })).toBe("email");
    expect(getCarrier({ carrier: "text" })).toBe("text");
  });

  it("缺失/未知 → text（老数据、局部对象都不炸）", () => {
    expect(getCarrier({})).toBe("text");
    expect(getCarrier({ carrier: null })).toBe("text");
    expect(getCarrier({ carrier: "podcast" })).toBe("text");
  });

  it("消费方式由载体推导：音频站内播、视频外跳", () => {
    expect(canPlayInApp("audio")).toBe(true);
    expect(opensExternally("audio")).toBe(false);
    expect(opensExternally("video")).toBe(true);
    expect(canPlayInApp("video")).toBe(false);
    expect(canPlayInApp("text")).toBe(false);
    expect(opensExternally("email")).toBe(false);
  });
});

describe("来源读取（源级）", () => {
  it("originRoute：generator:<route> → route；native → null", () => {
    expect(originRoute("generator:bilibili")).toBe("bilibili");
    expect(originRoute("generator:xiaohongshu")).toBe("xiaohongshu");
    expect(originRoute("generator")).toBe("");
    expect(originRoute("native")).toBeNull();
    expect(originRoute(null)).toBeNull();
  });

  it("源级载体：存的优先，其次按路由推", () => {
    expect(getFeedCarrier({ carrier: "audio", origin: "native" })).toBe("audio");
    expect(getFeedCarrier({ origin: "generator:bilibili" })).toBe("video");
    expect(getFeedCarrier({ origin: "generator:youtube" })).toBe("video");
    expect(getFeedCarrier({ origin: "generator:newsletter" })).toBe("email");
    expect(getFeedCarrier({ origin: "generator:zhihu" })).toBe("text");
    expect(getFeedCarrier({ origin: "native" })).toBe("text");
  });
});

describe("徽章：载体定字形，品牌字优先（不再是逐个平台的特例）", () => {
  it("音频/文本/邮件按载体字", () => {
    expect(mediaBadge("audio", "native", LABELS)).toEqual({ char: "播", cls: "b-pod" });
    expect(mediaBadge("text", "native", LABELS)).toEqual({ char: "文", cls: "b-art" });
    expect(mediaBadge("email", "generator:newsletter", LABELS)).toEqual({
      char: "邮",
      cls: "b-pod",
    });
  });

  it("视频：已知路由出品牌字（B/抖），未知路由回落载体字", () => {
    expect(mediaBadge("video", "generator:bilibili", LABELS)).toEqual({ char: "B", cls: "b-bil" });
    expect(mediaBadge("video", "generator:douyin", LABELS)).toEqual({ char: "抖", cls: "b-dou" });
    expect(mediaBadge("video", "generator:xiaohongshu", LABELS)).toEqual({
      char: "视",
      cls: "b-bil",
    });
  });

  it("品牌字只在视频载体上生效（文本载体的 B站源不会借用品牌字）", () => {
    expect(mediaBadge("text", "generator:bilibili", LABELS)).toEqual({ char: "文", cls: "b-art" });
  });
});

describe("平台名（详情页）", () => {
  const names = { bilibili: "Bilibili", douyin: "抖音", youtube: "YouTube", generic: "视频" };

  it("已知路由 → 品牌名；其余 → 通用名", () => {
    expect(platformName("generator:bilibili", names)).toBe("Bilibili");
    expect(platformName("generator:douyin", names)).toBe("抖音");
    expect(platformName("generator:youtube", names)).toBe("YouTube");
    expect(platformName("generator:xiaohongshu", names)).toBe("视频");
    expect(platformName("native", names)).toBe("视频");
  });
});
