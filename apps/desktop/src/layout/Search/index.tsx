import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosResponse } from "axios";
import { ArticleResItem, FeedResItem } from "@/db";
import { MainPanel } from "@/components/MainPanel";
import { View } from "../Article/View";
import { request } from "@/helpers/request";
import { showErrorToast } from "@/helpers/errorHandler";
import { loadFromStorage, saveToStorage } from "./utils";
import {
  PAGE_SIZE,
  STORAGE_KEY_SAVED,
  STORAGE_KEY_RECENT,
} from "./types";
import type { SavedSearch } from "./types";
import { SearchSidebar } from "./SearchSidebar";
import { SearchFilters } from "./SearchFilters";
import { SearchResults } from "./SearchResults";

export const SearchPage = () => {
  const { t } = useTranslation();
  const [isFetching, setIsFetching] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [resultList, setResultList] = useState<ArticleResItem[]>([]);
  const [currentArticle, setCurrentArticle] = useState<ArticleResItem | null>(
    null,
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [feedUuid, setFeedUuid] = useState("");
  const [feeds, setFeeds] = useState<FeedResItem[]>([]);

  const hasActiveFilters = Boolean(startDate || endDate || feedUuid);
  const selectedFeed = feeds.find((feed) => feed.uuid === feedUuid);

  const [isStarred, setIsStarred] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() =>
    loadFromStorage<SavedSearch[]>(STORAGE_KEY_SAVED, []),
  );
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    loadFromStorage<string[]>(STORAGE_KEY_RECENT, []),
  );

  const getList = useCallback(
    (nextCursor = 1, replace = false) => {
      const text = query.trim();
      if (!text || isFetching) return;

      setIsFetching(true);
      request
        .get("/search", {
          params: {
            query: text,
            cursor: nextCursor,
            limit: PAGE_SIZE,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            feed_uuid: feedUuid || undefined,
            is_starred: isStarred ? 1 : undefined,
          },
        })
        .then((res: AxiosResponse<ArticleResItem[]>) => {
          const list = res.data || [];
          setResultList((prev) => (replace ? list : [...prev, ...list]));
          setCursor(nextCursor + 1);
          setHasMore(list.length >= PAGE_SIZE);
        })
        .catch((err: any) => {
          showErrorToast(err, "Failed to search articles");
        })
        .finally(() => {
          setIsFetching(false);
        });
    },
    [endDate, feedUuid, isFetching, isStarred, query, startDate],
  );

  const trackRecentSearch = useCallback((text: string) => {
    const trimmed = text.trim().toLowerCase();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed);
      const next = [text.trim(), ...filtered].slice(0, 10);
      saveToStorage(STORAGE_KEY_RECENT, next);
      return next;
    });
  }, []);

  const saveCurrentSearch = useCallback(() => {
    const label = query.trim();
    if (!label) return;
    setSavedSearches((prev) => {
      if (prev.some((s) => s.label.toLowerCase() === label.toLowerCase())) return prev;
      const next = [{ label, count: resultList.length }, ...prev].slice(0, 20);
      saveToStorage(STORAGE_KEY_SAVED, next);
      return next;
    });
  }, [query, resultList.length]);

  const removeSavedSearch = useCallback((label: string) => {
    setSavedSearches((prev) => {
      const next = prev.filter((s) => s.label !== label);
      saveToStorage(STORAGE_KEY_SAVED, next);
      return next;
    });
  }, []);

  const applySearch = useCallback(
    (text: string) => {
      setQuery(text);
      setCursor(1);
      setHasMore(false);
      setResultList([]);
      setCurrentArticle(null);
      const trimmed = text.trim();
      if (!trimmed) return;
      setIsFetching(true);
      request
        .get("/search", {
          params: {
            query: trimmed,
            cursor: 1,
            limit: PAGE_SIZE,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            feed_uuid: feedUuid || undefined,
            is_starred: isStarred ? 1 : undefined,
          },
        })
        .then((res: AxiosResponse<ArticleResItem[]>) => {
          const list = res.data || [];
          setResultList(list);
          setCursor(2);
          setHasMore(list.length >= PAGE_SIZE);
          trackRecentSearch(trimmed);
        })
        .catch((err: any) => {
          showErrorToast(err, "Failed to search articles");
        })
        .finally(() => {
          setIsFetching(false);
        });
    },
    [endDate, feedUuid, isStarred, startDate, trackRecentSearch],
  );

  const runSearch = useCallback(() => {
    setCurrentArticle(null);
    setCursor(1);
    setHasMore(false);
    setResultList([]);
    const trimmed = query.trim();
    getList(1, true);
    trackRecentSearch(trimmed);
  }, [getList, query, trackRecentSearch]);

  useEffect(() => {
    const loadFeeds = async () => {
      try {
        const response = await request.get("/feeds");
        const allFeeds = (response.data || []).flatMap((item: FeedResItem) => {
          if (item.item_type === "folder") return item.children || [];
          return item.item_type === "feed" || item.item_type === "channel"
            ? [item]
            : [];
        });
        setFeeds(allFeeds);
      } catch (error) {
        showErrorToast(error, "Failed to load feeds");
      }
    };
    loadFeeds();
  }, []);

  const handleResetFilters = useCallback(() => {
    setIsStarred(false);
  }, []);

  const handleClearQuery = useCallback(() => {
    setQuery("");
    setResultList([]);
    setHasMore(false);
  }, []);

  return (
    <MainPanel>
      <div className="flex h-full w-full overflow-hidden bg-[var(--gray-1)]">
        <SearchSidebar
          savedSearches={savedSearches}
          recentSearches={recentSearches}
          onApplySearch={applySearch}
          onRemoveSavedSearch={removeSavedSearch}
        />

        <section
          className={
            currentArticle
              ? "flex w-[420px] shrink-0 flex-col border-r border-[var(--gray-5)] bg-[var(--color-panel-solid)]"
              : "flex min-w-0 flex-1 flex-col bg-[var(--color-panel-solid)]"
          }
        >
          <SearchFilters
            query={query}
            onQueryChange={setQuery}
            onSearch={runSearch}
            onSaveSearch={saveCurrentSearch}
            isStarred={isStarred}
            onResetFilters={handleResetFilters}
            onToggleStarred={() => setIsStarred((prev) => !prev)}
            startDate={startDate}
            endDate={endDate}
            feedUuid={feedUuid}
            feeds={feeds}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onFeedChange={setFeedUuid}
            hasActiveFilters={hasActiveFilters}
            currentArticle={currentArticle}
            onCloseArticle={() => setCurrentArticle(null)}
            onClearQuery={handleClearQuery}
          />

          <SearchResults
            resultList={resultList}
            isFetching={isFetching}
            hasMore={hasMore}
            query={query}
            selectedFeed={selectedFeed}
            onLoadMore={() => getList(cursor)}
            onOpenArticle={setCurrentArticle}
          />
        </section>

        {currentArticle ? (
          <View
            article={currentArticle}
            closable
            onClose={() => setCurrentArticle(null)}
          />
        ) : null}
      </div>
    </MainPanel>
  );
};
