import { useCallback, useEffect, useRef, useState } from "react";
import { debounce, throttle } from "lodash";
import { IconButton, Separator, Skeleton, TextField } from "@radix-ui/themes";
import { SearchResult } from "./Result";
import { ArticleResItem } from "@/db";
import { request } from "@/helpers/request";
import { AxiosResponse } from "axios";
import { useHotkeys } from "react-hotkeys-hook";
import useInfiniteScroll from "./useInfiniteScroll";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { MainPanel } from "@/components/MainPanel";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

export const SearchPage = () => {
  const [isFetching, setIsFetching] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [resultList, setResultList] = useState<ArticleResItem[]>([]);
  const loadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  const debounceSearch = useCallback(
    debounce((query: string) => {
      setResultList([]);
      setCursor(1);

      getList({ query, cursor: 1 });
    }, 200),
    []
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value as string;

    setQuery(val);

    val && debounceSearch(val);
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

  const [lastElementRef] = useInfiniteScroll(hasMore ? () => getList({}) : () => {}, isFetching);

  const goPrev = useCallback(
    throttle(() => {
      console.warn("goPrev");
    }, 300),
    []
  );

  const goNext = useCallback(
    throttle(() => {
      console.warn("goNext");
    }, 300),
    []
  );

  useHotkeys("n", goNext);
  useHotkeys("Shift+n", goPrev);

  useEffect(() => {
    inputRef.current && inputRef.current.focus();
  }, []);

  return (
    <MainPanel>
      <div className="flex flex-col w-full h-[calc(100vh-theme(margin.4))] bg-card rounded-md">
        <div className="p-3 bg-background">
          <TextField.Root
            ref={inputRef}
            type="search"
            value={query}
            placeholder="Search content in your Lettura"
            onChange={handleSearch}
            className=""
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
        <Separator className="w-full" />
        <div className="overflow-auto flex-1">
          <div className="m-auto">
            <SearchResult query={query} resultList={resultList} />
            <div ref={loadRef}>
              {isFetching && (
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
            <div ref={lastElementRef}></div>
          </div>
        </div>
        <div className="p-4"></div>
      </div>
    </MainPanel>
  );
};
