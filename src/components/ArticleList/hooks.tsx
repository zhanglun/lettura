import { useCallback, useEffect, useRef, useState } from "react";
import { useMatch } from "react-router-dom";
import { useHotkeys } from "react-hotkeys-hook";
import { useBearStore } from "@/stores";
import { RouteConfig } from "@/config";

function throttle(fn: any, wait: number) {
  let previous = 0;
  let timer: ReturnType<typeof setTimeout>;

  return function (...args: any) {
    if (Date.now() - previous > wait) {
      clearTimeout(timer);

      previous = Date.now();

      fn(...args);
    } else if (!timer) {
      // 设置下一个定时器
      timer = setTimeout(() => {
        fn(...args);
      }, wait);
    }
  };
}

export const useArticleListHook = (props: {
  feedUuid: string | null;
  type: string | null;
}) => {
  const { feedUuid, type } = props;

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
    setCursor: state.setCursor,
  }));

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
      fn = store.getArticleList(feedUuid, type, filter);
    } else if (isToday) {
      fn = store.getTodayArticleList(filter);
    } else if (isAll) {
      fn = store.getAllArticleList(filter);
    } else {
      return;
    }

    setLoading(true);

    fn.then((res: any) => {
      console.log("res ===> ", feedUuid, res);

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
    console.log("store.cursor", store.cursor);
    getList();
  }, [store.cursor]);

  useEffect(() => {
    if (store.articleList.length === 0) {
      setHasMore(false);
    }
  }, [store.articleList]);

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
        if (
          entry.isIntersecting &&
          !loading &&
          hasMore &&
          store.articleList.length
        ) {
          console.log("interaction update cursor ====>");
          store.setCursor(store.cursor + 1);
        } else if (entry.isIntersecting && store.articleList.length === 0) {
          store.setCursor(1);
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
  }, [loading, store.articleList]);

  const goPrev = useCallback(
    throttle(() => {
      console.warn("goPrev");
      store.goPreviousArticle();
    }, 300),
    []
  );

  const goNext = useCallback(
    throttle(() => {
      console.warn("goNext");
      store.goNextArticle();
    }, 300),
    []
  );

  useHotkeys("n", goNext);
  useHotkeys("Shift+n", goPrev);

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
