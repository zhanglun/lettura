import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  Bookmark,
  Calendar,
  Clock,
  FileSearch,
  Filter,
  Rss,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Avatar, Button, IconButton, TextField } from "@radix-ui/themes";
import { AxiosResponse } from "axios";
import { ArticleResItem, FeedResItem } from "@/db";
import { MainPanel } from "@/components/MainPanel";
import { View } from "../Article/View";
import { request } from "@/helpers/request";
import { getFeedLogo } from "@/helpers/parseXML";
import { showErrorToast } from "@/helpers/errorHandler";

const PAGE_SIZE = 20;

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
          {article.feed_title || "Unknown feed"}
        </span>
        {article.starred === 1 && (
          <span className="rounded-full bg-[var(--amber-a3)] px-2 py-0.5 text-[10px] font-medium text-[var(--amber-11)]">
            Starred
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
          description || "No summary available."
        )}
      </p>
    </button>
  );
}

export const SearchPage = () => {
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

  const savedSearches = useMemo(
    () => [
      { label: "agent sdk", count: 18 },
      { label: "async rust", count: 9 },
      { label: "on-device llm", count: 6 },
    ],
    [],
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
    [endDate, feedUuid, isFetching, query, startDate],
  );

  const runSearch = useCallback(() => {
    setCurrentArticle(null);
    setCursor(1);
    setHasMore(false);
    setResultList([]);
    getList(1, true);
  }, [getList]);

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

  return (
    <MainPanel>
      <div className="flex h-full w-full overflow-hidden bg-[var(--gray-1)]">
        <aside className="hidden w-[220px] shrink-0 flex-col border-r border-[var(--gray-5)] bg-[var(--gray-2)] md:flex">
          <div className="border-b border-[var(--gray-5)] p-4">
            <div className="text-sm font-semibold text-[var(--gray-12)]">
              Search
            </div>
            <div className="mt-1 text-xs leading-5 text-[var(--gray-10)]">
              跨文章、来源和主题快速定位信息。
            </div>
          </div>
          <div className="flex-1 overflow-auto p-3">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
              保存的搜索
            </div>
            <div className="grid gap-1">
              {savedSearches.map((item) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => setQuery(item.label)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-[var(--gray-11)] hover:bg-[var(--gray-a3)]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-9)]" />
                  <span>{item.label}</span>
                  <span className="ml-auto text-[10px] text-[var(--gray-9)]">
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
            <div className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
              最近搜索
            </div>
            {["vector database", "wasm component model"].map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setQuery(item)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-[var(--gray-11)] hover:bg-[var(--gray-a3)]"
              >
                <Clock size={12} />
                {item}
              </button>
            ))}
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
                  从每日信号回到原始文章，或把常用查询保存为动态视图。
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
                搜索
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <SearchChip active>全部</SearchChip>
              <SearchChip>
                <Bookmark size={12} />
                已收藏
              </SearchChip>
              <SearchChip>
                <Sparkles size={12} />
                高信号
              </SearchChip>
              <SearchChip active={hasActiveFilters}>
                <Filter size={12} />
                筛选
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
                  <option value="">所有来源</option>
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
                  ? `${resultList.length} 个结果 · 按相关度排序`
                  : query
                    ? "按 Enter 或点击搜索开始检索"
                    : "输入关键词开始搜索"}
              </span>
              {selectedFeed && <span>来源：{selectedFeed.title}</span>}
            </div>

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
                  搜索你的阅读库
                </h2>
                <p className="mt-2 max-w-[360px] text-sm leading-6 text-[var(--gray-10)]">
                  可以按标题、摘要、来源和时间范围查找文章。常用查询会作为左侧的保存搜索呈现。
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
                    加载更多
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
                搜索洞察
              </div>
              <div className="rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-3">
                <div className="text-sm font-semibold text-[var(--gray-12)]">
                  先定位，再阅读
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--gray-11)]">
                  搜索结果会保留来源、时间、收藏状态和摘要命中，方便你快速判断是否值得打开。
                </p>
              </div>
            </div>
            <div className="mb-5">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
                快速过滤
              </div>
              <div className="grid gap-2">
                <SearchChip active>
                  <Calendar size={12} />
                  最近 30 天
                </SearchChip>
                <SearchChip>
                  <Rss size={12} />
                  所有来源
                </SearchChip>
                <SearchChip>
                  <Bookmark size={12} />
                  只看收藏
                </SearchChip>
              </div>
            </div>
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
                相关 Topic
              </div>
              {["AI Agent 竞争格局", "开源商业模式", "LLM 推理优化"].map(
                (topic) => (
                  <div
                    key={topic}
                    className="mb-2 flex items-center gap-2 rounded-md bg-[var(--gray-a2)] px-2 py-2 text-xs text-[var(--gray-11)]"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-9)]" />
                    {topic}
                  </div>
                ),
              )}
            </div>
          </aside>
        )}
      </div>
    </MainPanel>
  );
};
