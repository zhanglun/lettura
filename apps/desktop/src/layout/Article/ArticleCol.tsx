import React, {
  useImperativeHandle,
  useRef,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArticleListVirtual,
  ArticleListVirtualRefType,
} from "@/components/ArticleListVirtual";
import { useBearStore } from "@/stores";
import { useArticle } from "./useArticle";
import { ArticleReadStatus } from "@/typing";
import { useHotkeys } from "react-hotkeys-hook";
import { throttle } from "lodash";
import clsx from "clsx";
import { ArticleResItem } from "@/db";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import { AddFeedChannel } from "@/components/AddFeed";
import { AddFolder } from "@/components/AddFolder";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { open as openDialog, save } from "@tauri-apps/plugin-dialog";
import { busChannel } from "@/helpers/busChannel";
import * as dataAgent from "@/helpers/dataAgent";
import { showErrorToast, showSuccessToast } from "@/helpers/errorHandler";
import { toast } from "sonner";
import {
  CheckCheck,
  Download,
  FolderPlus,
  Plus,
  RefreshCw,
  Upload,
} from "lucide-react";
import { RouteConfig } from "@/config";
import { ArticleFloatingNav } from "@/layout/Article/ArticleFloatingNav";

export function retainArticleAfterRead(
  pages: { list: ArticleResItem[] }[] | undefined,
  nextArticle: ArticleResItem,
): { list: ArticleResItem[] }[] | undefined {
  if (!pages) return pages;
  return pages.map((page) => ({
    ...page,
    list: (page?.list || []).map((item: ArticleResItem) =>
      item.uuid === nextArticle.uuid ? nextArticle : item,
    ),
  }));
}

export interface ArticleColRefObject {
  goNext: () => void;
  goPrev: () => void;
  expandNextArticle: () => void;
  expandPrevArticle: () => void;
  canExpandPrev: boolean;
  canExpandNext: boolean;
}

interface ArticleColProps {
  feedUuid?: string;
  type?: string;
  wide?: boolean;
  showFilters?: boolean;
  showManagementActions?: boolean;
}

