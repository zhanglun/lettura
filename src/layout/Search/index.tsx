import { useCallback, useEffect, useRef, useState } from "react";
import { debounce, throttle } from "lodash";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SearchResult } from "./Result";
import { ArticleResItem } from "@/db";
import { request } from "@/helpers/request";
import { AxiosResponse } from "axios";
import { useHotkeys } from "react-hotkeys-hook";
import { Skeleton } from "@/components/ui/skeleton";
import clsx from "clsx";

export const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [resultList, setResultList] = useState<ArticleResItem[]>([]);
  const [cursor, setCursor] = useState(1);
  const loadRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const debounceSearch = useCallback(
    debounce((query: string) => {
      setResultList([]);

      getList({ query, cursor: 1 });
    }, 200),
    []
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value as string;
    setQuery(val);
    console.log("%c Line:35 🥔 val", "color:#33a5ff", val);

    val && debounceSearch(val);
  };

  const getList = useCallback((params: any) => {
    setLoading(true);
    const text = params.query || query;
    console.log("%c Line:41 🍕 query", "color:#ed9ec7", query);

    if (!text) {
      return;
    }

    request
      .get("/search", {
        params: {
          query: text.trim(),
          cursor: params.cursor || cursor,
        },
      })
      .then((res: AxiosResponse<ArticleResItem[]>) => {
        const list = res.data;

        setResultList((prevState) => [...prevState, ...list]);
        setCursor(cursor + 1);

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
  }, [query, cursor]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        console.log(entries[0].isIntersecting);
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

  return (
    <div className="h-[100vh] flex flex-col">
      <div className="p-4 bg-background">
        <Input type="search" placeholder="Search..." onChange={handleSearch} />
      </div>
      <Separator />
      <h2>Query: {query}</h2>
      <div className="overflow-auto flex-1">
        <SearchResult query={query} resultList={resultList} />
        <div ref={loadRef}>
          {loading ? "laoding" : ""}
          {loading && (
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
        <div ref={observerTarget}>2</div>
      </div>
      <div className="p-4"></div>
    </div>
  );
};
