import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow, isToday, parseISO } from "date-fns";
import { Download, Library, Star } from "lucide-react";
import { Avatar, Button } from "@radix-ui/themes";
import { ArticleResItem } from "@/db";
import { MainPanel } from "@/components/MainPanel";
import { View } from "../Article/View";
import { useArticle } from "@/hooks/useArticle";
import { getFeedLogo } from "@/helpers/parseXML";
import {
  getCollections,
  getTags,
  createCollection,
  type CollectionItem,
  type TagItem,
} from "@/helpers/starredApi";
import { StarredOrganizeBar } from "./StarredOrganizeBar";
import { showErrorToast } from "@/helpers/errorHandler";
import { StarredSidebar } from "./StarredSidebar";
import { StarredStatsPanel } from "./StarredStatsPanel";

type FilterType = "all" | "read_later" | "archived" | "notes";

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

function isFromToday(article: ArticleResItem) {
  try {
    return isToday(parseISO(article.create_date));
  } catch {
    return false;
  }
}

function SavedArticleCard(props: {
  article: ArticleResItem;
  active: boolean;
  onOpen: (article: ArticleResItem) => void;
}) {
  const { t } = useTranslation();
  const { article, active, onOpen } = props;
  const summary = stripHtml(article.description || article.content || "");

  return (
    <button
      type="button"
      onClick={() => onOpen(article)}
      className={
        active
          ? "w-full border-l-2 border-[var(--accent-9)] bg-[var(--accent-a2)] px-4 py-3 text-left"
          : "w-full px-4 py-3 text-left transition hover:bg-[var(--gray-a3)]"
      }
    >
      <div className="flex items-start gap-3">
        <Avatar
          size="2"
          src={article.feed_logo || getFeedLogo(article.feed_url)}
          fallback={article.feed_title?.slice(0, 1) || "L"}
          className="mt-0.5 rounded"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-[var(--gray-12)]">
              {article.title}
            </h3>
            <Star
              size={14}
              fill="currentColor"
              className="shrink-0 text-[var(--amber-9)]"
            />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--gray-10)]">
            <span>{article.feed_title || t("starred.unknown_feed")}</span>
            <span>·</span>
            <span>{formatTime(article.create_date)}</span>
          </div>
          {summary && (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--gray-11)]">
              {summary}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

function SavedGroup(props: {
  title: string;
  subtitle: string;
  articles: ArticleResItem[];
  selected?: ArticleResItem | null;
  onOpen: (article: ArticleResItem) => void;
}) {
  if (props.articles.length === 0) return null;

  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)]">
      <div className="flex items-center justify-between border-b border-[var(--gray-5)] bg-[var(--gray-2)] px-4 py-2">
        <div className="text-xs font-semibold text-[var(--gray-12)]">
          {props.title}
        </div>
        <div className="text-xs text-[var(--gray-10)]">{props.subtitle}</div>
      </div>
      <div className="divide-y divide-[var(--gray-5)]">
        {props.articles.map((article) => (
          <SavedArticleCard
            key={article.uuid}
            article={article}
            active={props.selected?.uuid === article.uuid}
            onOpen={props.onOpen}
          />
        ))}
      </div>
    </div>
  );
}

