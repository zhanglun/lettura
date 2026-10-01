import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useMatch } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { RouteConfig } from "@/config";
import type { ArticleResItem } from "@/db";
import { apiGet } from "@/helpers/http";
import { useAppStore } from "@/stores";

const PAGE_SIZE = 100;

type BucketPage = {
  list: ArticleResItem[];
  total: number;
};
type ArticleUpdater = (pages: BucketPage[]) => BucketPage[] | undefined;
type ArticleMutator = (fn: ArticleUpdater) => void;
type ArticleSummary = CarrierCounts & {
  total: number;
  day_today: number;
  day_yesterday: number;
  day_week: number;
  day_lastweek: number;
  day_month: number;
};

// Keep only the cache, request de-duplication, and pagination state needed by
// the local HTTP API; there is no network revalidation layer.
const listCache = new Map<string, BucketPage[]>();
const listInflight = new Map<string, Promise<BucketPage>>();
const summaryCache = new Map<string, ArticleSummary>();
const summaryInflight = new Map<string, Promise<ArticleSummary>>();
const initialSectionsCache = new Map<string, Map<string, BucketPage>>();
const initialSectionsErrors = new Map<string, unknown>();
const initialSectionsInflight = new Map<
  string,
  Promise<{ bucket: string; list: ArticleResItem[]; total: number }[]>
>();

function stableKey(value: unknown) {
  return JSON.stringify(value);
}

/** 键切换帧的占位空页（useLayoutEffect 会在 paint 前以真值纠正） */
const EMPTY_PAGES: BucketPage[] = [];

function omitUndefined<T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) result[key] = obj[key];
  }
  return result;
}

export interface CarrierCounts {
  text: number;
  audio: number;
  video: number;
  email: number;
}

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
  /** 原地源过滤（未读页源棱镜）：只往查询里加 feed_uuid，不切队列帧身份 */
  sourceUuid?: string;
  type?: string;
  /** 外部覆盖星标过滤；null = 不加星标条件，undefined 跟随当前路由 */
  isStarred?: number | boolean | null;
  carrier?: string;
  /** undefined follows the global filter; null means all read states. */
  readStatus?: number | null;
}

export interface ListSection {
  bucket: string | null;
  key: string;
  rows: ArticleResItem[];
  loaded: number;
  realCount?: number;
  hasMore: boolean;
  loading: boolean;
  loadMore: () => void;
}

