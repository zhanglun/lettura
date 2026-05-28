import { useTranslation } from "react-i18next";
import { Bookmark, Calendar, Rss } from "lucide-react";
import type { TopicItem } from "@/stores/topicSlice";
import { SearchChip } from "./utils";

interface SearchInsightPanelProps {
  searchInsight: { summary: string; details: string[] } | null;
  relatedTopics: TopicItem[];
  isStarred: boolean;
  hasActiveFilters: boolean;
  onToggleStarred: () => void;
  onSetDateRange: (start: string, end: string) => void;
  onClearFilters: () => void;
  onNavigateToTopic: (uuid: string) => void;
}

export function SearchInsightPanel({
  searchInsight,
  relatedTopics,
  isStarred,
  hasActiveFilters,
  onToggleStarred,
  onSetDateRange,
  onClearFilters,
  onNavigateToTopic,
}: SearchInsightPanelProps) {
  const { t } = useTranslation();

  return (
    <aside className="search-insight-panel">
      <div className="search-insight-section">
        <div className="search-insight-title">
          {t("search.insight.title")}
        </div>
        <div className="search-insight-card">
          {searchInsight ? (
            <>
              <div className="search-insight-card-title">
                {searchInsight.summary}
              </div>
              {searchInsight.details.length > 0 && (
                <p className="search-insight-card-text">
                  {searchInsight.details.join("；")}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="search-insight-card-title">
                {t("search.insight.title_text")}
              </div>
              <p className="search-insight-card-text">
                {t("search.insight.description")}
              </p>
            </>
          )}
        </div>
      </div>
      <div className="search-insight-section">
        <div className="search-insight-title">
          {t("search.quick_filter.title")}
        </div>
        <div className="search-quick-filter-list">
          <SearchChip
            active={hasActiveFilters}
            onClick={() => {
              if (hasActiveFilters) {
                onClearFilters();
              } else {
                const now = new Date();
                const thirtyDaysAgo = new Date(
                  now.getTime() - 30 * 24 * 60 * 60 * 1000,
                );
                onSetDateRange(thirtyDaysAgo.toISOString().split("T")[0], now.toISOString().split("T")[0]);
              }
            }}
          >
            <Calendar size={12} />
            {t("search.quick_filter.last_30_days")}
          </SearchChip>
          <SearchChip>
            <Rss size={12} />
            {t("search.quick_filter.all_sources")}
          </SearchChip>
          <SearchChip
            active={isStarred}
            onClick={onToggleStarred}
          >
            <Bookmark size={12} />
            {t("search.quick_filter.starred_only")}
          </SearchChip>
        </div>
      </div>
      <div>
        <div className="search-insight-title">
          {t("search.related_topics")}
        </div>
        {relatedTopics.length > 0 ? (
          relatedTopics.map((topic) => (
            <button
              type="button"
              key={topic.id}
              className="search-related-topic"
              onClick={() => onNavigateToTopic(topic.uuid)}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-9)]" />
              <span className="truncate">{topic.title}</span>
              <span className="ml-auto text-[10px] text-[var(--gray-8)]">
                {topic.article_count}
              </span>
            </button>
          ))
        ) : (
          <div className="text-xs text-[var(--gray-9)]">
            {t("search.related_topics_empty")}
          </div>
        )}
      </div>
    </aside>
  );
}
