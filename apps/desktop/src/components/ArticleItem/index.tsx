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

export type ArticleItemDensity = "regular" | "compact" | "feeds";

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

    if (density === "feeds") {
      return (
        <li
          className={clsx(
            "list-none border-b border-[var(--gray-4)] flex items-center gap-2.5 px-[18px] py-2.5 select-none transition-colors cursor-pointer group border-l-2",
            "hover:bg-[var(--gray-a3)]",
            highlight
              ? "bg-[var(--accent-a2)] hover:bg-[var(--accent-a2)] border-l-[var(--accent-9)]"
              : "border-l-transparent",
          )}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          ref={ref}
          id={article.uuid}
        >
          <div className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0", readStatus === ArticleReadStatus.UNREAD ? "bg-[var(--accent-9)]" : "bg-transparent")} />
          {article.feed_logo ? (
            <img src={article.feed_logo} alt="" className="w-3.5 h-3.5 rounded-[2px] flex-shrink-0 object-cover" />
          ) : (
            <div className="w-3.5 h-3.5 rounded-[2px] flex-shrink-0 bg-[var(--gray-5)]" />
          )}
          <div className="flex-1 min-w-0">
            <div className={clsx(
              "text-[13px] font-medium leading-[1.4] truncate",
              readStatus === ArticleReadStatus.READ ? "text-[var(--gray-9)] font-normal" : "text-[var(--gray-12)]",
              highlight && "text-[var(--accent-11)]",
            )}>
              {article.title}
            </div>
            <div className="text-[11px] text-[var(--gray-9)] mt-0.5 flex gap-1 items-center">
              {article.author && <span className="truncate max-w-[120px]">{article.author}</span>}
              {article.author && <span>·</span>}
              <span className="truncate">{article.feed_title}</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center gap-0.5">
            <span className="text-[10px] text-[var(--gray-9)] whitespace-nowrap min-w-[28px] text-right mr-1">{timeLabel}</span>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
              <button
                type="button"
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--gray-a4)] text-[var(--gray-9)]"
                onClick={(e) => {
                  e.stopPropagation();
                  const next = article.starred === ArticleStarStatus.STARRED ? ArticleStarStatus.UNSTAR : ArticleStarStatus.STARRED;
                  dataAgent.updateArticleStarStatus(article.uuid, next);
                }}
              >
                <Star size={11} />
              </button>
              <button
                type="button"
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--gray-a4)] text-[var(--gray-9)]"
                onClick={(e) => { e.stopPropagation(); markAsRead(article); }}
              >
                <CheckCheck size={11} />
              </button>
            </div>
          </div>
        </li>
      );
    }

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
