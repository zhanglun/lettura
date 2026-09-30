import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMatch } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { RouteConfig } from "@/config";
import type { ArticleResItem } from "@/db";
import { apiGet } from "@/helpers/http";
import { useBearStore } from "@/stores";

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
  activeKey.current = key;
  const [pages, setPages] = useState<BucketPage[]>(
    () => listCache.get(key) ?? [],
  );
  const [pagesKey, setPagesKey] = useState(key);
  const [loading, setLoading] = useState(false);
  const pagesRef = useRef(pages);
  const loadingRef = useRef(false);
  pagesRef.current = pages;

  useEffect(() => {
    if (initialPage && !(listCache.get(key)?.length ?? 0)) {
      listCache.set(key, [initialPage]);
    }
    setPagesKey(key);
    setPages(listCache.get(key) ?? []);
    setLoading(false);
    loadingRef.current = false;
  }, [initialPage, key]);

  const loadMore = useCallback(async () => {
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
    try {
      const page = await request;
      const next = [...(listCache.get(key) ?? [])];
      next[pageIndex] = page;
      listCache.set(key, next);
      if (activeKey.current === key) {
        pagesRef.current = next;
        setPages(next);
      }
    } finally {
      listInflight.delete(requestKey);
      if (activeKey.current === key) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [bucket, key, query]);

  useEffect(() => {
    if (initiallyEnabled && pagesKey === key && pages.length === 0) {
      void loadMore();
    }
  }, [initiallyEnabled, key, loadMore, pages.length, pagesKey]);

  const mutate = useCallback(
    (fn: ArticleUpdater) => {
      const current = listCache.get(key) ?? pagesRef.current;
      const next = fn(current) ?? current;
      listCache.set(key, next);
      pagesRef.current = next;
      setPages(next);
    },
    [key],
  );

  useEffect(() => {
    registerMutate?.(bucket ?? "queue", mutate);
  }, [bucket, mutate, registerMutate]);

  const visiblePages = pagesKey === key ? pages : (listCache.get(key) ?? []);
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
  activeKey.current = key;
  const [sections, setSections] = useState<Map<string, BucketPage>>(
    () => initialSectionsCache.get(key) ?? new Map(),
  );
  const [sectionsKey, setSectionsKey] = useState(key);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(() =>
    initialSectionsErrors.get(key),
  );
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    setSectionsKey(key);
    setSections(initialSectionsCache.get(key) ?? new Map());
    setError(initialSectionsErrors.get(key));
    if (!enabled || initialSectionsCache.has(key)) {
      setLoading(false);
      return;
    }
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

  const currentSections =
    sectionsKey === key
      ? sections
      : (initialSectionsCache.get(key) ?? new Map());
  const currentError = initialSectionsErrors.get(key) ?? error;
  const currentLoading =
    enabled && !initialSectionsCache.has(key) && !currentError;
  const retry = useCallback(() => {
    initialSectionsCache.delete(key);
    initialSectionsErrors.delete(key);
    setSections(new Map());
    setSectionsKey(key);
    setError(undefined);
    setLoading(true);
    setRetryToken((value) => value + 1);
  }, [key]);

  return {
    sections: currentSections,
    loading: currentLoading || loading,
    error: currentError,
    ready: !enabled || initialSectionsCache.has(key) || !!currentError,
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

  const load = useCallback(
    async (force = false) => {
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
      try {
        const summary = await request;
        summaryCache.set(key, summary);
        setData(summary);
        return summary;
      } finally {
        summaryInflight.delete(key);
      }
    },
    [key, params],
  );

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
  const currentFilter = useBearStore(
    useShallow((state) => state.currentFilter),
  );

  const query = useMemo(() => {
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
            : currentFilter.id,
      limit: PAGE_SIZE,
      feed_uuid: feedUuid ?? sourceUuid,
      item_type: type,
      is_today: isToday ? 1 : undefined,
      is_all: isAll ? 1 : undefined,
      is_starred: isStarredVal,
      carrier: carrier && carrier !== "all" ? carrier : undefined,
    });
  }, [
    carrier,
    currentFilter.id,
    feedUuid,
    sourceUuid,
    isAll,
    isStarred,
    isStarredOverride,
    isToday,
    readStatus,
    type,
  ]);

  const isQueue = !!feedUuid;
  const mutatorsRef = useRef(new Map<string, ArticleMutator>());
  const registerMutate = useCallback(
    (bucket: string, mutate: ArticleMutator) => {
      mutatorsRef.current.set(bucket, mutate);
    },
    [],
  );

  const initial = useArticleInitialSections(query, !isQueue);
  // During a filter switch, the hook state still contains the previous query's
  // sections for one render. Read only the cache for the current query; never
  // seed the new filter with the old filter's first page.
  const initialKey = stableKey(query);
  const initialPage = (bucket: string) =>
    initialSectionsCache.get(initialKey)?.get(bucket);

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

  const countsParams = useMemo(() => {
    const { carrier: _carrier, limit: _limit, ...rest } = query;
    return rest;
  }, [query]);
  const { data: globalSummary, refresh: refreshSummary } = useArticleSummary(
    feedUuid ? null : countsParams,
    !feedUuid,
  );

  const scopedParams = useMemo(() => {
    const { limit: _limit, ...rest } = query;
    return rest;
  }, [query]);
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
  const mutate = useCallback(
    (fn: ArticleUpdater) => {
      if (isQueue) queue.mutate(fn);
      else
        for (const mutateBucket of mutatorsRef.current.values())
          mutateBucket(fn);
    },
    [isQueue, queue.mutate],
  );
  const mutateBucket = useCallback((bucket: string, fn: ArticleUpdater) => {
    mutatorsRef.current.get(bucket)?.(fn);
  }, []);

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
