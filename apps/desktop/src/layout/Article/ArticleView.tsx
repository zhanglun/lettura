import { useRef, useCallback, useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useParams, useMatch } from "react-router-dom";
import { ChevronLeft, CheckCheck, RefreshCw } from "lucide-react";
import { ArticleListVirtual, ArticleListVirtualRefType } from "@/components/ArticleListVirtual";
import { ArticleDialogView } from "@/components/ArticleView/DialogView";
import { open } from "@tauri-apps/plugin-shell";
import { useQuery } from "@/helpers/parseXML";
import { LPodcast } from "@/components/LPodcast";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { RouteConfig } from "@/config";
import { request } from "@/helpers/request";
import { useArticle } from "@/hooks/useArticle";
import { retainArticleAfterRead } from "@/helpers/articleHelpers";
import { ArticleReadStatus } from "@/typing";
import type { ArticleResItem, FeedResItem } from "@/db";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

interface ArticleViewProps {
  feed?: FeedResItem | null;
  onBack?: () => void;
}

function feedHealthColor(status: number | undefined) {
  if (status === 1) return "bg-amber-500";
  if (status === 2) return "bg-red-500";
  return "bg-green-500";
}

export function ArticleView({ feed, onBack }: ArticleViewProps) {
  const { t } = useTranslation();
  const [, type, queryFeedUuid] = useQuery();
  const params = useParams<{ uuid?: string; id?: string }>();
  const isArticleRoute = useMatch(RouteConfig.LOCAL_ARTICLE);
  const listRef = useRef<ArticleListVirtualRefType | null>(null);

  const feedUuid = feed?.uuid ?? params.uuid ?? queryFeedUuid;

  const store = useBearStore(
    useShallow((state) => ({
      article: state.article,
      setArticle: state.setArticle,
      articleDialogViewStatus: state.articleDialogViewStatus,
      setArticleDialogViewStatus: state.setArticleDialogViewStatus,
      tracks: state.tracks,
      podcastPlayingStatus: state.podcastPlayingStatus,
      viewMeta: state.viewMeta,
      collectionMeta: state.collectionMeta,
      expandedArticleUuid: state.expandedArticleUuid,
      setExpandedArticleUuid: state.setExpandedArticleUuid,
      currentFilter: state.currentFilter,
      setFilter: state.setFilter,
      globalSyncStatus: state.globalSyncStatus,
      syncAllArticles: state.syncAllArticles,
      syncArticles: state.syncArticles,
      markArticleListAsRead: state.markArticleListAsRead,
    })),
  );

  const {
    articles,
    isLoading,
    size,
    setSize,
    isEmpty,
    isReachingEnd,
    mutate,
    isToday,
    isAll,
  } = useArticle({ feedUuid, type });

  const filters = [
    { id: 0, title: t("All articles") },
    { id: ArticleReadStatus.UNREAD, title: t("Unread") },
    { id: ArticleReadStatus.READ, title: t("Read") },
  ];

  // Deep-link: restore article from URL when store is cold (e.g. page refresh)
  useEffect(() => {
    if (!(isArticleRoute && params.id)) return;
    if (store.article) return;
    let cancelled = false;
    request
      .get(`/articles/${params.id}`)
      .then((res) => {
        if (!cancelled && res.data) store.setArticle(res.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isArticleRoute, params.id, store.article, store.setArticle]);

  useEffect(() => {
    if (!isArticleRoute) store.setArticle(null);
  }, [feedUuid, isArticleRoute, store.setArticle, type]);

  const handleArticleRead = useCallback(
    (nextArticle: ArticleResItem) => {
      mutate(
        (pages: { list: ArticleResItem[] }[] | undefined) =>
          retainArticleAfterRead(pages, nextArticle),
        false,
      );
    },
    [mutate],
  );

  const handleExpandArticle = useCallback(
    (a: ArticleResItem) => {
      store.setExpandedArticleUuid(
        store.expandedArticleUuid === a.uuid ? null : a.uuid,
      );
    },
    [store.expandedArticleUuid, store.setExpandedArticleUuid],
  );

  const handleCloseInlineReader = useCallback(() => {
    store.setExpandedArticleUuid(null);
  }, [store.setExpandedArticleUuid]);

  const expandedIdx = store.expandedArticleUuid
    ? articles.findIndex((a) => a.uuid === store.expandedArticleUuid)
    : -1;

  const markAllRead = async () => {
    await store.markArticleListAsRead(isToday, isAll);
    await mutate();
  };

  const handleSync = useCallback(async () => {
    if (feed) {
      await store.syncArticles(feed);
    } else {
      store.syncAllArticles();
    }
  }, [feed, store.syncArticles, store.syncAllArticles]);

  useHotkeys("o", () => store.article && open(store.article.link));
  useHotkeys("n", () => {
    if (expandedIdx >= 0 && expandedIdx < articles.length - 1) {
      handleExpandArticle(articles[expandedIdx + 1]);
    }
  });
  useHotkeys("shift+n", () => {
    if (expandedIdx > 0) handleExpandArticle(articles[expandedIdx - 1]);
  });

  const title = feed?.title ?? store.viewMeta?.title ?? "";
  const unreadCount = feed?.unread
    ?? (feedUuid
      ? store.viewMeta?.unread
      : isToday
        ? store.collectionMeta.today.unread
        : isAll
          ? store.collectionMeta.total.unread
          : store.viewMeta?.unread)
    ?? 0;
  const shouldShowPodcast = store.tracks?.length > 0 || store.podcastPlayingStatus;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--color-background)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2 border-b border-[var(--gray-4)] bg-[var(--gray-1)] flex-shrink-0">
        {/* Left: identity */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {onBack && (
            <button
              type="button"
              className="flex items-center justify-center w-6 h-6 rounded hover:bg-[var(--gray-a4)] text-[var(--gray-9)] flex-shrink-0 transition-colors"
              onClick={onBack}
            >
              <ChevronLeft size={14} />
            </button>
          )}
          {feed ? (
            <>
              {feed.logo ? (
                <img
                  src={feed.logo}
                  alt=""
                  className="w-4 h-4 rounded-[3px] flex-shrink-0 object-cover"
                />
              ) : (
                <div className="w-4 h-4 rounded-[3px] flex-shrink-0 bg-[var(--gray-5)] flex items-center justify-center text-[8px] text-[var(--gray-9)]">
                  {feed.title?.charAt(0)?.toUpperCase() ?? "F"}
                </div>
              )}
              <span className="text-[13px] font-semibold text-[var(--gray-12)] truncate">
                {feed.title}
              </span>
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${feedHealthColor(feed.health_status)}`}
              />
              {feed.unread > 0 && (
                <span className="text-[11px] text-[var(--gray-9)] flex-shrink-0">
                  {feed.unread} {t("Unread")}
                </span>
              )}
            </>
          ) : (
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-[var(--gray-12)] truncate">
                {title}
              </div>
              {unreadCount > 0 && (
                <div className="text-[11px] text-[var(--gray-9)]">
                  {t("article.list_unread_count", { count: unreadCount })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: filter + actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-px bg-[var(--gray-3)] rounded-md p-0.5">
            {filters.map((f) => {
              const active = store.currentFilter.id === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  className={clsx(
                    "px-2.5 py-1 rounded text-[11px] font-medium transition-colors",
                    active
                      ? "bg-[var(--color-panel-solid)] text-[var(--accent-9)] shadow-sm"
                      : "text-[var(--gray-9)] hover:text-[var(--gray-12)]",
                  )}
                  onClick={() => store.setFilter(f)}
                >
                  {f.title}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={handleSync}
            disabled={store.globalSyncStatus}
            className="flex items-center justify-center w-7 h-7 text-[var(--gray-9)] hover:text-[var(--gray-12)] hover:bg-[var(--gray-a3)] rounded-md transition-colors disabled:opacity-50"
            title={feed ? t("Reload feeds") : t("Sync All")}
          >
            <RefreshCw
              size={13}
              className={store.globalSyncStatus ? "animate-spin" : ""}
            />
          </button>
          <button
            type="button"
            onClick={markAllRead}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-[var(--gray-9)] hover:text-[var(--gray-12)] hover:bg-[var(--gray-a3)] rounded-md transition-colors"
          >
            <CheckCheck size={12} />
            {t("Mark all as read")}
          </button>
        </div>
      </div>

      {/* Article list */}
      <ArticleListVirtual
        ref={listRef}
        articles={articles}
        title={title}
        type={type}
        feedUuid={feedUuid}
        isLoading={isLoading}
        isEmpty={isEmpty}
        isReachingEnd={isReachingEnd}
        size={size}
        setSize={setSize}
        onArticleRead={handleArticleRead}
        expandedArticleUuid={store.expandedArticleUuid}
        onExpandArticle={handleExpandArticle}
        onCloseInlineReader={handleCloseInlineReader}
      />

      <LPodcast visible={shouldShowPodcast} />
      <ArticleDialogView
        article={store.article}
        dialogStatus={store.articleDialogViewStatus}
        setDialogStatus={store.setArticleDialogViewStatus}
        afterConfirm={() => {}}
        afterCancel={() => store.setArticle(null)}
      />
    </div>
  );
}
