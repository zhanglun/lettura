import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useMatch } from "react-router-dom";
import useSWRInfinite from "swr/infinite";
import { ArticleItem } from "../ArticleItem";
import { useBearStore } from "@/stores";
import { useArticleListHook } from "./hooks";
import { Skeleton } from "../ui/skeleton";
import { RouteConfig } from "@/config";
import { fetcher, request } from "@/helpers/request";
import * as dateAgent from "@/helpers/dataAgent";
import { ArticleResItem } from "@/db";
import { useIntersectionObserver } from "./useIntersectionObserver";

export type ArticleListProps = {
  feedUuid?: string;
  type?: string;
  feedUrl: string | null;
  title: string | null;
};

const PAGE_SIZE = 20;
export interface ArticleListRefType {
  getList: () => void;
  markAllRead: () => void;
  articlesRef: any;
  innerRef: React.RefObject<HTMLDivElement>;
}

export const ArticleList = React.memo((props: ArticleListProps) => {
  const { feedUuid, feedUrl, type, title } = props;
  // const isToday = useMatch(RouteConfig.LOCAL_TODAY);
  // const isAll = useMatch(RouteConfig.LOCAL_ALL);
  const loadRef = useRef<HTMLDivElement | null>(null);
  const entry = useIntersectionObserver(loadRef, {});
  console.log("%c Line:35 🍡 entry", "color:#e41a6a", entry);
  const loadRefVisible = !!entry?.isIntersecting;
  console.log("%c Line:37 🍻 loadRefVisible", "color:#fca650", loadRefVisible);

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
  const articleList = list ? [].concat(list) : [];
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = !isLoading && list.length === 0;
  console.log("%c Line:72 🍧 isEmpty", "color:#f5ce50", isEmpty);
  const isReachingEnd =
    isEmpty || (data && data[data.length - 1]?.list?.length < PAGE_SIZE);
  const isRefreshing = isValidating && data && data.length === size;

  const renderList = (): JSX.Element[] => {
    return (articleList || []).map((article: any, idx: number) => {
      return (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          initial={{ opacity: 0, y: 30 }}
          key={article.title + idx}
        >
          <ArticleItem article={article} />
        </motion.div>
      );
    });
  };


  useEffect(() => {
    console.log("%c Line:101 🍌 size", "color:#b03734", size);

    if (loadRefVisible && !isReachingEnd) {
      setSize(size + 1)
    }
  }, [loadRefVisible, isReachingEnd])

  return (
    <div className="overflow-y-auto h-[calc(100vh_-_var(--app-toolbar-height))]">
      {isEmpty ? <p>Yay, no issues found.</p> : null}
      <ul className="m-0 grid gap-2 py-2 px-2">{renderList()}</ul>
      <div ref={loadRef} className="pt-1">
        {isLoading && (
          <div className="p-3 pl-6 grid gap-1 relative">
            <Skeleton className="h-5 w-full" />
            <div>
              <Skeleton className="h-3 w-full" />
            </div>
            <div>
              <Skeleton className="h-3 w-full m-[-2px]" />
            </div>
            <div>
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
