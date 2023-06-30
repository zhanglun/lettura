import { useEffect, useRef, useState } from "react";
import { useMatch } from "react-router-dom";
import { useBearStore } from "@/hooks/useBearStore";
import { useShortcut } from "@/hooks/useShortcut";
import { RouteConfig } from "@/config";
import { busChannel } from "@/helpers/busChannel";

export const useArticleListHook = (props: { feedUuid: string | null }) => {
  const { feedUuid } = props;

  const isToday = useMatch(RouteConfig.TODAY);
  const isAll = useMatch(RouteConfig.ALL);

  const store = useBearStore((state) => ({
    currentFilter: state.currentFilter,
    setArticleList: state.setArticleList,
    articleList: state.articleList,
    getArticleList: state.getArticleList,
    getTodayArticleList: state.getTodayArticleList,
    getAllArticleList: state.getAllArticleList,

    goPreviousArticle: state.goPreviousArticle,
    goNextArticle: state.goNextArticle,
    currentIdx: state.currentIdx,
    cursor: state.cursor,
    setCursor: state.setCursor
  }));
  const { registerShortcut, unregisterShortcut } = useShortcut();

  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const loadRef = useRef<HTMLDivElement>(null);
  const getList = () => {
    const filter: { read_status?: number; cursor: number; limit?: number } = {
      read_status: store.currentFilter.id,
      cursor: store.cursor,
      limit: 12,
    };

    let fn = Promise.resolve();

    if (feedUuid) {
      fn = store.getArticleList(feedUuid, filter);
    } else if (isToday) {
      fn = store.getTodayArticleList(filter);
    } else if (isAll) {
      fn = store.getAllArticleList(filter);
    } else {
      return;
    }

    setLoading(true);

    fn.then((res: any) => {
      console.log("%c Line:54 🍿 res", "color:#b03734", res);
      if (res.length === 0) {
        setHasMore(false);
      }
    })
      .finally(() => {
        setLoading(false);
      })
      .catch((err: any) => {
        console.log("%c Line:71 🍎 err", "color:#ffdd4d", err);
      });
  };

  useEffect(() => {
    if (feedUuid || isToday || isAll) {
      store.setArticleList([]);
      store.setCursor(1);

      setHasMore(true);
      getList();
    }
  }, [feedUuid, store.currentFilter, isToday, isAll]);

  useEffect(() => {
    getList();
  }, [store.cursor]);

  useEffect(() => {
    const $rootElem = listRef.current as HTMLDivElement;
    const $target = loadRef.current as HTMLDivElement;

    const options = {
      root: $rootElem,
      rootMargin: "0px 0px 50px 0px",
      threshold: 1,
    };

    const callback = (
      entries: IntersectionObserverEntry[],
      observer: IntersectionObserver
    ) => {
      entries.forEach((entry) => {
        console.log(entry);

        if (entry.isIntersecting && !loading && hasMore) {
          store.setCursor(store.cursor + 1);
        }
      });
    };

    const observer = new IntersectionObserver(callback, options);

    $target && observer.observe($target);

    return () => {
      if ($target) {
        observer.unobserve($target);
      }
    };
  }, [loading]);

  function goPrev() {
    console.warn("goPrev");
    store.goPreviousArticle();
  }

  function goNext() {
    console.warn("goNext");
    store.goNextArticle();
  }

  useEffect(() => {
    registerShortcut(["n"], goNext);
    registerShortcut(["Shift+n", "N"], goPrev);

    return () => {
      unregisterShortcut("n");
      unregisterShortcut(["Shift+n", "N"]);
    };
  }, []);

  return {
    getList,
    loading,
    hasMore,
    articleList: store.articleList,
    setLoading,
    listRef,
    loadRef,
    isToday,
    isAll,
  };
};