export const ArticleCol = React.memo(
  React.forwardRef<ArticleColRefObject, ArticleColProps>(
    (props, listForwarded) => {
      const { t } = useTranslation();
      const {
        feedUuid,
        type,
        wide = false,
        showFilters = false,
        showManagementActions = false,
      } = props;
      const params = useParams() as { name: string };
      const navigate = useNavigate();
      const listRef = useRef<ArticleListVirtualRefType | null>(null);
      const [addFolderDialogStatus, setAddFolderDialogStatus] = useState(false);
      const [importingOpml, setImportingOpml] = useState(false);
      const [exportingOpml, setExportingOpml] = useState(false);

      const store = useBearStore(
        useShallow((state) => ({
          viewMeta: state.viewMeta,
          article: state.article,
          setArticle: state.setArticle,
          feed: state.feed,
          updateArticleStatus: state.updateArticleStatus,
          setHasMorePrev: state.setHasMorePrev,
          setHasMoreNext: state.setHasMoreNext,
          userConfig: state.userConfig,
          currentFilter: state.currentFilter,
          setFilter: state.setFilter,
          globalSyncStatus: state.globalSyncStatus,
          syncAllArticles: state.syncAllArticles,
          markArticleListAsRead: state.markArticleListAsRead,
          getSubscribes: state.getSubscribes,
          expandedArticleUuid: state.expandedArticleUuid,
          setExpandedArticleUuid: state.setExpandedArticleUuid,
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
      } = useArticle({
        feedUuid,
        type,
      });
      const unreadCount = articles.filter(
        (article) => article.read_status === ArticleReadStatus.UNREAD,
      ).length;
      const shouldShowFilters = wide || showFilters;
      const filters = [
        { id: 0, title: t("All articles") },
        { id: ArticleReadStatus.UNREAD, title: t("Unread") },
        { id: ArticleReadStatus.READ, title: t("Read") },
      ];
      const importFromOPML = async () => {
        const selected = await openDialog({
          multiple: false,
          filters: [{ name: "OPML", extensions: ["opml", "xml"] }],
        });

        if (!selected || typeof selected !== "string") {
          return;
        }

        setImportingOpml(true);
        try {
          const opmlContent = await readTextFile(selected);
          const result = await dataAgent.importOpml(opmlContent);

          busChannel.emit("getChannels");

          if (result.feed_count > 0) {
            toast.success(
              t("Successfully imported {count} feeds", {
                count: result.feed_count,
              }),
            );
          }

          if (result.folder_count > 0) {
            toast.success(
              t("Successfully created {count} folders", {
                count: result.folder_count,
              }),
            );
          }

          if (result.failed_count > 0) {
            toast.warning(
              t("Failed to import {count} feeds", {
                count: result.failed_count,
              }),
            );
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

      const markAllRead = async () => {
        await store.markArticleListAsRead(!!isToday, !!isAll);
        await mutate();
      };

      const navigateToArticle = useCallback(
        (article: ArticleResItem) => {
          const routeFeedUuid = article.feed_uuid || feedUuid;

          if (routeFeedUuid && article.id) {
            navigate(
              RouteConfig.LOCAL_ARTICLE.replace(":uuid", routeFeedUuid).replace(
                ":id",
                String(article.id),
              ),
            );
          }
        },
        [feedUuid, navigate],
      );

      function calculateItemPosition(
        direction: "up" | "down",
        article: ArticleResItem | null,
      ) {
        if (!article?.uuid) {
          return;
        }

        const $li = document.getElementById(article.uuid);
        const bounding = $li?.getBoundingClientRect();
        const winH = window.innerHeight;

        if (
          (direction === "up" || direction === "down") &&
          bounding &&
          bounding.top < 58
        ) {
          const offset = 58 - bounding.top;
          const scrollTop =
            (listRef?.current?.innerRef.current?.scrollTop || 0) - offset;

          listRef?.current?.innerRef.current?.scrollTo(0, scrollTop);
        } else if (
          (direction === "up" || direction === "down") &&
          bounding &&
          bounding.bottom > winH
        ) {
          const offset = bounding.bottom - winH;
          const scrollTop =
            (listRef?.current?.innerRef.current?.scrollTop || 0) + offset;

          listRef?.current?.innerRef.current?.scrollTo(0, scrollTop);
        }
      }

      const goPreviousArticle = () => {
        let previousItem: ArticleResItem;
        let uuid = store.article?.uuid;

        for (let i = 0; i < articles.length; i++) {
          if (articles[i].uuid === uuid && i === 0) {
            store.setHasMorePrev(false);
            store.setHasMoreNext(true);

            break;
          }

          if (articles[i].uuid === uuid && i !== 0) {
            previousItem = articles[i - 1];
            previousItem.read_status = ArticleReadStatus.READ;

            store.updateArticleStatus(
              { ...previousItem },
              ArticleReadStatus.READ,
            );
            store.setArticle(previousItem);
            handleArticleRead(previousItem);
            navigateToArticle(previousItem);
            store.setHasMorePrev(true);
            store.setHasMoreNext(true);

            calculateItemPosition("up", previousItem);

            break;
          }
        }
      };

      const goNextArticle = () => {
        let nextItem: ArticleResItem = {} as ArticleResItem;
        let uuid = store.article?.uuid;

        if (!uuid) {
          return [false];
        }

        for (let i = 0; i < articles.length; i++) {
          if (articles[i].uuid === uuid && i === articles.length - 1) {
            return [true];
          }

          if (articles[i].uuid === uuid && i < articles.length - 1) {
            nextItem = articles[i + 1];
            break;
          }
        }

        if (!uuid && articles.length > 0) {
          nextItem = articles[0];
        }

        store.updateArticleStatus({ ...nextItem }, ArticleReadStatus.READ);

        nextItem.read_status = ArticleReadStatus.READ;
        store.setArticle(nextItem);
        handleArticleRead(nextItem);
        navigateToArticle(nextItem);

        calculateItemPosition("down", nextItem);

        return [false];
      };

      const goPrevRef = useRef<(() => void) | null>(null);
      const goNextRef = useRef<(() => void) | null>(null);

      goPrevRef.current = throttle(() => {
        goPreviousArticle();
      }, 300);

      goNextRef.current = throttle(() => {
        goNextArticle();
      }, 300);

      useEffect(() => {
        return () => {
          goPrevRef.current = null;
          goNextRef.current = null;
        };
      }, []);

      const goPrev = useCallback(() => {
        goPrevRef.current?.();
      }, []);

      const goNext = useCallback(() => {
        goNextRef.current?.();
      }, []);

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

      function renderLabel() {
        return (
          <span className="cursor-default">
            {store.viewMeta?.title || store.feed?.title || ""}
          </span>
        );
      }

      const handleExpandArticle = useCallback(
        (article: ArticleResItem) => {
          if (store.expandedArticleUuid === article.uuid) {
            store.setExpandedArticleUuid(null);
          } else {
            store.setExpandedArticleUuid(article.uuid);
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

      useImperativeHandle(listForwarded, () => {
        return {
          goNext,
          goPrev,
          expandNextArticle,
          expandPrevArticle,
          canExpandPrev: expandedIdx > 0,
          canExpandNext: expandedIdx >= 0 && expandedIdx < articles.length - 1,
        };
      });

      useHotkeys("n", goNext);
      useHotkeys("Shift+n", goPrev);

      return (
        <div
          className={clsx(
            "border-r border-[var(--gray-4)] flex flex-col h-full bg-[var(--color-panel-solid)]",
            wide ? "flex-1 min-w-0" : "w-[var(--app-article-width)]",
          )}
        >
          <div className="shrink-0 border-b border-[var(--gray-4)] bg-[var(--gray-1)] px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-[var(--gray-12)]">
                  {renderLabel()}
                </div>
                <div className="mt-0.5 text-[11px] text-[var(--gray-9)] whitespace-nowrap">
                  {shouldShowFilters && unreadCount > 0
                    ? t("article.list_unread_count", { count: unreadCount })
                    : t("article.list_count", { count: articles.length })}
                </div>
              </div>
              {showManagementActions && (
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
              )}
            </div>
            <div className="mt-3 flex items-center justify-end gap-3">
              {shouldShowFilters && (
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
              )}
            </div>
          </div>
          <ArticleListVirtual
            ref={listRef}
            articles={articles}
            title={params.name}
            type={type}
            feedUuid={feedUuid}
            itemDensity={wide ? "regular" : "compact"}
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
          {showManagementActions && (
            <AddFolder
              action="add"
              dialogStatus={addFolderDialogStatus}
              setDialogStatus={setAddFolderDialogStatus}
              afterConfirm={store.getSubscribes}
            />
          )}
          <ArticleFloatingNav
            visible={store.expandedArticleUuid != null}
            canPrev={expandedIdx > 0}
            canNext={expandedIdx >= 0 && expandedIdx < articles.length - 1}
            onPrev={expandPrevArticle}
            onNext={expandNextArticle}
          />
        </div>
      );
    },
  ),
);
