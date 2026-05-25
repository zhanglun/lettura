import React, { useRef, useCallback, useState } from "react";
import { ChevronLeft, CheckCheck, RefreshCw, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FeedResItem } from "@/db";
import { FeedArticleList, FeedArticleListRefObject } from "./FeedArticleList";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import clsx from "clsx";
import { ArticleReadStatus } from "@/typing";

interface FeedsArticlesProps {
  feed: FeedResItem;
  onBack: () => void;
}

function getHealthColor(status: number | undefined): string {
  switch (status) {
    case 1: return "bg-amber-500";
    case 2: return "bg-red-500";
    default: return "bg-green-500";
  }
}

export const FeedsArticles = React.memo(function FeedsArticles({ feed, onBack }: FeedsArticlesProps) {
  const { t } = useTranslation();
  const colRef = useRef<FeedArticleListRefObject>(null);
  const [syncing, setSyncing] = useState(false);

  const store = useBearStore(
    useShallow((state) => ({
      currentFilter: state.currentFilter,
      setFilter: state.setFilter,
      syncArticles: state.syncArticles,
    })),
  );

  const filters = [
    { id: 0, title: t("All articles") },
    { id: ArticleReadStatus.UNREAD, title: t("Unread") },
    { id: ArticleReadStatus.READ, title: t("Read") },
  ];

  const handleMarkAllRead = useCallback(() => {
    colRef.current?.markAllRead();
  }, []);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      await store.syncArticles(feed);
    } finally {
      setSyncing(false);
    }
  }, [feed, store.syncArticles]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header — flex-shrink-0, stays fixed above scrolling list */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2 border-b border-[var(--gray-4)] bg-[var(--gray-1)] flex-shrink-0 flex-wrap">
        {/* Left: back + feed identity */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            className="flex items-center justify-center w-6 h-6 rounded hover:bg-[var(--gray-a4)] text-[var(--gray-9)] flex-shrink-0 transition-colors"
            onClick={onBack}
          >
            <ChevronLeft size={14} />
          </button>
          {feed.logo ? (
            <img src={feed.logo} alt="" className="w-4 h-4 rounded-[3px] flex-shrink-0" />
          ) : (
            <div className="w-4 h-4 rounded-[3px] flex-shrink-0 bg-[var(--gray-5)] flex items-center justify-center text-[8px] text-[var(--gray-9)]">
              {feed.title?.charAt(0)?.toUpperCase() ?? "F"}
            </div>
          )}
          <span className="text-[13px] font-semibold text-[var(--gray-12)] truncate">{feed.title}</span>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getHealthColor(feed.health_status)}`} />
          {feed.unread > 0 && (
            <span className="text-[11px] text-[var(--gray-9)] flex-shrink-0">{feed.unread} {t("Unread")}</span>
          )}
        </div>

        {/* Right: search + filter tabs + sync + mark all read */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--gray-9)] pointer-events-none" />
            <input
              placeholder={t("article.search_placeholder") || "搜索文章..."}
              className="pl-6 pr-2 py-1 text-[11px] border border-[var(--gray-5)] rounded-md bg-[var(--gray-1)] text-[var(--gray-12)] outline-none focus:border-[var(--accent-8)] w-[140px] placeholder:text-[var(--gray-8)]"
            />
          </div>
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
            disabled={syncing}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-[var(--gray-9)] hover:text-[var(--gray-12)] hover:bg-[var(--gray-a3)] rounded-md transition-colors disabled:opacity-50"
            onClick={handleSync}
            title={t("Reload feeds")}
          >
            <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-[var(--gray-9)] hover:text-[var(--gray-12)] hover:bg-[var(--gray-a3)] rounded-md transition-colors"
            onClick={handleMarkAllRead}
          >
            <CheckCheck size={12} />
            {t("Mark all as read")}
          </button>
        </div>
      </div>

      {/* Article list — flex-1 min-h-0 so it scrolls without pushing header */}
      <FeedArticleList ref={colRef} feedUuid={feed.uuid} />
    </div>
  );
});
