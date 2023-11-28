import { useCallback, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useBearStore } from "@/stores";
import { throttle } from "lodash";
import { request } from "@/helpers/request";
import { AxiosResponse } from "axios";
import { ArticleResItem } from "@/db";

export interface SearchParams {
  query: string;
}

export const useSearchListHook = (props: { searchParams: SearchParams }) => {
  const { searchParams } = props;
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [resultList, setResultList] = useState<ArticleResItem[]>([]);
  const [cursor, setCursor] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);
  const loadRef = useRef<HTMLDivElement>(null);

  const getList = ({ query, cursor }: { query: string; cursor: number }) => {
    setLoading(true);

    request
      .get("/search", {
        params: {
          query: query.trim(),
        },
      })
      .then((res: AxiosResponse<ArticleResItem[]>) => {
        console.log("%c Line:15 🍎 res", "color:#ed9ec7", res);
        const list = res.data;

        setResultList(list);

        if (list.length === 0) {
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
    if (searchParams.query) {
      setResultList([]);
      setCursor(1);
      setHasMore(true);

      getList({ query: searchParams.query, cursor: 1 });
    }
  }, [searchParams.query]);

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
        if (entry.isIntersecting && !loading && hasMore && resultList.length) {
          console.log("interaction update cursor ====>");
          setCursor(cursor + 1);
          getList({ query: searchParams.query, cursor: cursor + 1 });
        } else if (entry.isIntersecting && resultList.length === 0) {
          setCursor(1);
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

  const goPrev = useCallback(
    throttle(() => {
      console.warn("goPrev");
      // store.goPreviousArticle();
    }, 300),
    []
  );

  const goNext = useCallback(
    throttle(() => {
      console.warn("goNext");
      // store.goNextArticle();
    }, 300),
    []
  );

  useHotkeys("n", goNext);
  useHotkeys("Shift+n", goPrev);

  return {
    getList,
    loading,
    hasMore,
    articleList: resultList,
    setLoading,
    listRef,
    loadRef,
  };
};
