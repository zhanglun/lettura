import { useRef, useCallback, useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useParams, useMatch, useNavigate } from "react-router-dom";
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
import { AddFeedChannel } from "@/components/AddFeed";
import { AddFolder } from "@/components/AddFolder";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { open as openDialog, save } from "@tauri-apps/plugin-dialog";
import { busChannel } from "@/helpers/busChannel";
import * as dataAgent from "@/helpers/dataAgent";
import { showErrorToast, showSuccessToast } from "@/helpers/errorHandler";
import { toast } from "sonner";
import { CheckCheck, Download, FolderPlus, Plus, RefreshCw, Upload } from "lucide-react";
import { ArticleReadStatus } from "@/typing";
import { ArticleResItem } from "@/db";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

export const ArticleContainer = () => {
  const { t } = useTranslation();
  const [, type, queryFeedUuid] = useQuery();
  const params = useParams<{ uuid?: string; id?: string }>();
  const isArticleRoute = useMatch(RouteConfig.LOCAL_ARTICLE);
  const navigate = useNavigate();
  const feedUuid = params.uuid || queryFeedUuid;
  const listRef = useRef<ArticleListVirtualRefType | null>(null);
  const [addFolderDialogStatus, setAddFolderDialogStatus] = useState(false);
  const [importingOpml, setImportingOpml] = useState(false);
  const [exportingOpml, setExportingOpml] = useState(false);

  const store = useBearStore(
    useShallow((state) => ({
      article: state.article,
      setArticle: state.setArticle,
      articleDialogViewStatus: state.articleDialogViewStatus,
      setArticleDialogViewStatus: state.setArticleDialogViewStatus,
      podcastPanelStatus: state.podcastPanelStatus,
      tracks: state.tracks,
      podcastPlayingStatus: state.podcastPlayingStatus,
      viewMeta: state.viewMeta,
      feed: state.feed,
      expandedArticleUuid: state.expandedArticleUuid,
      setExpandedArticleUuid: state.setExpandedArticleUuid,
      currentFilter: state.currentFilter,
      setFilter: state.setFilter,
      globalSyncStatus: state.globalSyncStatus,
      syncAllArticles: state.syncAllArticles,
      markArticleListAsRead: state.markArticleListAsRead,
      getSubscribes: state.getSubscribes,
    })),
  );

  const { article, setArticle } = store;

  const { articles, isLoading, size, setSize, isEmpty, isReachingEnd, mutate, isToday, isAll } = useArticle({
    feedUuid,
    type,
  });

  const unreadCount = articles.filter((a) => a.read_status === ArticleReadStatus.UNREAD).length;

  const filters = [
    { id: 0, title: t("All articles") },
    { id: ArticleReadStatus.UNREAD, title: t("Unread") },
    { id: ArticleReadStatus.READ, title: t("Read") },
  ];

  useEffect(() => {
    if (!(isArticleRoute && params.id)) return;
    if (article) return;

    let cancelled = false;
    request
      .get(`/articles/${params.id}`)
      .then((res) => {
        if (!cancelled && res.data) {
          setArticle(res.data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load article from URL params:", err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isArticleRoute, params.id, article, setArticle]);

  useEffect(() => {
    if (!isArticleRoute) {
      setArticle(null);
    }
  }, [feedUuid, isArticleRoute, setArticle, type]);

  const openInBrowser = useCallback(() => {
    store.article && open(store.article.link);
  }, [store.article]);

  const handleArticleRead = useCallback(
    (nextArticle: ArticleResItem) => {
      mutate((pages: { list: ArticleResItem[] }[] | undefined) => retainArticleAfterRead(pages, nextArticle), false);
    },
    [mutate],
  );

  const handleExpandArticle = useCallback(
    (a: ArticleResItem) => {
      if (store.expandedArticleUuid === a.uuid) {
        store.setExpandedArticleUuid(null);
      } else {
        store.setExpandedArticleUuid(a.uuid);
      }
    },
    [store.expandedArticleUuid, store.setExpandedArticleUuid],
  );

  const handleCloseInlineReader = useCallback(() => {
    store.setExpandedArticleUuid(null);
  }, [store.setExpandedArticleUuid]);

  const expandedIdx = store.expandedArticleUuid
    ? articles.findIndex((a) => a.uuid === store.expandedArticleUuid)
    : -1;

  const expandNextArticle = useCallback(() => {
    if (expandedIdx >= 0 && expandedIdx < articles.length - 1) {
      handleExpandArticle(articles[expandedIdx + 1]);
    }
  }, [expandedIdx, articles, handleExpandArticle]);

  const expandPrevArticle = useCallback(() => {
    if (expandedIdx > 0) {
      handleExpandArticle(articles[expandedIdx - 1]);
    }
  }, [expandedIdx, articles, handleExpandArticle]);

  const markAllRead = async () => {
    await store.markArticleListAsRead(isToday, isAll);
    await mutate();
  };

  const importFromOPML = async () => {
    const selected = await openDialog({
      multiple: false,
      filters: [{ name: "OPML", extensions: ["opml", "xml"] }],
    });

    if (!selected || typeof selected !== "string") return;

    setImportingOpml(true);
    try {
      const opmlContent = await readTextFile(selected);
      const result = await dataAgent.importOpml(opmlContent);
      busChannel.emit("getChannels");

      if (result.feed_count > 0) {
        toast.success(t("Successfully imported {count} feeds", { count: result.feed_count }));
      }
      if (result.folder_count > 0) {
        toast.success(t("Successfully created {count} folders", { count: result.folder_count }));
      }
      if (result.failed_count > 0) {
        toast.warning(t("Failed to import {count} feeds", { count: result.failed_count }));
      }
    } catch (error) {
      showErrorToast(error, t("Failed to import OPML file"));
    } finally {
      setImportingOpml(false);
    }
  };

  const exportToOPML = async () => {
    setExportingOpml(true);
    try {
      const opmlContent = await dataAgent.exportOpml();
      const filePath = await save({
        defaultPath: `lettura-subscriptions-${new Date().toISOString().slice(0, 10)}.opml`,
        filters: [{ name: "OPML", extensions: ["opml"] }],
      });

      if (filePath) {
        await writeTextFile(filePath, opmlContent);
        showSuccessToast(t("OPML file exported successfully"));
      }
    } catch (error) {
      showErrorToast(error, t("Failed to export OPML file"));
    } finally {
      setExportingOpml(false);
    }
  };

  useHotkeys("o", openInBrowser);
  useHotkeys("n", expandNextArticle);
  useHotkeys("Shift+n", expandPrevArticle);

  const shouldShowPodcast = store.tracks?.length > 0 || store.podcastPlayingStatus;
  const title = store.viewMeta?.title || store.feed?.title || "";

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--color-background)]">
      <div className="shrink-0 border-b border-[var(--gray-4)] bg-[var(--gray-1)] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-[var(--gray-12)]">{title}</div>
            <div className="mt-0.5 text-[11px] text-[var(--gray-9)] whitespace-nowrap">
              {unreadCount > 0
                ? t("article.list_unread_count", { count: unreadCount })
                : t("article.list_count", { count: articles.length })}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <AddFeedChannel>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1 rounded-md bg-[var(--accent-9)] px-2.5 text-xs font-medium text-white transition hover:bg-[var(--accent-10)]"
                title={t("Create new subscribe")}
              >
                <Plus size={14} />
                <span>{t("New Subscribe")}</span>
              </button>
            </AddFeedChannel>
            <button
              type="button"
              onClick={() => setAddFolderDialogStatus(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--gray-11)] transition hover:bg-[var(--gray-a3)] hover:text-[var(--gray-12)]"
              title={t("Add folder")}
              aria-label={t("Add folder")}
            >
              <FolderPlus size={15} />
            </button>
            <button
              type="button"
              onClick={importFromOPML}
              disabled={importingOpml}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--gray-11)] transition hover:bg-[var(--gray-a3)] hover:text-[var(--gray-12)] disabled:opacity-50"
              title={importingOpml ? t("Importing...") : t("Import OPML")}
              aria-label={importingOpml ? t("Importing...") : t("Import OPML")}
            >
              <Upload size={15} className={importingOpml ? "animate-pulse" : ""} />
            </button>
            <button
              type="button"
              onClick={exportToOPML}
              disabled={exportingOpml}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--gray-11)] transition hover:bg-[var(--gray-a3)] hover:text-[var(--gray-12)] disabled:opacity-50"
              title={exportingOpml ? t("Exporting") : t("Export OPML")}
              aria-label={exportingOpml ? t("Exporting") : t("Export OPML")}
            >
              <Download size={15} className={exportingOpml ? "animate-pulse" : ""} />
            </button>
            <button
              type="button"
              onClick={() => store.syncAllArticles()}
              disabled={store.globalSyncStatus}
              className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs text-[var(--gray-11)] transition hover:bg-[var(--gray-a3)] hover:text-[var(--gray-12)] disabled:opacity-50"
              title={t("Sync All")}
            >
              <RefreshCw size={15} className={store.globalSyncStatus ? "animate-spin" : ""} />
              <span>{store.globalSyncStatus ? t("Syncing...") : t("Sync All")}</span>
            </button>
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs text-[var(--gray-11)] transition hover:bg-[var(--gray-a3)] hover:text-[var(--gray-12)]"
              title={t("Mark all as read")}
            >
              <CheckCheck size={15} />
              <span>{t("Mark all as read")}</span>
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-3">
          <div className="flex h-7 items-center rounded-md border border-[var(--gray-5)] bg-[var(--gray-2)] p-0.5">
            {filters.map((filter) => {
              const active = store.currentFilter.id === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  className={clsx(
                    "h-6 rounded px-2.5 text-[11px] font-medium transition-colors",
                    active
                      ? "bg-white text-[var(--gray-12)] shadow-sm"
                      : "text-[var(--gray-9)] hover:text-[var(--gray-12)]",
                  )}
                  onClick={() => store.setFilter(filter)}
                >
                  {filter.title}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <ArticleListVirtual
        ref={listRef}
        articles={articles}
        title={title}
        type={type}
        feedUuid={feedUuid}
        itemDensity="regular"
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

      <AddFolder
        action="add"
        dialogStatus={addFolderDialogStatus}
        setDialogStatus={setAddFolderDialogStatus}
        afterConfirm={store.getSubscribes}
      />

      <LPodcast visible={shouldShowPodcast} />
      <ArticleDialogView
        article={store.article}
        dialogStatus={store.articleDialogViewStatus}
        setDialogStatus={store.setArticleDialogViewStatus}
        afterConfirm={() => {}}
        afterCancel={() => {
          store.setArticle(null);
        }}
      />
    </div>
  );
};
