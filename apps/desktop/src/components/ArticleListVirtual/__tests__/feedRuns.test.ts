import { describe, it, expect, beforeEach } from "vitest";
import {
  buildSegments,
  flattenDisplay,
  getRunExpansionVersion,
  groupRuns,
  isRunExpanded,
  runUnreadCount,
  setRunExpanded,
  subscribeRunExpansion,
  RUN_COLLAPSE_MIN,
  RUN_HEAD_MIN,
  RUN_PREVIEW_COUNT,
} from "../feedRuns";
import type { ArticleResItem } from "@/db";
import { ArticleReadStatus } from "@/typing";

const article = (uuid: string, feedUuid: string, unread = true): ArticleResItem =>
  ({
    uuid,
    feed_uuid: feedUuid,
    read_status: unread ? ArticleReadStatus.UNREAD : ArticleReadStatus.READ,
  }) as ArticleResItem;

describe("groupRuns（按源分组契约）", () => {
  it("同一 feed 只出现一段：被其他源隔断的同源文章并入同一组（组内保持时间倒序）", () => {
    const runs = groupRuns([
      article("a", "f1"),
      article("b", "f1"),
      article("c", "f2"),
      article("d", "f1"),
    ]);
    expect(runs.map((r) => r.feedUuid)).toEqual(["f1", "f2"]);
    expect(runs[0].articles.map((a) => a.uuid)).toEqual(["a", "b", "d"]);
  });

  it("组间按首次出现位置排序 = 最新动态在前", () => {
    const runs = groupRuns([
      article("a", "f1"),
      article("b", "f2"),
      article("c", "f3"),
      article("d", "f2"),
    ]);
    expect(runs.map((r) => r.feedUuid)).toEqual(["f1", "f2", "f3"]);
  });

  it("缺 feed_uuid 的文章并成一个无头组（不丢行）", () => {
    const runs = groupRuns([article("a", ""), article("b", "")]);
    expect(runs).toHaveLength(1);
    expect(runs[0].feedUuid).toBe("");
    expect(runs[0].articles).toHaveLength(2);
  });
});

describe("buildSegments / flattenDisplay", () => {
  it("段长 ≥ RUN_HEAD_MIN 才立头；feedUuid 缺失不立头", () => {
    const segs = buildSegments([
      ...Array.from({ length: RUN_HEAD_MIN }, (_, i) => article(`a${i}`, "f1")),
      article("x", ""),
    ]);
    expect(segs[0].head).toBe(true);
    expect(segs[1].head).toBe(false);
  });

  it(`段长 ≥ ${RUN_COLLAPSE_MIN} 默认折叠为 ${RUN_PREVIEW_COUNT} 篇预览`, () => {
    const big = Array.from({ length: RUN_COLLAPSE_MIN }, (_, i) =>
      article(`a${i}`, "f1"),
    );
    const segs = buildSegments([article("solo", "f2"), ...big]);
    expect(segs[0].collapsed).toBe(false);
    expect(segs[1].collapsible).toBe(true);
    expect(segs[1].collapsed).toBe(true);
    expect(flattenDisplay(segs).map((a) => a.uuid)).toEqual([
      "solo",
      ...Array.from({ length: RUN_PREVIEW_COUNT }, (_, i) => `a${i}`),
    ]);
  });

  it("展开后序列恢复完整；j/k 不会聚焦到隐藏行", () => {
    const big = Array.from({ length: RUN_COLLAPSE_MIN }, (_, i) =>
      article(`a${i}`, "f1"),
    );
    setRunExpanded("f1", true);
    const segs = buildSegments(big);
    expect(segs[0].collapsed).toBe(false);
    expect(flattenDisplay(segs)).toHaveLength(RUN_COLLAPSE_MIN);
    setRunExpanded("f1", false);
    expect(flattenDisplay(buildSegments(big))).toHaveLength(RUN_PREVIEW_COUNT);
  });
});

describe("展开记忆（会话级）", () => {
  beforeEach(() => {
    setRunExpanded("f1", false);
  });

  it("setRunExpanded 触发订阅者；重复设置不触发", () => {
    let version = getRunExpansionVersion();
    let calls = 0;
    const unsub = subscribeRunExpansion(() => {
      calls += 1;
      version = getRunExpansionVersion();
    });
    setRunExpanded("f1", true);
    expect(calls).toBe(1);
    expect(version).toBeGreaterThan(0);
    expect(isRunExpanded("f1")).toBe(true);
    setRunExpanded("f1", true);
    expect(calls).toBe(1);
    unsub();
  });
});

describe("runUnreadCount", () => {
  it("只统计未读", () => {
    const run = {
      feedUuid: "f1",
      key: "f1:a",
      articles: [
        article("a", "f1", true),
        article("b", "f1", false),
        article("c", "f1", true),
      ],
    };
    expect(runUnreadCount(run)).toBe(2);
  });
});
