import React, { ForwardedRef, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useBearStore } from "@/stores";
import { ArticleResItem } from "@/db";
import { ArticleReadStatus, ArticleStarStatus } from "@/typing";
import clsx from "clsx";
import { useShallow } from "zustand/react/shallow";
import { RouteConfig } from "@/config";
import { Star, CheckCheck } from "lucide-react";
import * as dataAgent from "@/helpers/dataAgent";

export const ArticleItem = React.forwardRef(
  (
    props: {
      article: ArticleResItem;
      onRead?: (article: ArticleResItem) => void;
      onExpand?: (article: ArticleResItem) => void;
    },
    ref: ForwardedRef<HTMLDivElement>,
  ) => {
    const store = useBearStore(
      useShallow((state) => ({
        updateArticleStatus: state.updateArticleStatus,
        article: state.article,
        setArticle: state.setArticle,
        expandedArticleUuid: state.expandedArticleUuid,
      })),
    );
    const { article, onRead, onExpand } = props;
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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    };

    const timeLabel = formatDistanceToNow(
      new Date(article.pub_date || article.create_date),
      { includeSeconds: true, addSuffix: true },
    );

    useEffect(() => {
      setReadStatus(article.read_status);
    }, [article.read_status]);

    useEffect(() => {
      const isArticleMatch = store.article?.id === article.id;
      const isExpandedMatch = store.expandedArticleUuid === article.uuid;
      setHighlight(isArticleMatch || isExpandedMatch);
    }, [store.article?.id, store.expandedArticleUuid, article.id, article.uuid]);

    const isDimmed =
      !!store.expandedArticleUuid && store.expandedArticleUuid !== article.uuid;

    return (
      <div
        className={clsx(
          "border-b border-[var(--gray-4)] flex items-start gap-2 px-4 py-2.5 select-none transition-[opacity,background-color] cursor-pointer group border-l-2",
          "hover:bg-[var(--gray-a3)]",
          highlight
            ? "bg-[var(--accent-a2)] hover:bg-[var(--accent-a2)] border-l-[var(--accent-9)]"
            : "border-l-transparent",
          isDimmed && "opacity-30 pointer-events-none",
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        ref={ref}
        id={article.uuid}
      >
        <div
          className={clsx(
            "mt-[5px] w-1.5 h-1.5 rounded-full flex-shrink-0",
            readStatus === ArticleReadStatus.UNREAD
              ? "bg-[var(--accent-9)]"
              : "bg-transparent",
          )}
        />
        {article.feed_logo ? (
          <img
            src={article.feed_logo}
            alt=""
            className="mt-0.5 w-3.5 h-3.5 rounded-[2px] flex-shrink-0 object-cover"
          />
        ) : (
          <div className="mt-0.5 w-3.5 h-3.5 rounded-[2px] flex-shrink-0 bg-[var(--gray-5)]" />
        )}
        <div className="flex-1 min-w-0">
          <div
            className={clsx(
              "text-[13px] font-medium leading-[1.4] line-clamp-2",
              readStatus === ArticleReadStatus.READ
                ? "text-[var(--gray-9)] font-normal"
                : "text-[var(--gray-12)]",
              highlight && "text-[var(--accent-11)]",
            )}
          >
            {article.title}
          </div>
          <div className="text-[11px] text-[var(--gray-9)] mt-0.5 flex items-center gap-1 min-w-0">
            {article.feed_title && (
              <span className="truncate">{article.feed_title}</span>
            )}
            {article.feed_title && (
              <span className="flex-shrink-0">·</span>
            )}
            <span className="flex-shrink-0 whitespace-nowrap">{timeLabel}</span>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-0.5 mt-0.5">
          <button
            type="button"
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--gray-a4)] text-[var(--gray-9)]"
            onClick={(e) => {
              e.stopPropagation();
              const next =
                article.starred === ArticleStarStatus.STARRED
                  ? ArticleStarStatus.UNSTAR
                  : ArticleStarStatus.STARRED;
              dataAgent.updateArticleStarStatus(article.uuid, next);
            }}
          >
            <Star size={11} />
          </button>
          <button
            type="button"
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--gray-a4)] text-[var(--gray-9)]"
            onClick={(e) => {
              e.stopPropagation();
              markAsRead(article);
            }}
          >
            <CheckCheck size={11} />
          </button>
        </div>
      </div>
    );
  },
);
