import useSWRInfinite from "swr/infinite";
import { useBearStore } from "@/stores";
import { request } from "@/helpers/request";

const PAGE_SIZE = 20;

export interface UseArticleProps {
  feedUuid?: string;
  type?: string;
}

export function useArticle (props: UseArticleProps) {
  const { feedUuid, type  } = props;
  const store = useBearStore((state) => ({
    currentFilter: state.currentFilter,
  }));

  const query = {
    read_status: store.currentFilter.id,
    limit: PAGE_SIZE,
    feed_uuid: feedUuid,
    item_type: type,
  };

  const getKey = (pageIndex: number, previousPageData: any) => {
    console.log("%c Line:50 🥃 previousPageData", "color:#42b983", previousPageData);
    const list = !previousPageData ? [] : previousPageData.list;
    if (previousPageData && !previousPageData.list?.length) return null; // 已经到最后一页

    return {
      ...query,
      cursor: pageIndex+1,
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

  const list = data ? data.reduce((acu, cur) => acu.concat(cur.list || []), []) : [];
  console.log("%c Line:74 🥔 data", "color:#2eafb0", data);
  console.log("%c Line:74 🥤 list", "color:#42b983", list);
  const articles = list ? [].concat(list) : [];
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = !isLoading && list.length === 0;
  console.log("%c Line:72 🍧 isEmpty", "color:#f5ce50", isEmpty);
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
  }
}
