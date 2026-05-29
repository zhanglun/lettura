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
          ? "starred-article-card starred-article-card--active"
          : "starred-article-card"
      }
    >
      <div className="starred-article-card-body">
        <Avatar
          size="2"
          src={article.feed_logo || getFeedLogo(article.feed_url)}
          fallback={article.feed_title?.slice(0, 1) || "L"}
          className="starred-article-avatar"
        />
        <div className="starred-article-content">
          <div className="starred-article-title-row">
            <h3 className="starred-article-title">
              {article.title}
            </h3>
            <Star
              size={14}
              fill="currentColor"
              className="starred-article-star"
            />
          </div>
          <div className="starred-article-meta">
            <span>{article.feed_title || t("starred.unknown_feed")}</span>
            <span>·</span>
            <span>{formatTime(article.create_date)}</span>
          </div>
          {summary && (
            <p className="starred-article-summary">
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
    <div className="starred-group">
      <div className="starred-group-header">
        <div className="starred-group-title">
          {props.title}
        </div>
        <div className="starred-group-subtitle">{props.subtitle}</div>
      </div>
      <div className="starred-group-list">
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

  const { articles, isLoading, isEmpty, isReachingEnd, size, setSize, mutate } =
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
      <div className="starred-workbench">
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
              ? "starred-main starred-main--narrow"
              : "starred-main"
          }
        >
          <div className="starred-header">
            <div className="starred-header-main">
              <div>
                <h1 className="starred-title">
                  Starred
                </h1>
                <p className="starred-subtitle">
                  {t("starred.header.subtitle")}
                </p>
              </div>
              <Button variant="surface" color="gray" onClick={handleExport}>
                <Download size={14} />
                {t("starred.export")}
              </Button>
            </div>
            <div className="starred-filter-row">
              {filterChips.map((chip) => (
                <button
                  type="button"
                  key={chip.key}
                  onClick={() => setActiveFilter(chip.key)}
                  className={
                    activeFilter === chip.key
                      ? "starred-filter-chip starred-filter-chip--active"
                      : "starred-filter-chip"
                  }
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="starred-scroll">
            {isLoading && articles.length === 0 ? (
              <div className="starred-skeleton-list">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="starred-skeleton-card"
                  >
                    <div className="starred-skeleton-line starred-skeleton-line--short" />
                    <div className="starred-skeleton-line starred-skeleton-line--title" />
                    <div className="starred-skeleton-line" />
                  </div>
                ))}
              </div>
            ) : isEmpty ? (
              <div className="starred-empty-card">
                <Library
                  size={42}
                  strokeWidth={1.5}
                  className="starred-empty-icon"
                />
                <h2 className="starred-empty-title">
                  {t("starred.empty.title")}
                </h2>
                <p className="starred-empty-subtitle">
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
              onArticleUpdate={() => mutate()}
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
