import { useCallback, useEffect, useMemo, useRef } from "react";
import { useMatch } from "react-router-dom";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { useShallow } from "zustand/react/shallow";
import { RouteConfig } from "@/config";
import type { ArticleResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { useBearStore } from "@/stores";

const PAGE_SIZE = 20;

function omitUndefined<T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

export interface CarrierCounts {
  text: number;
  audio: number;
  video: number;
  email: number;
}

/** 日期桶真实分布（服务端同条件全量口径，与 buckets.ts 同一定义） */
export interface DayBucketCounts {
  today: number;
  yesterday: number;
  week: number;
  lastweek: number;
  month: number;
  earlier: number;
}

export interface UseArticleProps {
  feedUuid?: string;
  type?: string;
  collectionUuid?: string | null;
  tagUuid?: string | null;
  isStarred?: number | boolean | null;
  isArchived?: number | boolean;
  isReadLater?: number | boolean;
  hasNotes?: boolean;
  /** 载体过滤（text/audio/video/email）：服务端过滤，不随分页截断 */
  carrier?: string;
  /**
   * read_status 覆盖：undefined = 跟随全局 currentFilter；
   * null = 不过滤（全部）；1/2 = 未读/已读。源队列帧的过滤条用它。
   */
  readStatus?: number | null;
}

/** 一个时间桶的独立懒加载列表（每桶一条 SWRInfinite 通道，互不阻塞）。
 *  bucket = 日期桶键（today…earlier）；源队列帧为 null（无日期头） */
export interface ListSection {
  bucket: string | null;
  /** 桶键（bucket ?? "queue"），父级 onLoadMore 回传用 */
  key: string;
  rows: ArticleResItem[];
  /** 已加载行数 */
  loaded: number;
  /** 服务端同条件真实总量；缺省 = 未知，回落 loaded */
  realCount?: number;
  hasMore: boolean;
  loading: boolean;
  loadMore: () => void;
}

interface BucketPage {
  list: ArticleResItem[];
  total: number;
}

/** 单桶懒加载：day_bucket 走服务端过滤，翻页只翻本桶 */
function useBucketList(
  query: Record<string, any>,
  bucket: string,
  enabled: boolean,
  registerMutate: (bucket: string, m: (fn: any) => void) => void,
) {
  const getKey = useCallback(
    (pageIndex: number, previousPageData: BucketPage | null) => {
      if (!enabled) return null;
      if (previousPageData && !previousPageData.list?.length) return null;
      return { ...query, day_bucket: bucket, cursor: pageIndex + 1 };
    },
    [query, bucket, enabled],
  );
  const { data, size, setSize, isLoading, mutate } = useSWRInfinite(
    getKey,
    (q) => dataAgent.getArticleList({ ...q }),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateFirstPage: false,
      dedupingInterval: 1000,
    },
  );

  // 过滤条件变化（载体 tab/视图切换）时分页深度归零：SWR Infinite 的 size 跨 key
  // 保留，不重置会让新视图把旧深度页全部并发拉一遍（请求风暴），桶与桶的加载
  // 状态也会互相纠缠。旧扁平实现有同款 effect，重写时恢复（2026-09-29）
  useEffect(() => {
    setSize(1);
  }, [query, setSize]);

  // 读态/星标等操作经父级 retain 后写回本桶缓存（每桶注册自己的 mutator）
  const mutateRef = useRef(mutate);
  mutateRef.current = mutate;
  useEffect(() => {
    registerMutate(bucket, (fn: any) => mutateRef.current(fn, false));
  }, [bucket, registerMutate, mutate]);

  const rows: ArticleResItem[] = data
    ? data.reduce(
        (acu: ArticleResItem[], cur) => acu.concat(cur.list || []),
        [],
      )
    : [];
  const hasMore = !!data && data[data.length - 1]?.list?.length === PAGE_SIZE;
  // 首页未拉过 = 尚无数据可判；hasMore 视为真，展开/哨兵会触发首拉
  const loadMore = useCallback(() => {
    if (isLoading) return;
    setSize(size + 1);
  }, [isLoading, size, setSize]);

  return { rows, loaded: rows.length, hasMore, loading: isLoading, loadMore };
}

