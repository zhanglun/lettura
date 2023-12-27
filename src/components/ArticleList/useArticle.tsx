import { useCallback, useEffect, useRef, useState } from "react";
import { useMatch } from "react-router-dom";
import { useHotkeys } from "react-hotkeys-hook";
import { useBearStore } from "@/stores";
import { RouteConfig } from "@/config";

export interface useArticleProps {
  feedUuid?: string;
  feedType?: string;
}

export function useArticle(props: useArticleProps) {
  const { feedUuid, feedType, } = props;
  const isToday = useMatch(RouteConfig.LOCAL_TODAY);
  const isAll = useMatch(RouteConfig.LOCAL_ALL);

  const store = useBearStore((state) => ({
    currentFilter: state.currentFilter,
    getArticleList: state.getArticleList,
    getTodayArticleList: state.getTodayArticleList,
    getAllArticleList: state.getAllArticleList,

    cursor: state.cursor,
    setCursor: state.setCursor,
  }));

  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const getList = (query: { cursor: number, feed_uuid?: string, item_type?: string }) => {
    const filter: { read_status?: number; cursor: number; limit?: number } = {
      read_status: store.currentFilter.id,
      limit: 12,
      ...query,
    };

    console.log("%c Line:32 🥑 filter", "color:#ffdd4d", filter);

    let fn = Promise.resolve();

    if (query.feed_uuid && query.item_type) {
      fn = store.getArticleList(filter);
    } else if (isToday) {
      fn = store.getTodayArticleList(filter);
    } else if (isAll) {
      fn = store.getAllArticleList(filter);
    } else {
      return;
    }

    setLoading(true);

    fn.then((res: any) => {
      if (res.length === 0) {
        setHasMore(false);
      } else {
        setHasMore(true);
        store.setCursor(query.cursor);
      }
    })
      .finally(() => {
        setLoading(false);
      })
      .catch((err: any) => {
        console.log("%c Line:71 🍎 err", "color:#ffdd4d", err);
      });
  };

  return {
    loading,
    hasMore,
    getList,
  }
}
