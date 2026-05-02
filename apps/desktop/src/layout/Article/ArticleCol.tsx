import React, {
  useImperativeHandle,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { useParams } from "react-router-dom";
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

export interface ArticleColRefObject {
  goNext: () => void;
  goPrev: () => void;
}

interface ArticleColProps {
  feedUuid?: string;
  type?: string;
  wide?: boolean;
}

export const ArticleCol = React.memo(
  React.forwardRef<ArticleColRefObject, ArticleColProps>(
    (props, listForwarded) => {
      const { t } = useTranslation();
      const { feedUuid, type, wide = false } = props;
      const params = useParams() as { name: string };
      const listRef = useRef<ArticleListVirtualRefType | null>(null);

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
      } = useArticle({
        feedUuid,
        type,
      });
      const unreadCount = articles.filter(
        (article) => article.read_status === ArticleReadStatus.UNREAD,
      ).length;
      const filters = [
        { id: 0, title: t("All articles") },
        { id: ArticleReadStatus.UNREAD, title: t("Unread") },
        { id: ArticleReadStatus.READ, title: t("Read") },
      ];

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
          mutate((pages: any[] | undefined) => {
            if (!pages) {
              return pages;
            }

            return pages.map((page) => {
              const list = page?.list || [];
              const nextList =
                store.currentFilter.id === ArticleReadStatus.UNREAD
                  ? list.filter(
                      (item: ArticleResItem) => item.uuid !== nextArticle.uuid,
                    )
                  : list.map((item: ArticleResItem) =>
                      item.uuid === nextArticle.uuid ? nextArticle : item,
                    );

              return {
                ...page,
                list: nextList,
              };
            });
          }, false);
        },
        [mutate, store.currentFilter.id],
      );

      function renderLabel() {
        return (
          <span className="cursor-default">
            {store.viewMeta?.title || store.feed?.title || ""}
          </span>
        );
      }

      useImperativeHandle(listForwarded, () => {
        return {
          goNext,
          goPrev,
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
          <div className="h-[var(--app-toolbar-height)] grid grid-cols-[minmax(0,1fr)_auto] items-center border-b border-[var(--gray-4)] shrink-0 bg-[var(--gray-1)]">
            <div
              className="
                pl-4
                min-w-0
                w-full
              "
            >
              <div className="truncate text-sm font-semibold text-[var(--gray-12)]">
                {renderLabel()}
              </div>
            </div>
            <div className="flex items-center gap-3 px-4">
              {wide && (
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
              <div className="text-[11px] text-[var(--gray-9)] whitespace-nowrap">
                {wide && unreadCount > 0
                  ? t("article.list_unread_count", { count: unreadCount })
                  : t("article.list_count", { count: articles.length })}
              </div>
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
          />
        </div>
      );
    },
  ),
);
