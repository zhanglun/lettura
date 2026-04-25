import { useCallback, useEffect, useRef, useState } from "react";
import { debounce, get } from "lodash";
import {
  IconButton,
  Skeleton,
  TextField,
  Select,
  Text,
  Flex,
  Button,
} from "@radix-ui/themes";
import { AxiosResponse } from "axios";
import { X, Calendar, Filter } from "lucide-react";
import clsx from "clsx";
import { SearchResult } from "./Result";
import { ArticleResItem, FeedResItem } from "@/db";
import { request } from "@/helpers/request";
import useInfiniteScroll from "./useInfiniteScroll";
import { MainPanel } from "@/components/MainPanel";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { View } from "../Article/View";
import { showErrorToast } from "@/helpers/errorHandler";

export const SearchPage = () => {
  const [isFetching, setIsFetching] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [resultList, setResultList] = useState<ArticleResItem[]>([]);
  const loadRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentArticle, setCurrentArticle] = useState<ArticleResItem | null>(
    null,
  );
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [feedUuid, setFeedUuid] = useState<string>("");
  const [feeds, setFeeds] = useState<FeedResItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const debounceSearch = useCallback(
    debounce((query: string) => {
      setResultList([]);
      setCursor(1);

      getList({ query, cursor: 1 });
    }, 200),
    [],
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

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setFeedUuid("");
    setResultList([]);
    setCursor(1);

    if (query) {
      getList({ query, cursor: 1 });
    }
  };

  const hasActiveFilters = startDate || endDate || feedUuid;

  useEffect(() => {
    if (query && hasActiveFilters) {
      setResultList([]);
      setCursor(1);
      getList({ query, cursor: 1 });
    }
  }, [query, hasActiveFilters]);

  useEffect(() => {
    const loadFeeds = async () => {
      try {
        const response = await request.get("/feeds");
        if (response.data) {
          const allFeeds = response.data.flatMap((item: FeedResItem) => {
            if (item.item_type === "folder") {
              return item.children || [];
            }
            return item.item_type === "feed" ? [item] : [];
          });
          setFeeds(allFeeds);
        }
      } catch (error) {
        showErrorToast(error, "Failed to load feeds");
      }
    };
    loadFeeds();
  }, []);

  const getList = (params: any) => {
    const text = params.query || query;

    if (!(text && hasMore)) {
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
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          feed_uuid: feedUuid || undefined,
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
        showErrorToast(err, "Failed to search articles");
      });
  };

  function loadMore() {
    getList({ cursor: cursor });
  }

  useEffect(() => {
    inputRef.current?.focus?.();
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
            <Flex gap="2" align="center" className="mt-2">
              <IconButton
                size="1"
                variant={showFilters ? "surface" : "ghost"}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter height="14" width="14" />
              </IconButton>
              {hasActiveFilters && (
                <>
                  {startDate && (
                    <Text
                      size="1"
                      as="span"
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded"
                    >
                      From: {startDate}
                      <X
                        height="10"
                        width="10"
                        className="ml-1 inline cursor-pointer"
                        onClick={() => setStartDate("")}
                      />
                    </Text>
                  )}
                  {endDate && (
                    <Text
                      size="1"
                      as="span"
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded"
                    >
                      To: {endDate}
                      <X
                        height="10"
                        width="10"
                        className="ml-1 inline cursor-pointer"
                        onClick={() => setEndDate("")}
                      />
                    </Text>
                  )}
                  {feedUuid && (
                    <Text
                      size="1"
                      as="span"
                      className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded"
                    >
                      {feeds.find((f) => f.uuid === feedUuid)?.title}
                      <X
                        height="10"
                        width="10"
                        className="ml-1 inline cursor-pointer"
                        onClick={() => setFeedUuid("")}
                      />
                    </Text>
                  )}
                  <Button size="1" variant="outline" onClick={clearFilters}>
                    <X height="12" width="12" className="mr-1" />
                    Clear all
                  </Button>
                </>
              )}
            </Flex>
            {showFilters && (
              <Flex gap="3" direction="column" className="mt-3 pb-2">
                <Flex gap="2" direction="column">
                  <Text size="1" color="gray">
                    Date Range
                  </Text>
                  <Flex gap="2" align="center">
                    <Flex gap="2" align="center" className="flex-1">
                      <Calendar height="14" width="14" />
                      <TextField.Root
                        size="1"
                        type="date"
                        value={startDate}
                        onChange={(e) =>
                          setStartDate((e.target as HTMLInputElement).value)
                        }
                      />
                    </Flex>
                    <Text size="1">to</Text>
                    <Flex gap="2" align="center" className="flex-1">
                      <Calendar height="14" width="14" />
                      <TextField.Root
                        size="1"
                        type="date"
                        value={endDate}
                        onChange={(e) =>
                          setEndDate((e.target as HTMLInputElement).value)
                        }
                      />
                    </Flex>
                  </Flex>
                </Flex>
                <Flex gap="2" direction="column">
                  <Text size="1" color="gray">
                    Feed
                  </Text>
                  <Select.Root value={feedUuid} onValueChange={setFeedUuid}>
                    <Select.Trigger>
                      <Text as="span" color="gray">
                        {feedUuid
                          ? feeds.find((f) => f.uuid === feedUuid)?.title
                          : "All feeds"}
                      </Text>
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="">All feeds</Select.Item>
                      {feeds.map((feed) => (
                        <Select.Item key={feed.uuid} value={feed.uuid}>
                          {feed.title}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Flex>
                {(startDate || endDate || feedUuid) && (
                  <Text size="1" color="gray">
                    Filters: {startDate && `From ${startDate} `}
                    {endDate && `to ${endDate} `}
                    {feedUuid &&
                      `| Feed: ${
                        feeds.find((f) => f.uuid === feedUuid)?.title
                      }`}
                  </Text>
                )}
              </Flex>
            )}
          </div>
          <div
            className="relative flex-1 overflow-auto scrollbar-gutter"
            ref={scrollRef}
          >
            {hasActiveFilters && (
              <Flex
                gap="2"
                align="center"
                className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border-b text-sm"
              >
                <Text color="gray">Showing results for: "{query}"</Text>
                {startDate && (
                  <Text
                    as="span"
                    className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs"
                  >
                    Date: {startDate} to {endDate || "now"}
                  </Text>
                )}
                {feedUuid && (
                  <Text
                    as="span"
                    className="px-2 py-0.5 bg-green-100 dark:bg-green-900 rounded text-xs"
                  >
                    {feeds.find((f) => f.uuid === feedUuid)?.title}
                  </Text>
                )}
                <Text color="gray">({resultList.length} results)</Text>
              </Flex>
            )}
            <SearchResult
              resultList={resultList}
              height={
                (scrollRef.current?.clientHeight || 16) -
                16 -
                (hasActiveFilters ? 40 : 0)
              }
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
          {currentArticle && (
            <View article={currentArticle} closable onClose={handleClose} />
          )}
        </div>
      </div>
    </MainPanel>
  );
};
