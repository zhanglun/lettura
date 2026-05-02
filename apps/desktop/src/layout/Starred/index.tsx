import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow, isToday, parseISO } from "date-fns";
import {
  Archive,
  Bookmark,
  Download,
  FolderPlus,
  Library,
  Star,
  Tags,
} from "lucide-react";
import { Avatar, Button } from "@radix-ui/themes";
import { ArticleResItem } from "@/db";
import { MainPanel } from "@/components/MainPanel";
import { View } from "../Article/View";
import { useArticle } from "../Article/useArticle";
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

  const [showCollectionInput, setShowCollectionInput] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

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

  const handleCreateCollection = async () => {
    const name = newCollectionName.trim();
    if (!name) return;
    setIsCreatingCollection(true);
    try {
      await createCollection(name);
      setNewCollectionName("");
      setShowCollectionInput(false);
      refreshCollections();
    } catch (err) {
      showErrorToast(err, "Failed to create collection");
    } finally {
      setIsCreatingCollection(false);
    }
  };

  const filterChips: { key: FilterType; label: string }[] = [
    { key: "all", label: t("starred.filter.all") },
    { key: "read_later", label: t("starred.filter.read_later") },
    { key: "archived", label: t("starred.filter.archived") },
    { key: "notes", label: t("starred.filter.notes") },
  ];

  return (
    <MainPanel>
      <div className="flex h-full w-full overflow-hidden bg-[var(--gray-1)]">
        <aside className="hidden w-[220px] shrink-0 flex-col border-r border-[var(--gray-5)] bg-[var(--gray-2)] md:flex">
          <div className="border-b border-[var(--gray-5)] p-4">
            <div className="text-sm font-semibold text-[var(--gray-12)]">
              Starred
            </div>
            <div className="mt-1 text-xs leading-5 text-[var(--gray-10)]">
              {t("starred.subtitle")}
            </div>
          </div>
          <div className="flex-1 overflow-auto p-3">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
              {t("starred.sidebar.collections")}
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveCollection(null);
                setActiveTag(null);
                setActiveFilter("all");
              }}
              className={
                activeCollection === null && activeTag === null
                  ? "flex w-full items-center gap-2 rounded-md bg-[var(--gray-a3)] px-2 py-1.5 text-left text-xs font-medium text-[var(--gray-12)]"
                  : "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-[var(--gray-11)] hover:bg-[var(--gray-a3)]"
              }
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--amber-9)" }}
              />
              <span>{t("starred.sidebar.all")}</span>
              <span className="ml-auto text-[10px] text-[var(--gray-9)]">
                {articles.length}
              </span>
            </button>
            {collections.map((collection) => (
              <button
                type="button"
                key={collection.uuid}
                onClick={() => {
                  setActiveCollection(collection.uuid);
                  setActiveTag(null);
                  setActiveFilter("all");
                }}
                className={
                  activeCollection === collection.uuid
                    ? "flex w-full items-center gap-2 rounded-md bg-[var(--gray-a3)] px-2 py-1.5 text-left text-xs font-medium text-[var(--gray-12)]"
                    : "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-[var(--gray-11)] hover:bg-[var(--gray-a3)]"
                }
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--accent-9)" }}
                />
                <span>{collection.name}</span>
              </button>
            ))}

            <div className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
              {t("starred.sidebar.tags")}
            </div>
            {tags.map((tag) => (
              <button
                type="button"
                key={tag.uuid}
                onClick={() => {
                  setActiveTag(tag.uuid);
                  setActiveCollection(null);
                  setActiveFilter("all");
                }}
                className={
                  activeTag === tag.uuid
                    ? "flex w-full items-center gap-2 rounded-md bg-[var(--gray-a3)] px-2 py-1.5 text-left text-xs font-medium text-[var(--gray-12)]"
                    : "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-[var(--gray-11)] hover:bg-[var(--gray-a3)]"
                }
              >
                <Tags size={12} />
                #{tag.name}
              </button>
            ))}
          </div>
        </aside>

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
          <aside className="hidden w-[280px] shrink-0 overflow-auto border-l border-[var(--gray-5)] bg-[var(--gray-2)] p-4 lg:block">
            <div className="mb-5">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
                {t("starred.stats.title")}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-3">
                  <div className="text-2xl font-bold text-[var(--gray-12)]">
                    {articles.length}
                  </div>
                  <div className="text-xs text-[var(--gray-10)]">
                    {t("starred.stats.all")}
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-3">
                  <div className="text-2xl font-bold text-[var(--accent-11)]">
                    {feedCount}
                  </div>
                  <div className="text-xs text-[var(--gray-10)]">
                    {t("starred.stats.sources")}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
                {t("starred.suggest.title")}
              </div>
              <div className="rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--gray-12)]">
                  <FolderPlus size={14} />
                  {t("starred.suggest.create")}
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--gray-11)]">
                  {t("starred.suggest.has_notes", {
                    count: withNotesCount,
                  })}
                </p>
                {showCollectionInput ? (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateCollection();
                      }}
                      placeholder={t(
                        "starred.collection_input_placeholder",
                      )}
                      className="min-w-0 flex-1 rounded-md border border-[var(--gray-7)] bg-[var(--gray-2)] px-2 py-1 text-xs text-[var(--gray-12)] outline-none focus:border-[var(--accent-8)]"
                      disabled={isCreatingCollection}
                    />
                    <Button
                      size="1"
                      onClick={handleCreateCollection}
                      disabled={
                        !newCollectionName.trim() || isCreatingCollection
                      }
                    >
                      {isCreatingCollection
                        ? t("Saving")
                        : t("starred.suggest.create_button")}
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="mt-3"
                    size="1"
                    onClick={() => setShowCollectionInput(true)}
                  >
                    {t("starred.suggest.create_button")}
                  </Button>
                )}
              </div>
            </div>

            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
                {t("starred.queue.title")}
              </div>
              {articles.slice(0, 3).map((article) => (
                <button
                  type="button"
                  key={article.uuid}
                  onClick={() => setSelectedArticle(article)}
                  className="mb-2 flex w-full items-start gap-2 rounded-md bg-[var(--gray-a2)] px-2 py-2 text-left text-xs text-[var(--gray-11)] hover:bg-[var(--gray-a3)]"
                >
                  <Bookmark size={13} className="mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{article.title}</span>
                </button>
              ))}
              {articles.length === 0 && (
                <div className="rounded-md bg-[var(--gray-a2)] px-3 py-3 text-xs leading-5 text-[var(--gray-10)]">
                  <Archive size={14} className="mb-2" />
                  {t("starred.queue.empty")}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </MainPanel>
  );
};
