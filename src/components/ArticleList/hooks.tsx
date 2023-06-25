import { useEffect, useRef, useState } from "react";
import { useBearStore } from "@/hooks/useBearStore";
import { useShortcut } from "@/hooks/useShortcut";

export const useArticleListHook = (props: { feedUuid: string | null }) => {
  const { feedUuid } = props;
  const store = useBearStore((state) => ({
    currentFilter: state.currentFilter,
    setArticleList: state.setArticleList,
    articleList: state.articleList,
    getArticleList: state.getArticleList,

    goPreviousArticle: state.goPreviousArticle,
    goNextArticle: state.goNextArticle,
  }));
  const { registerShortcut, unregisterShortcut } = useShortcut();

  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const loadRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState(1);
  const getList = () => {
    const filter: { read_status?: number; cursor: number; limit?: number } = {
      read_status: store.currentFilter.id,
      cursor,
      limit: 12,
    };

    if (feedUuid === null) {
      return;
    }

    setLoading(true);

    store
      .getArticleList(feedUuid, filter)
      .then((res: any) => {
        if (res.length === 0) {
          setHasMore(false)
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
    if (feedUuid) {
      store.setArticleList([]);
      setCursor(1);
      setHasMore(true);
      getList();
    }
  }, [feedUuid, store.currentFilter]);

  useEffect(() => {
    getList();
  }, [cursor]);

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
          setCursor((cursor) => cursor + 1);
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
    console.warn('goPrev')
    store.goPreviousArticle();
  }

  function goNext() {
    console.warn('goNext')
    store.goNextArticle();
  }

  useEffect(() => {
    registerShortcut('n', goNext)
    registerShortcut('Shift+n', goPrev)

    return () => {
      unregisterShortcut('n');
      unregisterShortcut('Shift+n');
    }

  }, []);

  return {
    getList,
    loading,
    hasMore,
    articleList: store.articleList,
    setLoading,
    listRef,
    loadRef,
  };
};
