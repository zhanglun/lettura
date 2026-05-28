import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { AxiosResponse } from "axios";
import { ArticleResItem, FeedResItem } from "@/db";
import { useBearStore } from "@/stores/index";
import type { TopicItem } from "@/stores/topicSlice";
import { useShallow } from "zustand/react/shallow";
import { MainPanel } from "@/components/MainPanel";
import { View } from "../Article/View";
import { RouteConfig } from "@/config";
import { request } from "@/helpers/request";
import { showErrorToast } from "@/helpers/errorHandler";
import { loadFromStorage, saveToStorage } from "./utils";
import {
  PAGE_SIZE,
  STORAGE_KEY_SAVED,
  STORAGE_KEY_RECENT,
} from "./types";
import type { SavedSearch, SignalSearchResult, TopicSearchResult } from "./types";
import { SearchSidebar } from "./SearchSidebar";
import { SearchFilters } from "./SearchFilters";
import { SearchResults } from "./SearchResults";
import { SearchInsightPanel } from "./SearchInsightPanel";

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
  const [highSignal, setHighSignal] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() =>
    loadFromStorage<SavedSearch[]>(STORAGE_KEY_SAVED, []),
  );
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    loadFromStorage<string[]>(STORAGE_KEY_RECENT, []),
  );
  const [signalResults, setSignalResults] = useState<SignalSearchResult[]>([]);
  const [topicResults, setTopicResults] = useState<TopicSearchResult[]>([]);

  const { topics, fetchTopics } = useBearStore(
    useShallow((state) => ({
      topics: state.topics,
      fetchTopics: state.fetchTopics,
    })),
  );
  const relatedTopics: TopicItem[] = useMemo(() => {
    if (!query.trim()) {
      return topics.slice(0, 5);
    }
    const q = query.toLowerCase().trim();
    const scored = topics
      .map((topic) => {
        const title = (topic.title || "").toLowerCase();
        const desc = (topic.description || "").toLowerCase();
        let score = 0;
        if (title.includes(q)) score += 3;
        if (desc.includes(q)) score += 1;
        const words = q.split(/\s+/);
        for (const word of words) {
          if (title.includes(word)) score += 1;
          if (desc.includes(word)) score += 0.5;
        }
        return { topic, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.topic);
    return scored.length > 0 ? scored.slice(0, 5) : topics.slice(0, 5);
  }, [topics, query]);

  const searchInsight = useMemo(() => {
    const totalResults = resultList.length + signalResults.length + topicResults.length;
    if (!query.trim() || totalResults === 0) {
      return null;
    }

    const parts: string[] = [];
    const topicNames = topicResults.map((t) => t.title).filter(Boolean);
    const signalTopics = signalResults
      .map((s) => s.topic_title)
      .filter(Boolean) as string[];
    const uniqueTopics = [...new Set([...topicNames, ...signalTopics])];
    if (uniqueTopics.length > 0) {
      parts.push(
        t("search.insight.topics_found", {
          count: uniqueTopics.length,
          topics: uniqueTopics.slice(0, 2).join("、"),
        }),
      );
    }

    if (signalResults.length > 0) {
      const totalSources = signalResults.reduce(
        (sum, s) => sum + s.source_count,
        0,
      );
      parts.push(
        t("search.insight.signals_found", {
          count: signalResults.length,
          sources: totalSources,
        }),
      );
    }

    const feedNames = [
      ...new Set(resultList.map((a) => a.feed_title).filter(Boolean)),
    ];
    if (feedNames.length > 0 && feedNames.length <= 3) {
      parts.push(
        t("search.insight.sources_found", {
          sources: feedNames.join("、"),
        }),
      );
    }

    return {
      summary: t("search.insight.summary", {
        total: totalResults,
        query: query.trim(),
      }),
      details: parts,
    };
  }, [query, resultList, signalResults, topicResults, t]);

  const navigate = useNavigate();

  const searchSignalsAndTopics = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setSignalResults([]);
      setTopicResults([]);
      return;
    }
    try {
      const [signals, topics] = await Promise.all([
        invoke<SignalSearchResult[]>("search_signals", { query: q }),
        invoke<TopicSearchResult[]>("search_topics", { query: q }),
      ]);
      setSignalResults(signals);
      setTopicResults(topics);
    } catch {
      setSignalResults([]);
      setTopicResults([]);
    }
  }, []);

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
            min_relevance: highSignal ? 0.7 : undefined,
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
    [endDate, feedUuid, isFetching, isStarred, highSignal, query, startDate],
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
      searchSignalsAndTopics(trimmed);
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
            min_relevance: highSignal ? 0.7 : undefined,
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
    [endDate, feedUuid, isStarred, highSignal, startDate, trackRecentSearch, searchSignalsAndTopics],
  );

  const runSearch = useCallback(() => {
    setCurrentArticle(null);
    setCursor(1);
    setHasMore(false);
    setResultList([]);
    const trimmed = query.trim();
    if (trimmed) searchSignalsAndTopics(trimmed);
    getList(1, true);
    trackRecentSearch(trimmed);
  }, [getList, query, trackRecentSearch, searchSignalsAndTopics]);

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
    if (topics.length === 0) {
      fetchTopics("active", "last_updated");
    }
  }, []);

  const handleResetFilters = useCallback(() => {
    setIsStarred(false);
    setHighSignal(false);
  }, []);

  const handleClearQuery = useCallback(() => {
    setQuery("");
    setResultList([]);
    setHasMore(false);
  }, []);

  const handleClearDateFilters = useCallback(() => {
    setStartDate("");
    setEndDate("");
  }, []);

  const handleSetDateRange = useCallback((start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  const handleNavigateToToday = useCallback(() => {
    navigate(RouteConfig.LOCAL_TODAY);
  }, [navigate]);

  const handleNavigateToTopic = useCallback(
    (uuid: string) => {
      navigate(`/local/topics/${uuid}`);
    },
    [navigate],
  );

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
            highSignal={highSignal}
            onResetFilters={handleResetFilters}
            onToggleStarred={() => setIsStarred((prev) => !prev)}
            onToggleHighSignal={() => setHighSignal((prev) => !prev)}
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
            signalResults={signalResults}
            topicResults={topicResults}
            isFetching={isFetching}
            hasMore={hasMore}
            query={query}
            selectedFeed={selectedFeed}
            onLoadMore={() => getList(cursor)}
            onOpenArticle={setCurrentArticle}
            onNavigateToToday={handleNavigateToToday}
            onNavigateToTopic={handleNavigateToTopic}
          />
        </section>

        {currentArticle ? (
          <View
            article={currentArticle}
            closable
            onClose={() => setCurrentArticle(null)}
          />
        ) : (
          <SearchInsightPanel
            searchInsight={searchInsight}
            relatedTopics={relatedTopics}
            isStarred={isStarred}
            hasActiveFilters={hasActiveFilters}
            onToggleStarred={() => setIsStarred((prev) => !prev)}
            onSetDateRange={handleSetDateRange}
            onClearFilters={handleClearDateFilters}
            onNavigateToTopic={handleNavigateToTopic}
          />
        )}
      </div>
    </MainPanel>
  );
};
