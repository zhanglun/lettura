import { useCallback, useEffect, useRef, useState } from "react";
import { debounce, get } from "lodash";
import { IconButton, Skeleton, TextField } from "@radix-ui/themes";
import { AxiosResponse } from "axios";
import { X } from "lucide-react";
import clsx from "clsx";
import { SearchResult } from "./Result";
import { ArticleResItem } from "@/db";
import { request } from "@/helpers/request";
import useInfiniteScroll from "./useInfiniteScroll";
import { MainPanel } from "@/components/MainPanel";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { View } from "../Article/View";

export const SearchPage = () => {
  const [isFetching, setIsFetching] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [resultList, setResultList] = useState<ArticleResItem[]>([]);
  const loadRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentArticle, setCurrentArticle] = useState<ArticleResItem | null>(null);

  const debounceSearch = useCallback(
    debounce((query: string) => {
      setResultList([]);
      setCursor(1);

      getList({ query, cursor: 1 });
    }, 200),
    []
  );

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const val = (e.target as HTMLInputElement).value as string;

    if (e.key === "Enter" && val) {
      debounceSearch(val);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = (e.target as HTMLInputElement).value as string;

    setQuery(val);
  };

  const handleClose = () => {
    setCurrentArticle(null);
  };

  const clearQuery = () => {
    setQuery("");
    setResultList([]);

    inputRef.current?.focus();
  };

  const getList = (params: any) => {
    const text = params.query || query;

    if (!text || !hasMore) {
      return;
    }

    if (!hasMore) {
      return;
    }

    setIsFetching(true);

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
        setCursor((prev) => prev + 1);
        setHasMore(res.data.length > 0);
      })
      .finally(() => {
        setIsFetching(false);
      })
      .catch((err: any) => {
        console.log("%c Line:71 🍎 err", "color:#ffdd4d", err);
      });
  };

  function loadMore() {
    getList({ cursor: cursor });
  }

  useEffect(() => {
    inputRef.current && inputRef.current.focus();
  }, []);

  return (
    <MainPanel>
      <div className="w-full h-[calc(100vh-theme(margin.4))] flex flex-row">
        <div
          className={clsx("flex flex-col", {
            "w-full": !currentArticle,
            "w-[400px] border-r": currentArticle,
          })}
        >
          <div className="h-[var(--app-toolbar-height)] px-2 pt-2 bg-background border-b">
            <TextField.Root
              ref={inputRef}
              type="search"
              value={query}
              placeholder="Search content in your Lettura"
              onChange={handleChange}
              onKeyUp={handleSearch}
            >
              <TextField.Slot>
                <MagnifyingGlassIcon height="16" width="16" />
              </TextField.Slot>
              {query.length > 0 && (
                <TextField.Slot>
                  <IconButton size="1" variant="ghost" onClick={clearQuery}>
                    <X height="14" width="14" />
                  </IconButton>
                </TextField.Slot>
              )}
            </TextField.Root>
          </div>
          <div className="relative flex-1 overflow-auto scrollbar-gutter" ref={scrollRef}>
              <SearchResult
                resultList={resultList}
                height={(scrollRef.current?.clientHeight || 16) - 16}
                onArticleClick={setCurrentArticle}
                hasNextPage={hasMore}
                moreItemsLoading={isFetching}
                loadMore={loadMore}
              />
              {/* <div ref={loadRef}>
                {isFetching && (
                  <div className="p-3 grid gap-1 relative">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                )}
              </div> */}
              {/* <div ref={lastElementRef}></div> */}
          </div>
        </div>
        <div className="flex-1">
          {currentArticle && <View article={currentArticle} closable onClose={handleClose} />}
        </div>
      </div>
    </MainPanel>
  );
};
