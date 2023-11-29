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

export const useSearchListHook = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [resultList, setResultList] = useState<ArticleResItem[]>([]);
  const [cursor, setCursor] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);
  const loadRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const getList = (params: { query?: string; cursor?: number }) => {
    setLoading(true);
    console.log("%c Line:26 🍇 query", "color:#fca650", query);
    console.log("%c Line:38 🍆 cursor", "color:#93c0a4", cursor);
    console.log("%c Line:37 🌽 params.cursor", "color:#ffdd4d", params.cursor);

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
        const list = res.data;

        console.log("%c Line:43 🍞 list", "color:#42b983", list);

        setResultList((prev) => [...prev, ...list]);
        console.log("%c Line:46 🥪 [...prev, ...list]", "color:#4fff4B",  [...list]);
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
  };

  useEffect(() => {
    if (query) {
      setResultList([]);
      setCursor(1);
      setHasMore(true);
      getList({ query, cursor: 1 });
    }
  }, [query]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        console.log(
          "%c Line:74 🍔 entries[0].isIntersecting",
          "color:#fca650",
          entries[0].isIntersecting
        );
        if (entries[0].isIntersecting) {
          getList({});
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
  }, [observerTarget]);

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
    query,
    setQuery,
    getList,
    loading,
    hasMore,
    resultList,
    setLoading,
    listRef,
    loadRef,
    observerTarget,
  };
};