function useArticleListChannel(
  query: Record<string, unknown>,
  bucket: string | null,
  initiallyEnabled: boolean,
  registerMutate?: (key: string, mutate: ArticleMutator) => void,
  initialPage?: BucketPage,
  initialLoading = false,
) {
  const key = stableKey({ query, bucket });
  const activeKey = useRef(key);
  const [pages, setPages] = useState<BucketPage[]>(
    () => listCache.get(key) ?? [],
  );
  const [pagesKey, setPagesKey] = useState(key);
  const [loading, setLoading] = useState(false);
  const pagesRef = useRef(pages);
  const loadingRef = useRef(false);
  // ref 经 effect 同步（渲染期写 ref 会让编译器 bail-out）。useRef 已用
  // 首渲染值初始化，事件回调只能在 commit 后触发，读到的一定是当前值；
  // mutate 的主数据源是模块级 listCache（始终同步最新），ref 仅兜底
  useEffect(() => {
    activeKey.current = key;
  }, [key]);
  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  // 键切换（含种子到达）的缓存→state 同步必须在 paint 前完成（useLayoutEffect）：
  // 渲染期读全局缓存会被编译器按纯计算缓存住陈旧值（实测过）
  useLayoutEffect(() => {
    if (initialPage && !(listCache.get(key)?.length ?? 0)) {
      listCache.set(key, [initialPage]);
    }
    setPagesKey(key);
    setPages(listCache.get(key) ?? []);
    setLoading(false);
    loadingRef.current = false;
  }, [initialPage, key]);

  // promise.finally 表达复位语义（编译器 1.0 不支持 try/finally 语句；
  // 拒绝时异常照常向上传播，与原 try/finally 无 catch 的行为一致）
  const loadMore = async () => {
    if (loadingRef.current) return;
    const cached = listCache.get(key) ?? [];
    const pageIndex = cached.length;
    if (cached[pageIndex]) {
      setPages(cached);
      return;
    }

    const filter = {
      ...query,
      ...(bucket ? { day_bucket: bucket } : {}),
      cursor: pageIndex + 1,
    };
    const requestKey = stableKey(filter);
    let request = listInflight.get(requestKey);
    if (!request) {
      request = apiGet<{ list: ArticleResItem[]; total: number }>(
        "/articles",
        filter,
      );
      listInflight.set(requestKey, request);
    }

    loadingRef.current = true;
    setLoading(true);
    await request
      .then((page) => {
        const next = [...(listCache.get(key) ?? [])];
        next[pageIndex] = page;
        listCache.set(key, next);
        if (activeKey.current === key) {
          pagesRef.current = next;
          setPages(next);
        }
      })
      .finally(() => {
        listInflight.delete(requestKey);
        if (activeKey.current === key) {
          loadingRef.current = false;
          setLoading(false);
        }
      });
  };

  useEffect(() => {
    if (initiallyEnabled && pagesKey === key && pages.length === 0) {
      void loadMore();
    }
  }, [initiallyEnabled, key, loadMore, pages.length, pagesKey]);

  const mutate = (fn: ArticleUpdater) => {
    const current = listCache.get(key) ?? pagesRef.current;
    const next = fn(current) ?? current;
    listCache.set(key, next);
    pagesRef.current = next;
    setPages(next);
  };

  useEffect(() => {
    registerMutate?.(bucket ?? "queue", mutate);
  }, [bucket, mutate, registerMutate]);

  // 键切换帧由 useLayoutEffect 在 paint 前纠正，此兜底分支不参与绘制；
  // 只走 state（EMPTY_PAGES 常量保持引用稳定）
  const visiblePages = pagesKey === key ? pages : EMPTY_PAGES;
  const rows = visiblePages.flatMap((page) => page.list);
  const lastPage = visiblePages.at(-1);
  // 键切换（切筛选）瞬间 effect 还没跑 loadMore，state 的 loading 仍是 false——
  // 「已启用但一页都没有」就是首屏在途，同步报 loading，否则列表闪一帧空态
  // （合法空结果 fetch 后会有页对象，list.length=0，不会卡在 loading）
  const pendingFirstPage = initiallyEnabled && visiblePages.length === 0;
  // 桶通道的播种间隙：initial-sections 已落地（initialLoading 转 false）、
  // 种子页要下一帧 effect 才进 listCache——这一帧 initial.loading=false 且
  // 桶页为空，isEmpty 会误真闪一帧空态。种子在手 = 数据已在途中
  const pendingSeed = !!initialPage && visiblePages.length === 0;
  return {
    rows,
    loaded: rows.length,
    realCount: lastPage?.total,
    hasMore: visiblePages.length === 0 || lastPage?.list.length === PAGE_SIZE,
    loading: loading || initialLoading || pendingFirstPage || pendingSeed,
    loadMore,
    mutate,
  };
}

function useArticleInitialSections(
  query: Record<string, unknown>,
  enabled: boolean,
) {
  const key = stableKey(query);
  const activeKey = useRef(key);
  // ref 经 effect 同步（渲染期写 ref 会让编译器 bail-out）
  useEffect(() => {
    activeKey.current = key;
  }, [key]);
  const [sections, setSections] = useState<Map<string, BucketPage>>(
    () => initialSectionsCache.get(key) ?? new Map(),
  );
  const [sectionsKey, setSectionsKey] = useState(key);
  // 首帧即正确：未命中缓存 = 首屏在途（惰性初始化只跑一次，编译器安全）；
  // 后续键切换由 layout effect 纠正
  const [loading, setLoading] = useState(
    () => enabled && !initialSectionsCache.has(key),
  );
  const [error, setError] = useState<unknown>(() =>
    initialSectionsErrors.get(key),
  );
  const [retryToken, setRetryToken] = useState(0);

  // 键切换的缓存→state 同步必须在 paint 前完成（useLayoutEffect）：
  // 派生值只走 state（见下），若用 useEffect 会画出一帧旧键内容。
  // effect 体内读缓存是 commit 时点，永远新鲜——渲染期读全局会被
  // 编译器按纯计算缓存（实测 setSections 落地后 has(key) 仍为 true）
  useLayoutEffect(() => {
    setSectionsKey(key);
    setSections(initialSectionsCache.get(key) ?? new Map());
    setError(initialSectionsErrors.get(key));
    setLoading(initialSectionsCache.has(key) ? false : enabled);
  }, [enabled, key]);

  // 首屏请求在 commit 后发起（去重由 inflight 表保证，重复触发无害）
  useEffect(() => {
    if (!enabled || initialSectionsCache.has(key)) return;
    let request = initialSectionsInflight.get(key);
    if (!request) {
      request = apiGet<
        { bucket: string; list: ArticleResItem[]; total: number }[]
      >("/articles/initial-sections", { ...query, limit: 100 });
      initialSectionsInflight.set(key, request);
    }
    setLoading(true);
    request
      .then((items) => {
        const next = new Map(
          items.map((item) => [
            item.bucket,
            { list: item.list, total: item.total },
          ]),
        );
        initialSectionsCache.set(key, next);
        initialSectionsErrors.delete(key);
        if (activeKey.current === key) {
          setSections(next);
          setError(undefined);
        }
      })
      .catch((requestError) => {
        initialSectionsErrors.set(key, requestError);
        if (activeKey.current === key) setError(requestError);
      })
      .finally(() => {
        initialSectionsInflight.delete(key);
        if (activeKey.current === key) setLoading(false);
      });
  }, [enabled, key, query, retryToken]);

  // 派生只走 state，绝不读模块级缓存（编译器会按纯计算缓存住陈旧值）。
  // 键切换帧由 useLayoutEffect 在 paint 前纠正，不会露出旧键内容
  const currentSections =
    sectionsKey === key ? sections : new Map<string, BucketPage>();
  const currentLoading = enabled && (loading || sectionsKey !== key);
  const retry = () => {
    initialSectionsCache.delete(key);
    initialSectionsErrors.delete(key);
    setSections(new Map());
    setSectionsKey(key);
    setError(undefined);
    setLoading(true);
    setRetryToken((value) => value + 1);
  };

  return {
    sections: currentSections,
    loading: currentLoading,
    error,
    ready: !enabled || !!error || (sectionsKey === key && !loading),
    retry,
  };
}

