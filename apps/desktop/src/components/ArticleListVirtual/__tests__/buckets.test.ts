import { describe, expect, it } from "vitest";
import { BUCKET_ORDER, defaultExpandedBuckets } from "../buckets";

/** 真实形态计数（2026-10-10 截图）：今天 0、昨天 3、本周 13,110、
 *  上周 10,876、30 天内 92、更早 3,274 */
const SPARSE = {
  today: 0,
  yesterday: 3,
  week: 13110,
  lastweek: 10876,
  month: 92,
  earlier: 3274,
};
const DENSE = { ...SPARSE, today: 12 };

describe("defaultExpandedBuckets（A′ 默认展开：估高到视口约 55%）", () => {
  it("稀疏日：昨天不够填首屏，自动续借本周", () => {
    // 视口 804（900 − 顶栏 54 − 过滤条 42），阈值 ≈ 442；
    // 昨天 30+3×54=192 < 442 → 展开本周（30+100×54 远超）→ 停
    const expanded = defaultExpandedBuckets(SPARSE, 804);
    expect([...expanded]).toEqual(["yesterday", "week"]);
  });

  it("饱满日：今天一桶就够，不再展开", () => {
    // 今天 30+12×54=678 ≥ 442 → 只展开今天
    const expanded = defaultExpandedBuckets(DENSE, 804);
    expect([...expanded]).toEqual(["today"]);
  });

  it("大桶本身就是一屏：行为与旧「只展开第一个非空组」一致", () => {
    const expanded = defaultExpandedBuckets(
      { ...SPARSE, yesterday: 0, week: 800 },
      804,
    );
    expect([...expanded]).toEqual(["week"]);
  });

  it("全都很小的队列：全部展开（细行集合为空）", () => {
    const expanded = defaultExpandedBuckets(
      { today: 1, yesterday: 2, week: 1, lastweek: 0, month: 0, earlier: 2 },
      804,
      0.55,
    );
    expect(expanded.size).toBe(4);
  });

  it("计数为 0 或缺失的桶不展开（不挂空头）", () => {
    const expanded = defaultExpandedBuckets(
      { yesterday: 3 } as Record<string, number>,
      804,
    );
    expect([...expanded]).toEqual(["yesterday"]);
  });

  it("返回集合是 BUCKET_ORDER 的子集，其余即应收起", () => {
    const expanded = defaultExpandedBuckets(SPARSE, 804);
    for (const bucket of expanded) {
      expect(BUCKET_ORDER).toContain(bucket as never);
    }
  });
});