export const StarredPage = () => {
  const { t } = useTranslation();
  const [selectedArticle, setSelectedArticle] =
    useState<ArticleResItem | null>(null);

  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const { articles, isLoading, isEmpty, isReachingEnd, size, setSize } =
    useArticle({
      collectionUuid: activeCollection,
      tagUuid: activeTag,
      isStarred: activeFilter === "read_later" ? null : 1,
      isArchived: activeFilter === "archived" ? true : undefined,
      isReadLater: activeFilter === "read_later" ? true : undefined,
      hasNotes: activeFilter === "notes" ? true : undefined,
    });

  useEffect(() => {
    setSelectedArticle(null);
  }, [activeCollection, activeTag, activeFilter]);

  useEffect(() => {
    getCollections()
      .then(setCollections)
      .catch((err) => showErrorToast(err, "Failed to load collections"));
    getTags()
      .then(setTags)
      .catch((err) => showErrorToast(err, "Failed to load tags"));
  }, []);

  const refreshCollections = useCallback(() => {
    getCollections()
      .then(setCollections)
      .catch((err) => showErrorToast(err, "Failed to refresh collections"));
  }, []);

  const refreshData = useCallback(() => {
    getCollections()
      .then(setCollections)
      .catch((err) => showErrorToast(err, "Failed to refresh collections"));
    getTags()
      .then(setTags)
      .catch((err) => showErrorToast(err, "Failed to refresh tags"));
  }, []);

  const filteredArticles = useMemo(() => {
    return articles;
  }, [articles]);

  const todayArticles = useMemo(
    () => filteredArticles.filter((article) => isFromToday(article)),
    [filteredArticles],
  );
  const earlierArticles = useMemo(
    () => filteredArticles.filter((article) => !isFromToday(article)),
    [filteredArticles],
  );
  const feedCount = useMemo(
    () => new Set(articles.map((article) => article.feed_uuid)).size,
    [articles],
  );
  const withNotesCount = useMemo(
    () =>
      articles.filter((article) =>
        stripHtml(article.description || article.content || ""),
      ).length,
    [articles],
  );

  const suggestion = useMemo(() => {
    if (articles.length < 3) return null;

    const feedMap = new Map<string, { name: string; count: number }>();
    for (const article of articles) {
      const key = article.feed_uuid;
      if (!key) continue;
      const existing = feedMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        feedMap.set(key, {
          name: article.feed_title || article.feed_url || "Unknown",
          count: 1,
        });
      }
    }

    const topFeed = [...feedMap.values()].sort((a, b) => b.count - a.count)[0];
    if (!topFeed || topFeed.count < 2) return null;

    const suggestionName = topFeed.name;
    const existingNames = new Set(collections.map((c) => c.name.toLowerCase()));

    if (existingNames.has(suggestionName.toLowerCase())) return null;

    return {
      collectionName: suggestionName,
      articleCount: topFeed.count,
    };
  }, [articles, collections]);

  const handleExport = () => {
    const data = JSON.stringify(articles, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `starred-articles-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCreateCollection = useCallback(
    async (name: string) => {
      try {
        await createCollection(name);
        refreshCollections();
      } catch (err) {
        showErrorToast(err, "Failed to create collection");
      }
    },
    [refreshCollections],
  );

  const filterChips: { key: FilterType; label: string }[] = [
    { key: "all", label: t("starred.filter.all") },
    { key: "read_later", label: t("starred.filter.read_later") },
    { key: "archived", label: t("starred.filter.archived") },
    { key: "notes", label: t("starred.filter.notes") },
  ];

  return (
    <MainPanel>
      <div className="flex h-full w-full overflow-hidden bg-[var(--gray-1)]">
        <StarredSidebar
          collections={collections}
          tags={tags}
          activeCollection={activeCollection}
          activeTag={activeTag}
          onSelectCollection={(uuid) => {
            setActiveCollection(uuid);
            setActiveTag(null);
            setActiveFilter("all");
          }}
          onSelectTag={(uuid) => {
            setActiveTag(uuid);
            setActiveCollection(null);
            setActiveFilter("all");
          }}
          onSelectAll={() => {
            setActiveCollection(null);
            setActiveTag(null);
            setActiveFilter("all");
          }}
          totalArticles={articles.length}
        />

        <section
          className={
            selectedArticle
              ? "flex w-[420px] shrink-0 flex-col border-r border-[var(--gray-5)] bg-[var(--color-panel-solid)]"
              : "flex min-w-0 flex-1 flex-col bg-[var(--color-panel-solid)]"
          }
        >
          <div className="border-b border-[var(--gray-5)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-[var(--gray-12)]">
                  Starred
                </h1>
                <p className="mt-1 text-sm text-[var(--gray-10)]">
                  {t("starred.header.subtitle")}
                </p>
              </div>
              <Button variant="surface" color="gray" onClick={handleExport}>
                <Download size={14} />
                {t("starred.export")}
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {filterChips.map((chip) => (
                <button
                  type="button"
                  key={chip.key}
                  onClick={() => setActiveFilter(chip.key)}
                  className={
                    activeFilter === chip.key
                      ? "rounded-full border border-[var(--accent-8)] bg-[var(--accent-a3)] px-3 py-1.5 text-xs font-medium text-[var(--accent-11)]"
                      : "rounded-full border border-[var(--gray-5)] px-3 py-1.5 text-xs font-medium text-[var(--gray-11)] hover:bg-[var(--gray-a3)]"
                  }
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-5">
            {isLoading && articles.length === 0 ? (
              <div className="grid gap-3">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-4"
                  >
                    <div className="mb-3 h-3 w-28 rounded bg-[var(--gray-a4)]" />
                    <div className="mb-2 h-4 w-4/5 rounded bg-[var(--gray-a4)]" />
                    <div className="h-3 w-full rounded bg-[var(--gray-a3)]" />
                  </div>
                ))}
              </div>
            ) : isEmpty ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed border-[var(--gray-6)] bg-[var(--gray-a2)] p-8 text-center">
                <Library
                  size={42}
                  strokeWidth={1.5}
                  className="text-[var(--gray-9)]"
                />
                <h2 className="mt-4 text-base font-semibold text-[var(--gray-12)]">
                  {t("starred.empty.title")}
                </h2>
                <p className="mt-2 max-w-[360px] text-sm leading-6 text-[var(--gray-10)]">
                  {t("starred.empty.subtitle")}
                </p>
              </div>
            ) : (
              <>
                <SavedGroup
                  title={t("starred.group.today")}
                  subtitle={t("starred.group.today_count", {
                    count: todayArticles.length,
                  })}
                  articles={todayArticles}
                  selected={selectedArticle}
                  onOpen={setSelectedArticle}
                />
                <SavedGroup
                  title={t("starred.group.earlier")}
                  subtitle={t("starred.group.earlier_sort")}
                  articles={earlierArticles}
                  selected={selectedArticle}
                  onOpen={setSelectedArticle}
                />
                {!isReachingEnd && (
                  <Button
                    variant="surface"
                    color="gray"
                    loading={isLoading}
                    onClick={() => setSize(size + 1)}
                  >
                    {t("starred.load_more")}
                  </Button>
                )}
              </>
            )}
          </div>
        </section>

        {selectedArticle ? (
          <div className="flex min-w-0 flex-1 flex-col">
            <StarredOrganizeBar article={selectedArticle} onRefresh={refreshData} />
            <View
              article={selectedArticle}
              closable
              onClose={() => setSelectedArticle(null)}
            />
          </div>
        ) : (
          <StarredStatsPanel
            articles={articles}
            feedCount={feedCount}
            withNotesCount={withNotesCount}
            suggestion={suggestion}
            onOpenArticle={setSelectedArticle}
            onCreateCollection={handleCreateCollection}
          />
        )}
      </div>
    </MainPanel>
  );
};
