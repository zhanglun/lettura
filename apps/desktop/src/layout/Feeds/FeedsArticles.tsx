import React from "react";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FeedResItem } from "@/db";
import { ArticleCol } from "@/layout/Article/ArticleCol";

interface FeedsArticlesProps {
  feed: FeedResItem;
  onBack: () => void;
}

function getHealthColor(status: number | undefined): string {
  switch (status) {
    case 1:
      return "bg-amber-500";
    case 2:
      return "bg-red-500";
    default:
      return "bg-green-500";
  }
}

export const FeedsArticles = React.memo(function FeedsArticles({
  feed,
  onBack,
}: FeedsArticlesProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border)] flex-shrink-0">
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          onClick={onBack}
        >
          <ChevronLeft size={14} />
          {t("feeds.back")}
        </button>
        <div className="mx-1 h-4 w-px bg-[var(--border)]" />
        {feed.logo ? (
          <img
            src={feed.logo}
            alt=""
            className="w-5 h-5 rounded-[3px] flex-shrink-0"
          />
        ) : (
          <div className="w-5 h-5 rounded-[3px] flex-shrink-0 bg-[var(--border)] flex items-center justify-center text-[9px] text-[var(--text-tertiary)]">
            {feed.title?.charAt(0)?.toUpperCase() ?? "F"}
          </div>
        )}
        <span className="text-sm font-medium text-[var(--text-primary)] truncate">
          {feed.title}
        </span>
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${getHealthColor(feed.health_status)}`}
        />
        {feed.unread > 0 && (
          <span className="text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-[var(--accent-light)] text-[var(--accent-text)]">
            {feed.unread}
          </span>
        )}
      </div>
      <ArticleCol feedUuid={feed.uuid} showFilters />
    </div>
  );
});
