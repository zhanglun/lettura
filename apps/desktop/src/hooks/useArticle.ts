import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { useBearStore } from "@/stores";
import { request } from "@/helpers/request";
import { useMatch } from "react-router-dom";
import { RouteConfig } from "@/config";
import { ArticleResItem } from "@/db";
import { useMemo, useCallback, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

const PAGE_SIZE = 20;

function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as Partial<T>;
}

export interface CarrierCounts {
  text: number;
  audio: number;
  video: number;
  email: number;
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
      is_read_later: isReadLater !== undefined ? (isReadLater ? 1 : 0) : undefined,
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

  const getKey = useCallback(
    (pageIndex: number, previousPageData: any) => {
      if (previousPageData && !previousPageData.list?.length)
        return null;

      return {
        ...query,
        cursor: pageIndex + 1,
      };
    },
    [query],
  );
  const { data, isLoading, size, mutate, setSize, error } = useSWRInfinite(
    getKey,
    (q) =>
      request
        .get("/articles", {
          params: { ...q },
        })
        .then((res) => res.data),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 1000,
    },
  );

  // 过滤条件变化（载体 tab/源队列/已读切换）时分页深度归零：
  // SWR Infinite 的 size 跨 key 保留，不重置会让新视图把旧深度页全部拉一遍
  useEffect(() => {
    setSize(1);
  }, [query, setSize]);

  // 载体过滤条计数：服务端同条件全量（不随分页衰减）。源队列帧无载体条，不取。
  // key 不含 carrier——各载体 tab 共用同一份计数缓存。
  const countsParams = useMemo(() => {
    const { carrier: _carrier, limit: _limit, ...rest } = query as Record<string, unknown>;
    return rest;
  }, [query]);
  const { data: carrierCountsData, mutate: mutateCarrierCounts } = useSWR(
    feedUuid ? null : ["/articles/carrier-counts", countsParams],
    ([url, params]: [string, Record<string, unknown>]) =>
      request.get(url, { params }).then((res) => res.data as CarrierCounts),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 1000,
    },
  );
  const carrierCounts: CarrierCounts = carrierCountsData ?? {
    text: 0,
    audio: 0,
    video: 0,
    email: 0,
  };

  const list = data
    ? data.reduce((acu, cur) => acu.concat(cur.list || []), [])
    : [];
  const articles: ArticleResItem[] = list ? [].concat(list) : [];
  const isEmpty = !isLoading && list.length === 0;
  const isReachingEnd =
    isEmpty || (data && data[data.length - 1]?.list?.length < PAGE_SIZE);
  // 服务端同条件总数（不衰减分页）
  const total = data?.[data.length - 1]?.total ?? 0;

  return {
    articles,
    total,
    carrierCounts,
    refreshCarrierCounts: () => mutateCarrierCounts(),
    isLoading,
    mutate,
    size,
    setSize,
    isEmpty,
    isReachingEnd,
    isToday: !!isToday,
    isAll: !!isAll,
    isStarred: !!isStarred,
    error: error ?? null,
  };
}