function useArticleSummary(
  params: Record<string, unknown> | null,
  enabled: boolean,
) {
  const key = params ? stableKey(params) : "";
  const [data, setData] = useState<ArticleSummary | undefined>(() =>
    key ? summaryCache.get(key) : undefined,
  );
  const [dataKey, setDataKey] = useState(key);

  // promise.finally 表达复位语义（编译器 1.0 不支持 try/finally）；
  // 拒绝时异常照常向上传播，与原实现一致
  const load = async (force = false) => {
    if (!key || !params) return;
    if (!force) {
      const cached = summaryCache.get(key);
      if (cached) {
        setData(cached);
        return cached;
      }
    }
    let request = summaryInflight.get(key);
    if (!request) {
      request = apiGet<ArticleSummary>("/articles/summary", params);
      summaryInflight.set(key, request);
    }
    return request
      .then((summary) => {
        summaryCache.set(key, summary);
        setData(summary);
        return summary;
      })
      .finally(() => {
        summaryInflight.delete(key);
      });
  };

  useEffect(() => {
    setDataKey(key);
    setData(key ? summaryCache.get(key) : undefined);
    if (enabled) void load();
  }, [enabled, key, load]);

  return {
    data: dataKey === key ? data : undefined,
    refresh: () => load(true),
  };
}

