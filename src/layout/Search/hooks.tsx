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
  const observerTarget = useRef<HTMLDivElement>(null);

  const getList = useCallback(
    (params: { query?: string; cursor?: number }) => {
      setLoading(true);
      const query = params.query?.trim() || searchParams.query.trim();

      console.log("%c Line:27 🌮 searchParams", "color:#7f2b82", searchParams);
      console.log("%c Line:26 🍇 query", "color:#fca650", query);
      console.log("%c Line:38 🍆 cursor", "color:#93c0a4", cursor);

      if (!query) {
        return;
      }

      request
        .get("/search", {
          params: {
            query: query,
            cursor: params.cursor || cursor,
          },
        })
        .then((res: AxiosResponse<ArticleResItem[]>) => {
          console.log("%c Line:15 🍎 res", "color:#ed9ec7", res);
          const list = res.data;

          setResultList((prev) => [...prev, ...list]);
          setCursor((prev) => prev + 1);

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
    },
    [cursor, searchParams]
  );

  useEffect(() => {
    if (searchParams.query) {
      setResultList([]);
      setCursor(1);
      setHasMore(true);
      // getList({ query: searchParams.query, cursor: 1 });
    }
  }, [searchParams.query]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        console.log(
          "%c Line:74 🍔 entries[0].isIntersecting",
          "color:#fca650",
          entries[0].isIntersecting
        );
        if (entries[0].isIntersecting) {
          getList({ query: searchParams.query });
        }
      },
      { threshold: 1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [observerTarget, searchParams.query]);

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
    observerTarget,
  };
};
