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
import useInfiniteScroll from "./useInfiniteScroll";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Icon } from "@/components/Icon";

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

  const [lastElementRef] = useInfiniteScroll(
    hasMore ? () => getList({}) : () => {},
    isFetching
  );

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
    <div className="flex flex-col h-[calc(100vh-theme(margin.4))] m-2 bg-card rounded-md">
      <div className="p-4">
        <h2 className="flex items-center gap-3 text-xl text-foreground tracking-tight font-bold cursor-pointer group">
          <Icon
            onClick={goBack}
            className="text-muted-foreground group-hover:text-foreground"
          >
            <ChevronLeft />
          </Icon>
          Search content in your Lettura
        </h2>
      </div>
      <div className="p-4 bg-background">
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search content..."
          onChange={handleSearch}
        />
      </div>
      <Separator />
      <div className="overflow-auto flex-1">
        <div className="max-w-[840px] m-auto py-4">
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
  );
};
