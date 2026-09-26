import type { ArticleResItem } from "@/db";
import { ArticleReadStatus } from "@/typing";

/**
 * 跨源队列的同源连跑段（按源显影结构，队列始终时间倒序）：
 * ≥ RUN_HEAD_MIN 立段头；≥ RUN_COLLAPSE_MIN 默认折叠为预览（会话级记忆展开态）。
 * 折叠只是显示层结构——键盘 j/k 沿 flattenDisplay 后的可见序列走，不会聚焦到隐藏行。
 */
export interface FeedRun {
  feedUuid: string;
  /** 段级唯一标识（feedUuid:段首 uuid）——同一 feed 可被其他源隔成多段，DOM 定位/闪光按段不按 feed */
  key: string;
  articles: ArticleResItem[];
}

export interface RunSegment {
  run: FeedRun;
  /** 是否立段头（feedUuid 缺失或段太短不立） */
  head: boolean;
  /** 当前是否折叠为预览显示 */
  collapsed: boolean;
  /** 是否可折叠（决定段头 chevron 与展开尾行） */
  collapsible: boolean;
}

export const RUN_HEAD_MIN = 3;
export const RUN_COLLAPSE_MIN = 8;
export const RUN_PREVIEW_COUNT = 3;

export function groupRuns(articles: ArticleResItem[]): FeedRun[] {
  // 按源分组（2026-09-26 契约）：同一 feed 只出现一段，消除时间序下被其他源
  // 隔断的碎片；组间按首次出现位置排序——首篇即最新篇，天然等于「最新动态在前」，
  // 组内保持服务端时间倒序。分页续载只会向既有组追加更旧的条目,组序稳定。
  const groups = new Map<string, FeedRun>();
  for (const article of articles) {
    const feedUuid = article.feed_uuid || "";
    let group = groups.get(feedUuid);
    if (!group) {
      group = {
        feedUuid,
        key: `${feedUuid}:${article.uuid}`,
        articles: [],
      };
      groups.set(feedUuid, group);
    }
    group.articles.push(article);
  }
  return [...groups.values()];
}

/* 会话级展开记忆（模块变量，同 FeedsBrowse browseMemory 先例）：
   跨视图共享对同一 feed 的折叠偏好，刷新后归位默认折叠 */
let expandedRuns = new Set<string>();
let expansionVersion = 0;
const listeners = new Set<() => void>();

export function subscribeRunExpansion(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getRunExpansionVersion(): number {
  return expansionVersion;
}

export function isRunExpanded(feedUuid: string): boolean {
  return expandedRuns.has(feedUuid);
}

export function setRunExpanded(feedUuid: string, expanded: boolean): void {
  if (expanded === expandedRuns.has(feedUuid)) return;
  const next = new Set(expandedRuns);
  if (expanded) {
    next.add(feedUuid);
  } else {
    next.delete(feedUuid);
  }
  expandedRuns = next;
  expansionVersion += 1;
  listeners.forEach((l) => l());
}

export function buildSegments(articles: ArticleResItem[]): RunSegment[] {
  return groupRuns(articles).map((run) => {
    const collapsible = !!run.feedUuid && run.articles.length >= RUN_COLLAPSE_MIN;
    return {
      run,
      head: !!run.feedUuid && run.articles.length >= RUN_HEAD_MIN,
      collapsible,
      collapsed: collapsible && !isRunExpanded(run.feedUuid),
    };
  });
}

/** 展平为「实际渲染 / 键盘可达」的文章序列（折叠段只保留预览篇） */
export function flattenDisplay(segments: RunSegment[]): ArticleResItem[] {
  const out: ArticleResItem[] = [];
  for (const seg of segments) {
    if (seg.collapsed) {
      out.push(...seg.run.articles.slice(0, RUN_PREVIEW_COUNT));
    } else {
      out.push(...seg.run.articles);
    }
  }
  return out;
}

export function runUnreadCount(run: FeedRun): number {
  return run.articles.reduce(
    (n, a) => n + (a.read_status === ArticleReadStatus.UNREAD ? 1 : 0),
    0,
  );
}