export function useArticle(props: UseArticleProps) {
  const {
    feedUuid,
    sourceUuid,
    type,
    isStarred: isStarredOverride,
    carrier,
    readStatus,
  } = props;
  const isToday = useMatch(RouteConfig.LOCAL_TODAY);
  const isAll = useMatch(RouteConfig.LOCAL_ALL);
  const isStarred = useMatch(RouteConfig.LOCAL_STARRED);
  const currentFilter = useAppStore(useShallow((state) => state.currentFilter));

  // 查询键由 React Compiler 自动记忆化（原手写 useMemo 已删）——
  // 它是所有模块级缓存 Map 的 key 源头，引用稳定是缓存命中的前提
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
  const query = omitUndefined({
    read_status:
      readStatus !== undefined
        ? (readStatus ?? undefined)
        : isStarred
          ? undefined
          : currentFilter.id,
    limit: PAGE_SIZE,
    feed_uuid: feedUuid ?? sourceUuid,
    item_type: type,
    is_today: isToday ? 1 : undefined,
    is_all: isAll ? 1 : undefined,
    is_starred: isStarredVal,
    carrier: carrier && carrier !== "all" ? carrier : undefined,
  });

  const isQueue = !!feedUuid;
  const mutatorsRef = useRef(new Map<string, ArticleMutator>());
  const registerMutate = (bucket: string, mutate: ArticleMutator) => {
    mutatorsRef.current.set(bucket, mutate);
  };

  const initial = useArticleInitialSections(query, !isQueue);
  // 种子必须走响应式 state（initial.sections）而非模块级缓存：
  // 编译器把「读可变全局」当纯计算缓存，setSections 落地后调用结果不会
  // 重算（实测种子恒 undefined、桶通道永远播种不上）。state 变化才会
  // 让编译器重算派生值、播种 effect 才会带着新种子重跑。
  // During a filter switch, the hook state still contains the previous query's
  // sections for one render. Read only the cache for the current query; never
  // seed the new filter with the old filter's first page.
  const initialSections = initial.sections;
  const initialPage = (bucket: string) => initialSections.get(bucket);

  const queue = useArticleListChannel(query, null, isQueue);
  // One HTTP request loads all six initial buckets. Each bucket keeps its own
  // cursor for later pagination, but does not issue another first-page request.
  const today = useArticleListChannel(
    query,
    "today",
    false,
    registerMutate,
    initialPage("today"),
    initial.loading,
  );
  const yesterday = useArticleListChannel(
    query,
    "yesterday",
    false,
    registerMutate,
    initialPage("yesterday"),
    initial.loading,
  );
  const week = useArticleListChannel(
    query,
    "week",
    false,
    registerMutate,
    initialPage("week"),
    initial.loading,
  );
  const lastweek = useArticleListChannel(
    query,
    "lastweek",
    false,
    registerMutate,
    initialPage("lastweek"),
    initial.loading,
  );
  const month = useArticleListChannel(
    query,
    "month",
    false,
    registerMutate,
    initialPage("month"),
    initial.loading,
  );
  const earlier = useArticleListChannel(
    query,
    "earlier",
    false,
    registerMutate,
    initialPage("earlier"),
    initial.loading,
  );

  const { carrier: _carrier, limit: _limit, ...countsParams } = query;
  const { data: globalSummary, refresh: refreshSummary } = useArticleSummary(
    feedUuid ? null : countsParams,
    !feedUuid,
  );

  const { limit: _summaryLimit, ...scopedParams } = query;
  const { data: scopedSummary } = useArticleSummary(
    feedUuid || !carrier || carrier === "all" ? null : scopedParams,
    !!(!feedUuid && carrier && carrier !== "all"),
  );

  const carrierCounts: CarrierCounts = {
    text: globalSummary?.text ?? 0,
    audio: globalSummary?.audio ?? 0,
    video: globalSummary?.video ?? 0,
    email: globalSummary?.email ?? 0,
  };
  // scoped 口径未返回时保持 undefined（不退回全局口径）：退回会让日期头短暂挂
  // 全局数字（切视频 tab 先显示文章的分布，误导），列表默认展开也会按错误口径先跳一次
  const bucketSource =
    !carrier || carrier === "all" ? globalSummary : scopedSummary;
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

  const sections: ListSection[] = isQueue
    ? [
        {
          bucket: null,
          key: "queue",
          ...queue,
        },
      ]
    : [
        { bucket: "today", key: "today", ...today },
        { bucket: "yesterday", key: "yesterday", ...yesterday },
        { bucket: "week", key: "week", ...week },
        { bucket: "lastweek", key: "lastweek", ...lastweek },
        { bucket: "month", key: "month", ...month },
        { bucket: "earlier", key: "earlier", ...earlier },
      ].map((section) => ({
        ...section,
        realCount: dayCounts
          ? dayCounts[section.bucket as keyof DayBucketCounts]
          : undefined,
      }));

  const articles = sections.flatMap((section) => section.rows);
  const isLoading = isQueue
    ? queue.loading
    : initial.loading || sections.some((s) => s.loading);
  const error = isQueue ? null : initial.error;
  const isEmpty =
    !isLoading && !error && initial.ready && articles.length === 0;
  const mutate = (fn: ArticleUpdater) => {
    if (isQueue) queue.mutate(fn);
    else
      for (const mutateBucket of mutatorsRef.current.values()) mutateBucket(fn);
  };
  const mutateBucket = (bucket: string, fn: ArticleUpdater) => {
    mutatorsRef.current.get(bucket)?.(fn);
  };

  return {
    sections,
    total: isQueue ? (queue.realCount ?? 0) : (globalSummary?.total ?? 0),
    carrierCounts,
    dayCounts,
    refreshCarrierCounts: refreshSummary,
    isLoading,
    mutate,
    mutateBucket,
    isEmpty,
    initialReady: isQueue || initial.ready,
    retry: initial.retry,
    isToday: !!isToday,
    isAll: !!isAll,
    isStarred: !!isStarred,
    error,
  };
}
