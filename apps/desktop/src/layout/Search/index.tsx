import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  Bookmark,
  Calendar,
  Clock,
  FileSearch,
  Filter,
  Rss,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { Avatar, Button, IconButton, TextField } from "@radix-ui/themes";
import { AxiosResponse } from "axios";
import { ArticleResItem, FeedResItem } from "@/db";
import { useBearStore } from "@/stores/index";
import type { TopicItem } from "@/stores/topicSlice";
import { useShallow } from "zustand/react/shallow";
import { MainPanel } from "@/components/MainPanel";
import { View } from "../Article/View";
import { RouteConfig } from "@/config";
import { request } from "@/helpers/request";
import { getFeedLogo } from "@/helpers/parseXML";
import { showErrorToast } from "@/helpers/errorHandler";

interface SignalSearchResult {
  signal_title: string;
  summary: string;
  confidence: number;
  source_count: number;
  article_count: number;
  topic_title: string | null;
  topic_uuid: string | null;
}

interface TopicSearchResult {
  uuid: string;
  title: string;
  description: string;
  article_count: number;
  source_count: number;
  is_following: number;
}

const PAGE_SIZE = 20;

const STORAGE_KEY_SAVED = "lettura_saved_searches";
const STORAGE_KEY_RECENT = "lettura_recent_searches";

interface SavedSearch {
  label: string;
  count: number;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable – silently ignore
  }
}

function stripHtml(value = "") {
  return value.replace(/(<([^>]+)>)/gi, "").replace(/\s+/g, " ").trim();
}

function formatTime(date?: string) {
  if (!date) return "";
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true });
  } catch {
    return date;
  }
}

function SearchChip(props: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={
        props.active
          ? "inline-flex items-center gap-1 rounded-full border border-[var(--accent-8)] bg-[var(--accent-a3)] px-3 py-1.5 text-xs font-medium text-[var(--accent-11)]"
          : "inline-flex items-center gap-1 rounded-full border border-[var(--gray-5)] bg-[var(--color-panel-solid)] px-3 py-1.5 text-xs font-medium text-[var(--gray-11)] hover:bg-[var(--gray-a3)]"
      }
    >
      {props.children}
    </button>
  );
}

