import { useCallback, useEffect, useRef, useState } from "react";
import { useMatch } from "react-router-dom";
import { useHotkeys } from "react-hotkeys-hook";
import { useBearStore } from "@/stores";
import { RouteConfig } from "@/config";
import { useArticle } from "./useArticle";

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
  uuid?: string;
  type?: string;
}) => {
  const { uuid, type } = props;

  const isToday = useMatch(RouteConfig.LOCAL_TODAY);
  const isAll = useMatch(RouteConfig.LOCAL_ALL);

  const store = useBearStore((state) => ({
    currentFilter: state.currentFilter,
    setArticleList: state.setArticleList,
    articleList: state.articleList,
    getArticleList: state.getArticleList,
    getTodayArticleList: state.getTodayArticleList,
    getAllArticleList: state.getAllArticleList,
    feed: state.feed,

    goPreviousArticle: state.goPreviousArticle,
    goNextArticle: state.goNextArticle,
    currentIdx: state.currentIdx,
    cursor: state.cursor,
    setCursor: state.setCursor,
  }));

  const [feedUuid, setFeedUuid] = useState(uuid);
  const [feedType, setFeedType] = useState(type);
  const listRef = useRef<HTMLDivElement>(null);
  const loadRef = useRef<HTMLDivElement>(null);

  const {loading, hasMore, getList} = useArticle({ feedUuid: uuid, feedType: type});


  useEffect(() => {
    setFeedUuid(uuid);
  }, [uuid]);

  useEffect(() => {
    setFeedType(type);
  }, [type]);

  useEffect(() => {
    if (feedUuid || isToday || isAll) {
      store.setArticleList([]);
      getList({ cursor: 1, feed_uuid: store.feed?.uuid, item_type: store.feed?.item_type });
    }
  }, [feedUuid, store.currentFilter, store.feed, isToday, isAll]);

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
          getList({ cursor: store.cursor + 1 });
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
      const [shouldLoad] = store.goNextArticle();

      if (shouldLoad) {
        getList({ cursor: store.cursor + 1 });
      }
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
    listRef,
    loadRef,
    isToday,
    isAll,
    setFeedUuid,
    setFeedType,
  };
};
