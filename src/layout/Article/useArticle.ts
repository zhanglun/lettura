import useSWRInfinite from "swr/infinite";
import { useBearStore } from "@/stores";
import { request } from "@/helpers/request";
import { useMatch } from "react-router-dom";
import { RouteConfig } from "@/config";
import { omit } from "lodash";

const PAGE_SIZE = 20;

export interface UseArticleProps {
  feedUuid?: string;
  type?: string;
}

export function useArticle(props: UseArticleProps) {
  const { feedUuid, type } = props;
  const isToday = useMatch(RouteConfig.LOCAL_TODAY);
  const isAll = useMatch(RouteConfig.LOCAL_ALL);
  const store = useBearStore((state) => ({
    currentFilter: state.currentFilter,
  }));

  const query = omit({
    read_status: store.currentFilter.id,
    limit: PAGE_SIZE,
    feed_uuid: feedUuid,
    item_type: type,
    is_today: isToday && 1,
    is_all: isAll && 1,
  });

  const getKey = (pageIndex: number, previousPageData: any) => {
    const list = !previousPageData ? [] : previousPageData.list;
    if (previousPageData && !previousPageData.list?.length) return null; // 已经到最后一页

    return {
      ...query,
      cursor: pageIndex + 1,
    }; // SWR key
  };
  const { data, error, isLoading, isValidating, mutate, size, setSize } =
    useSWRInfinite(getKey, (q) =>
      request
        .get("/articles", {
          params: { ...q },
        })
        .then((res) => res.data)
    );

  const list = data
    ? data.reduce((acu, cur) => acu.concat(cur.list || []), [])
    : [];
  const articles = list ? [].concat(list) : [];
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = !isLoading && list.length === 0;
  const isReachingEnd =
    isEmpty || (data && data[data.length - 1]?.list?.length < PAGE_SIZE);
  const isRefreshing = isValidating && data && data.length === size;

  return {
    articles,
    error,
    isLoading,
    isValidating,
    isLoadingMore,
    size,
    setSize,
    isEmpty,
    isReachingEnd,
    isRefreshing,
  };
}