function SearchResultCard(props: {
  article: ArticleResItem;
  query: string;
  onOpen: (article: ArticleResItem) => void;
}) {
  const { t } = useTranslation();
  const { article, query, onOpen } = props;
  const description = stripHtml(article.description || article.content || "");
  const match = query.trim();
  const hasMatch = match && description.toLowerCase().includes(match.toLowerCase());
  const before = hasMatch
    ? description.slice(0, description.toLowerCase().indexOf(match.toLowerCase()))
    : description;
  const hit = hasMatch
    ? description.slice(
        description.toLowerCase().indexOf(match.toLowerCase()),
        description.toLowerCase().indexOf(match.toLowerCase()) + match.length,
      )
    : "";
  const after = hasMatch
    ? description.slice(
        description.toLowerCase().indexOf(match.toLowerCase()) + match.length,
      )
    : "";

  return (
    <button
      type="button"
      onClick={() => onOpen(article)}
      className="group w-full rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-4 text-left transition hover:border-[var(--accent-7)] hover:bg-[var(--accent-a2)]"
    >
      <div className="mb-2 flex items-center gap-2">
        <Avatar
          size="1"
          src={article.feed_logo || getFeedLogo(article.feed_url)}
          fallback={article.feed_title?.slice(0, 1) || "L"}
          className="rounded"
        />
        <span className="text-xs font-medium text-[var(--gray-11)]">
          {article.feed_title || t("search.unknown_feed")}
        </span>
        {article.starred === 1 && (
          <span className="rounded-full bg-[var(--amber-a3)] px-2 py-0.5 text-[10px] font-medium text-[var(--amber-11)]">
            {t("search.filter.starred")}
          </span>
        )}
        <span className="ml-auto text-xs text-[var(--gray-10)]">
          {formatTime(article.create_date)}
        </span>
      </div>
      <div className="line-clamp-2 text-sm font-semibold leading-6 text-[var(--gray-12)]">
        {article.title}
      </div>
      <p className="mt-2 line-clamp-3 text-xs leading-5 text-[var(--gray-11)]">
        {hasMatch ? (
          <>
            {before.slice(-120)}
            <mark className="rounded bg-[var(--amber-a4)] px-1 text-[var(--amber-12)]">
              {hit}
            </mark>
            {after.slice(0, 220)}
          </>
        ) : (
          description || t("search.no_summary")
        )}
      </p>
    </button>
  );
}

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

  return (
    <MainPanel>
      <div className="flex h-full w-full overflow-hidden bg-[var(--gray-1)]">
        <aside className="hidden w-[220px] shrink-0 flex-col border-r border-[var(--gray-5)] bg-[var(--gray-2)] md:flex">
          <div className="border-b border-[var(--gray-5)] p-4">
            <div className="text-sm font-semibold text-[var(--gray-12)]">
              Search
            </div>
            <div className="mt-1 text-xs leading-5 text-[var(--gray-10)]">
              {t("search.sidebar.subtitle")}
            </div>
          </div>
          <div className="flex-1 overflow-auto p-3">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
              {t("search.sidebar.saved")}
            </div>
            <div className="grid gap-1">
              {savedSearches.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-[var(--gray-9)]">
                  {t("search.sidebar.no_saved")}
                </div>
              ) : (
                savedSearches.map((item) => (
                  <div key={item.label} className="group flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => applySearch(item.label)}
                      className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-[var(--gray-11)] hover:bg-[var(--gray-a3)]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-9)]" />
                      <span className="truncate">{item.label}</span>
                      <span className="ml-auto shrink-0 text-[10px] text-[var(--gray-9)]">
                        {item.count}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSavedSearch(item.label)}
                      className="hidden shrink-0 rounded p-0.5 text-[var(--gray-9)] hover:text-[var(--gray-11)] group-hover:block"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
              {t("search.sidebar.recent")}
            </div>
            {recentSearches.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-[var(--gray-9)]">
                {t("search.sidebar.no_recent")}
              </div>
            ) : (
              recentSearches.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => applySearch(item)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-[var(--gray-11)] hover:bg-[var(--gray-a3)]"
                >
                  <Clock size={12} />
                  {item}
                </button>
              ))
            )}
          </div>
        </aside>

        <section
          className={
            currentArticle
              ? "flex w-[420px] shrink-0 flex-col border-r border-[var(--gray-5)] bg-[var(--color-panel-solid)]"
              : "flex min-w-0 flex-1 flex-col bg-[var(--color-panel-solid)]"
          }
        >
          <div className="border-b border-[var(--gray-5)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-[var(--gray-12)]">
                  Search
                </h1>
                <p className="mt-1 text-sm text-[var(--gray-10)]">
                  {t("search.header.subtitle")}
                </p>
              </div>
              {currentArticle && (
                <IconButton
                  variant="ghost"
                  color="gray"
                  onClick={() => setCurrentArticle(null)}
                >
                  <X size={16} />
                </IconButton>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <TextField.Root
                className="flex-1"
                size="3"
                value={query}
                placeholder="Search content in your Lettura"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") runSearch();
                }}
              >
                <TextField.Slot>
                  <Search size={16} />
                </TextField.Slot>
                {query && (
                  <TextField.Slot>
                    <IconButton
                      size="1"
                      variant="ghost"
                      onClick={() => {
                        setQuery("");
                        setResultList([]);
                        setHasMore(false);
                      }}
                    >
                      <X size={14} />
                    </IconButton>
                  </TextField.Slot>
                )}
              </TextField.Root>
              <Button size="3" onClick={runSearch} disabled={!query.trim()}>
                {t("search.button")}
              </Button>
              <IconButton
                size="3"
                variant="outline"
                color="gray"
                disabled={!query.trim()}
                onClick={saveCurrentSearch}
                title={t("search.save_search")}
              >
                <Star size={16} />
              </IconButton>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <SearchChip
                active={!isStarred && !highSignal}
                onClick={() => {
                  setIsStarred(false);
                  setHighSignal(false);
                }}
              >
                {t("search.filter.all")}
              </SearchChip>
              <SearchChip
                active={isStarred}
                onClick={() => setIsStarred((prev) => !prev)}
              >
                <Bookmark size={12} />
                {t("search.filter.starred")}
              </SearchChip>
              <SearchChip
                active={highSignal}
                onClick={() => setHighSignal((prev) => !prev)}
              >
                <Sparkles size={12} />
                {t("search.filter.high_signal")}
              </SearchChip>
              <SearchChip active={hasActiveFilters}>
                <Filter size={12} />
                {t("search.filter.advanced")}
              </SearchChip>
              <div className="ml-auto flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="h-8 rounded-md border border-[var(--gray-5)] bg-transparent px-2 text-xs text-[var(--gray-11)]"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="h-8 rounded-md border border-[var(--gray-5)] bg-transparent px-2 text-xs text-[var(--gray-11)]"
                />
                <select
                  value={feedUuid}
                  onChange={(event) => setFeedUuid(event.target.value)}
                  className="h-8 max-w-[160px] rounded-md border border-[var(--gray-5)] bg-transparent px-2 text-xs text-[var(--gray-11)]"
                >
                  <option value="">{t("search.filter.all_sources")}</option>
                  {feeds.map((feed) => (
                    <option key={feed.uuid} value={feed.uuid}>
                      {feed.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-5">
            <div className="mb-3 flex items-center justify-between text-xs text-[var(--gray-10)]">
              <span>
                {resultList.length > 0
                  ? t("search.result_count", { count: resultList.length })
                  : query
                    ? t("search.hint_enter")
                    : t("search.hint_type")}
              </span>
              {selectedFeed && <span>{t("search.source_label", { title: selectedFeed.title })}</span>}
            </div>

            {signalResults.length > 0 && (
              <div className="mb-4">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
                  {t("search.section.signals")}
                </div>
                <div className="grid gap-2">
                  {signalResults.map((signal, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-3 cursor-pointer transition-colors hover:border-[var(--gray-7)] hover:bg-[var(--gray-a2)]"
                      onClick={() => navigate(RouteConfig.LOCAL_TODAY)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[var(--gray-12)]">{signal.signal_title}</span>
                        <span className="text-xs text-[var(--gray-9)]">{signal.article_count} articles · {signal.source_count} sources</span>
                      </div>
                      {signal.summary && (
                        <p className="text-xs text-[var(--gray-10)] line-clamp-2">{signal.summary}</p>
                      )}
                      {signal.topic_title && (
                        <span className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-a3)] text-[var(--accent-11)]">
                          {signal.topic_title}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {topicResults.length > 0 && (
              <div className="mb-4">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
                  {t("search.section.topics")}
                </div>
                <div className="grid gap-2">
                  {topicResults.map((topic) => (
                    <div
                      key={topic.uuid}
                      className="rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-3 cursor-pointer transition-colors hover:border-[var(--gray-7)] hover:bg-[var(--gray-a2)]"
                      onClick={() => navigate(`/local/topics/${topic.uuid}`)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[var(--gray-12)]">{topic.title}</span>
                        <span className="text-xs text-[var(--gray-9)]">{topic.article_count} articles · {topic.source_count} sources</span>
                      </div>
                      {topic.description && (
                        <p className="text-xs text-[var(--gray-10)] line-clamp-2">{topic.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resultList.length === 0 && isFetching ? (
              <div className="grid gap-3">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-4"
                  >
                    <div className="mb-3 h-3 w-32 rounded bg-[var(--gray-a4)]" />
                    <div className="mb-2 h-4 w-3/4 rounded bg-[var(--gray-a4)]" />
                    <div className="h-3 w-full rounded bg-[var(--gray-a3)]" />
                  </div>
                ))}
              </div>
            ) : resultList.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-[var(--gray-6)] bg-[var(--gray-a2)] p-8 text-center">
                <FileSearch
                  size={38}
                  strokeWidth={1.5}
                  className="text-[var(--gray-9)]"
                />
                <h2 className="mt-4 text-base font-semibold text-[var(--gray-12)]">
                  {t("search.empty.title")}
                </h2>
                <p className="mt-2 max-w-[360px] text-sm leading-6 text-[var(--gray-10)]">
                  {t("search.empty.subtitle")}
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {resultList.map((article) => (
                  <SearchResultCard
                    key={article.uuid}
                    article={article}
                    query={query}
                    onOpen={setCurrentArticle}
                  />
                ))}
                {hasMore && (
                  <Button
                    variant="surface"
                    color="gray"
                    loading={isFetching}
                    onClick={() => getList(cursor)}
                  >
                    {t("search.load_more")}
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>

        {currentArticle ? (
          <View
            article={currentArticle}
            closable
            onClose={() => setCurrentArticle(null)}
          />
        ) : (
          <aside className="hidden w-[280px] shrink-0 overflow-auto border-l border-[var(--gray-5)] bg-[var(--gray-2)] p-4 lg:block">
            <div className="mb-5">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
                {t("search.insight.title")}
              </div>
              <div className="rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-3">
                {searchInsight ? (
                  <>
                    <div className="text-sm font-semibold text-[var(--gray-12)]">
                      {searchInsight.summary}
                    </div>
                    {searchInsight.details.length > 0 && (
                      <p className="mt-2 text-xs leading-5 text-[var(--gray-11)]">
                        {searchInsight.details.join("；")}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-sm font-semibold text-[var(--gray-12)]">
                      {t("search.insight.title_text")}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[var(--gray-11)]">
                      {t("search.insight.description")}
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="mb-5">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
                {t("search.quick_filter.title")}
              </div>
              <div className="grid gap-2">
                <SearchChip
                  active={hasActiveFilters}
                  onClick={() => {
                    if (hasActiveFilters) {
                      setStartDate("");
                      setEndDate("");
                    } else {
                      const now = new Date();
                      const thirtyDaysAgo = new Date(
                        now.getTime() - 30 * 24 * 60 * 60 * 1000,
                      );
                      setStartDate(thirtyDaysAgo.toISOString().split("T")[0]);
                      setEndDate(now.toISOString().split("T")[0]);
                    }
                  }}
                >
                  <Calendar size={12} />
                  {t("search.quick_filter.last_30_days")}
                </SearchChip>
                <SearchChip>
                  <Rss size={12} />
                  {t("search.quick_filter.all_sources")}
                </SearchChip>
                <SearchChip
                  active={isStarred}
                  onClick={() => setIsStarred((prev) => !prev)}
                >
                  <Bookmark size={12} />
                  {t("search.quick_filter.starred_only")}
                </SearchChip>
              </div>
            </div>
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
                {t("search.related_topics")}
              </div>
              {relatedTopics.length > 0 ? (
                relatedTopics.map((topic) => (
                  <div
                    key={topic.id}
                    className="mb-2 flex items-center gap-2 rounded-md bg-[var(--gray-a2)] px-2 py-2 text-xs text-[var(--gray-11)]"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-9)]" />
                    {topic.title}
                  </div>
                ))
              ) : (
                <div className="text-xs text-[var(--gray-9)]">
                  {t("search.related_topics_empty")}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </MainPanel>
  );
};
