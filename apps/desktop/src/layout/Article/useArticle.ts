import useSWRInfinite from "swr/infinite";
import { useBearStore } from "@/stores";
import { request } from "@/helpers/request";
import { useMatch } from "react-router-dom";
import { RouteConfig } from "@/config";
import { omit } from "lodash";
import { ArticleResItem } from "@/db";
import { useMemo, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";

const PAGE_SIZE = 20;

export interface UseArticleProps {
  feedUuid?: string;
  type?: string;
}

export function useArticle(props: UseArticleProps) {
  const { feedUuid, type } = props;
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
    const isStarredVal = isStarred ? 1 : undefined;
    return omit({
      read_status: isStarred ? undefined : store.currentFilter.id,
      limit: PAGE_SIZE,
      feed_uuid: feedUuid,
      item_type: type,
      is_today: isTodayVal,
      is_all: isAllVal,
      is_starred: isStarredVal,
    });
  }, [
    feedUuid,
    type,
    isToday,
    isAll,
    isStarred,
    store.currentFilter.id,
  ]);

  const getKey = useCallback(
    (pageIndex: number, previousPageData: any) => {
      if (previousPageData && !previousPageData.list?.length)
        return null; // 已经到最后一页

      return {
        ...query,
        cursor: pageIndex + 1,
      }; // SWR key
    },
    [query],
  );
  const { data, isLoading, size, mutate, setSize } = useSWRInfinite(
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

  const list = data
    ? data.reduce((acu, cur) => acu.concat(cur.list || []), [])
    : [];
  const articles: ArticleResItem[] = list ? [].concat(list) : [];
  const isEmpty = !isLoading && list.length === 0;
  const isReachingEnd =
    isEmpty || (data && data[data.length - 1]?.list?.length < PAGE_SIZE);

  return {
    articles,
    isLoading,
    mutate,
    size,
    setSize,
    isEmpty,
    isReachingEnd,
    isToday: !!isToday,
    isAll: !!isAll,
    isStarred: !!isStarred,
  };
}
