import useSWRInfinite from "swr/infinite";
import { useBearStore } from "@/stores";
import { request } from "@/helpers/request";
import { useMatch } from "react-router-dom";
import { RouteConfig } from "@/config";
import { omit, throttle } from "lodash";
import { ArticleResItem } from "@/db";

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
  const store = useBearStore((state) => ({
    currentFilter: state.currentFilter,
    updateArticleStatus: state.updateArticleStatus,
  }));

  const query = omit({
    read_status: isStarred ? undefined : store.currentFilter.id,
    limit: PAGE_SIZE,
    feed_uuid: feedUuid,
    item_type: type,
    is_today: isToday && 1,
    is_all: isAll && 1,
    is_starred: isStarred && 1,
  });

  console.log("%c Line:29 🍖 query", "color:#ea7e5c", query);

  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.list?.length) return null; // 已经到最后一页

    return {
      ...query,
      cursor: pageIndex + 1,
    }; // SWR key
  };
  const { data, isLoading, size, mutate, setSize } =
    useSWRInfinite(
      getKey,
      (q) =>
        request
          .get("/articles", {
            params: { ...q },
          })
          .then((res) => res.data),
      {
        revalidateIfStale: true,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
      }
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
