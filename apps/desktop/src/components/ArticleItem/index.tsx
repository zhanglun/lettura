import React, { ForwardedRef, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useBearStore } from "@/stores";
import { ArticleResItem } from "@/db";
import { ArticleReadStatus } from "@/typing";
import clsx from "clsx";
import { useShallow } from "zustand/react/shallow";
import { RouteConfig } from "@/config";

export type ArticleItemDensity = "regular" | "compact";

export const ArticleItem = React.forwardRef(
  (
    props: {
      article: ArticleResItem;
      density?: ArticleItemDensity;
      onRead?: (article: ArticleResItem) => void;
      onExpand?: (article: ArticleResItem) => void;
    },
    ref: ForwardedRef<HTMLLIElement>,
  ) => {
    const store = useBearStore(
      useShallow((state) => ({
        updateArticleStatus: state.updateArticleStatus,
        article: state.article,
        setArticle: state.setArticle,
        expandedArticleUuid: state.expandedArticleUuid,
      })),
    );
    const { article, density = "regular", onRead, onExpand } = props;
    const navigate = useNavigate();
    const [highlight, setHighlight] = useState<boolean>();
    const [readStatus, setReadStatus] = useState(article.read_status);

    const markAsRead = (article: ArticleResItem) => {
      if (article.read_status === ArticleReadStatus.UNREAD) {
        setReadStatus(ArticleReadStatus.READ);
        onRead?.({ ...article, read_status: ArticleReadStatus.READ });
      }
      store.updateArticleStatus({ ...article }, ArticleReadStatus.READ);
    };

    const updateCurrentArticle = (article: ArticleResItem) => {
      markAsRead(article);
      store.setArticle({ ...article, read_status: ArticleReadStatus.READ });

      if (article.feed_uuid && article.id) {
        navigate(
          RouteConfig.LOCAL_ARTICLE.replace(":uuid", article.feed_uuid).replace(
            ":id",
            String(article.id),
          ),
        );
      }
    };

    const handleClick = () => {
      if (onExpand) {
        markAsRead(article);
        onExpand(article);
      } else {
        updateCurrentArticle(article);
      }
    };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLLIElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    };

    const timeLabel = formatDistanceToNow(
      new Date(article.pub_date || article.create_date),
      {
        includeSeconds: true,
        addSuffix: true,
      },
    );
    const sourceLabel = density === "compact"
      ? timeLabel
      : `${article.feed_title || article.author || "self"} · ${timeLabel}`;

    useEffect(() => {
      setReadStatus(article.read_status);
    }, [article.read_status]);

    useEffect(() => {
      const isArticleMatch = store.article?.id === article.id;
      const isExpandedMatch = store.expandedArticleUuid === article.uuid;
      setHighlight(isArticleMatch || isExpandedMatch);
    }, [store.article?.id, store.expandedArticleUuid, article.id, article.uuid]);

    return (
      <li
        className={clsx(
          "list-none border-b border-[var(--gray-4)] relative flex items-start gap-3 select-none transition-colors",
          "group hover:bg-[var(--gray-a3)] hover:cursor-pointer",
          density === "compact" ? "px-3 py-3" : "px-4 py-3",
          {
            "text-[var(--gray-10)]": readStatus === ArticleReadStatus.READ,
            "bg-[var(--accent-a3)] hover:bg-[var(--accent-a3)] border-l-2 border-l-[var(--accent-9)]":
              highlight,
          },
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        ref={ref}
        id={article.uuid}
      >
        {readStatus === ArticleReadStatus.UNREAD && density !== "compact" && (
          <div className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent-9)]" />
        )}
        <div className="min-w-0 flex-1">
          <div
            className={clsx(
              "line-clamp-2 text-[var(--gray-12)]",
              density === "compact"
                ? "text-xs font-semibold leading-5"
                : "text-[13px] font-medium leading-5",
              highlight && "text-[var(--accent-11)]",
            )}
          >
            {article.title}
          </div>
          <div
            className={clsx(
              "mt-1 flex items-center gap-3 text-[11px] text-[var(--gray-9)]",
              density !== "compact" && "justify-between",
            )}
          >
            <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
              {sourceLabel}
            </span>
          </div>
        </div>
      </li>
    );
  },
);