export function useArticle(props: UseArticleProps) {
  const {
    feedUuid,
    type,
    collectionUuid,
    tagUuid,
    isStarred: isStarredOverride,
    isArchived,
    isReadLater,
    hasNotes,
    carrier,
    readStatus,
  } = props;
  const isToday = useMatch(RouteConfig.LOCAL_TODAY);
  const isAll = useMatch(RouteConfig.LOCAL_ALL);
  const isStarred = useMatch(RouteConfig.LOCAL_STARRED);

  const store = useBearStore(
    useShallow((state) => ({
      currentFilter: state.currentFilter,
      updateArticleStatus: state.updateArticleStatus,
    })),
  );

  const query = useMemo(() => {
    const isTodayVal = isToday ? 1 : undefined;
    const isAllVal = isAll ? 1 : undefined;
    const isStarredVal =
      isStarredOverride !== undefined
        ? isStarredOverride === null
          ? undefined
          : isStarredOverride
            ? 1
            : 0
        : isStarred
          ? 1
          : undefined;
    return omitUndefined({
      read_status:
        readStatus !== undefined
          ? (readStatus ?? undefined)
          : isStarred
            ? undefined
            : store.currentFilter.id,
      limit: PAGE_SIZE,
      feed_uuid: feedUuid,
      item_type: type,
      is_today: isTodayVal,
      is_all: isAllVal,
      is_starred: isStarredVal,
      collection_uuid: collectionUuid || undefined,
      tag_uuid: tagUuid || undefined,
      is_archived: isArchived !== undefined ? (isArchived ? 1 : 0) : undefined,
      is_read_later:
        isReadLater !== undefined ? (isReadLater ? 1 : 0) : undefined,
      has_notes: hasNotes ? 1 : undefined,
      carrier,
    });
  }, [
    feedUuid,
    type,
    isToday,
    isAll,
    isStarred,
    store.currentFilter.id,
    collectionUuid,
    tagUuid,
    isStarredOverride,
    isArchived,
    isReadLater,
    hasNotes,
    carrier,
    readStatus,
  ]);

  const isQueue = !!feedUuid;

  // ── 源队列帧：单通道扁平分页（单源行数有限，无桶的必要）──
  const getKey = useCallback(
    (pageIndex: number, previousPageData: BucketPage | null) => {
      if (!isQueue) return null;
      if (previousPageData && !previousPageData.list?.length) return null;
      return { ...query, cursor: pageIndex + 1 };
    },
    [isQueue, query],
  );
  const queue = useSWRInfinite(
    getKey,
    (q) => dataAgent.getArticleList({ ...q }),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateFirstPage: false,
      dedupingInterval: 1000,
    },
  );
  // 同桶列表：过滤变化时分页深度归零
  useEffect(() => {
    if (isQueue) queue.setSize(1);
  }, [query, isQueue, queue]);

  // ── 全局视图：六个时间桶各自独立懒加载（时间流契约）。
  // hooks 固定六路无条件调用，enabled 门控是否发请求──
  const mutatorsRef = useRef(new Map<string, (fn: any) => void>());
  const registerMutate = useCallback((bucket: string, m: (fn: any) => void) => {
    mutatorsRef.current.set(bucket, m);
  }, []);

  const today = useBucketList(query, "today", !isQueue, registerMutate);
  const yesterday = useBucketList(query, "yesterday", !isQueue, registerMutate);
  const week = useBucketList(query, "week", !isQueue, registerMutate);
  const lastweek = useBucketList(query, "lastweek", !isQueue, registerMutate);
  const month = useBucketList(query, "month", !isQueue, registerMutate);
  const earlier = useBucketList(query, "earlier", !isQueue, registerMutate);

  // 载体过滤条计数 + 日期桶分布：服务端同条件单趟扫描（不随分页衰减）。
  // 全局 summary：顶栏载体 tab 的计数（tab 计数本身就是全局分布，不随激活 tab 变）。
  const countsParams = useMemo(() => {
    const {
      carrier: _carrier,
      limit: _limit,
      ...rest
    } = query as Record<string, unknown>;
    return rest;
  }, [query]);
  const { data: globalSummary, mutate: mutateSummary } = useSWR(
    feedUuid ? null : ["article-summary", countsParams],
    ([, params]: [string, Record<string, unknown>]) =>
      dataAgent.getArticleSummary({ ...params }),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 1000,
    },
  );

  // 作用域 summary：含当前载体 tab——日期头的桶计数必须随 tab 重新统计
  // （用户实测：切到播客后日期头还挂着全局数字、空桶照样渲染）。
  // carrier = "all" 时与全局同参，直接复用，不多发一趟。
  const scopedParams = useMemo(() => {
    const { limit: _limit, ...rest } = query as Record<string, unknown>;
    return rest;
  }, [query]);
  const { data: scopedSummary } = useSWR(
    feedUuid || !carrier || carrier === "all"
      ? null
      : ["article-summary-scoped", scopedParams],
    ([, params]: [string, Record<string, unknown>]) =>
      dataAgent.getArticleSummary({ ...params }),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 1000,
    },
  );

  const carrierCounts: CarrierCounts = {
    text: globalSummary?.text ?? 0,
    audio: globalSummary?.audio ?? 0,
    video: globalSummary?.video ?? 0,
    email: globalSummary?.email ?? 0,
  };
  // 日期头口径：有作用域结果用作用域；"全部" tab（无作用域请求）回落全局
  const bucketSource =
    !carrier || carrier === "all"
      ? globalSummary
      : (scopedSummary ?? globalSummary);
  const dayCounts: DayBucketCounts | undefined = bucketSource
    ? {
        today: bucketSource.day_today,
        yesterday: bucketSource.day_yesterday,
        week: bucketSource.day_week,
        lastweek: bucketSource.day_lastweek,
        month: bucketSource.day_month,
        earlier: Math.max(
          0,
          bucketSource.total -
            bucketSource.day_today -
            bucketSource.day_yesterday -
            bucketSource.day_week -
            bucketSource.day_lastweek -
            bucketSource.day_month,
        ),
      }
    : undefined;

  const queueRows: ArticleResItem[] = queue.data
    ? queue.data.reduce(
        (acu: ArticleResItem[], cur) => acu.concat(cur.list || []),
        [],
      )
    : [];
  const queueTotal = queue.data?.[queue.data.length - 1]?.total ?? 0;

  // sections：全局 = 六桶固定顺序（头永远在，真实计数先行）；队列 = 单段
  const sections: ListSection[] = isQueue
    ? [
        {
          bucket: null,
          key: "queue",
          rows: queueRows,
          loaded: queueRows.length,
          realCount: queueTotal,
          hasMore:
            !!queue.data &&
            queue.data[queue.data.length - 1]?.list?.length === PAGE_SIZE,
          loading: queue.isLoading,
          loadMore: () => queue.setSize(queue.size + 1),
        },
      ]
    : [
        { bucket: "today", key: "today", ...today },
        { bucket: "yesterday", key: "yesterday", ...yesterday },
        { bucket: "week", key: "week", ...week },
        { bucket: "lastweek", key: "lastweek", ...lastweek },
        { bucket: "month", key: "month", ...month },
        { bucket: "earlier", key: "earlier", ...earlier },
      ].map((s) => ({
        ...s,
        realCount: dayCounts
          ? dayCounts[s.bucket as keyof DayBucketCounts]
          : undefined,
      }));

  const articles: ArticleResItem[] = sections.flatMap((s) => s.rows);
  const isLoadingAny = isQueue
    ? queue.isLoading
    : sections.some((s) => s.loading);
  const isEmpty = !isLoadingAny && articles.length === 0;
  const total = isQueue ? queueTotal : (globalSummary?.total ?? 0);

  // 读态/星标 retain：应用到每一条桶通道的缓存（原扁平版本的 mutate 语义）
  const mutate = useCallback(
    (fn: (pages: any) => any) => {
      for (const m of mutatorsRef.current.values()) m(fn);
      if (isQueue) queueRef.current(fn);
    },
    [isQueue],
  );

  const queueRef = useRef(queue.mutate);
  queueRef.current = queue.mutate;

  return {
    sections,
    articles,
    total,
    carrierCounts,
    dayCounts,
    refreshCarrierCounts: () => mutateSummary(),
    isLoading: isLoadingAny,
    mutate,
    isEmpty,
    isToday: !!isToday,
    isAll: !!isAll,
    isStarred: !!isStarred,
    error: null,
  };
}
