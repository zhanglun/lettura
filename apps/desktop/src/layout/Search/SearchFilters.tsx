import { useTranslation } from "react-i18next";
import {
  Bookmark,
  Filter,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { Button, IconButton, TextField } from "@radix-ui/themes";
import { ArticleResItem, FeedResItem } from "@/db";
import { SearchChip } from "./utils";

interface SearchFiltersProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: () => void;
  onSaveSearch: () => void;
  isStarred: boolean;
  highSignal: boolean;
  onResetFilters: () => void;
  onToggleStarred: () => void;
  onToggleHighSignal: () => void;
  startDate: string;
  endDate: string;
  feedUuid: string;
  feeds: FeedResItem[];
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  onFeedChange: (v: string) => void;
  hasActiveFilters: boolean;
  currentArticle: ArticleResItem | null;
  onCloseArticle: () => void;
  onClearQuery: () => void;
}

export function SearchFilters({
  query,
  onQueryChange,
  onSearch,
  onSaveSearch,
  isStarred,
  highSignal,
  onResetFilters,
  onToggleStarred,
  onToggleHighSignal,
  startDate,
  endDate,
  feedUuid,
  feeds,
  onStartDateChange,
  onEndDateChange,
  onFeedChange,
  hasActiveFilters,
  currentArticle,
  onCloseArticle,
  onClearQuery,
}: SearchFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="search-header">
      <div className="search-title-row">
        <div>
          <h1 className="search-page-title">
            {t("search.title")}
          </h1>
          <p className="search-page-subtitle">
            {t("search.header.subtitle")}
          </p>
        </div>
        {currentArticle && (
          <IconButton
            variant="ghost"
            color="gray"
            onClick={onCloseArticle}
          >
            <X size={16} />
          </IconButton>
        )}
      </div>
      <div className="search-query-row">
        <TextField.Root
          className="search-query-input"
          size="3"
          value={query}
          placeholder={t("search.placeholder")}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSearch();
          }}
        >
          <TextField.Slot>
            <Search size={16} />
          </TextField.Slot>
          {query && (
            <TextField.Slot>
              <IconButton
                size="1"
                variant="ghost"
                onClick={onClearQuery}
              >
                <X size={14} />
              </IconButton>
            </TextField.Slot>
          )}
        </TextField.Root>
        <Button size="3" onClick={onSearch} disabled={!query.trim()}>
          {t("search.button")}
        </Button>
        <IconButton
          size="3"
          variant="outline"
          color="gray"
          disabled={!query.trim()}
          onClick={onSaveSearch}
          title={t("search.save_search")}
        >
          <Star size={16} />
        </IconButton>
      </div>
      <div className="search-filter-row">
        <SearchChip
          active={!isStarred && !highSignal}
          onClick={onResetFilters}
        >
          {t("search.filter.all")}
        </SearchChip>
        <SearchChip>
          {t("search.filter.articles")}
        </SearchChip>
        <SearchChip>
          {t("search.filter.signals")}
        </SearchChip>
        <SearchChip>
          {t("search.filter.topics")}
        </SearchChip>
        <SearchChip
          active={isStarred}
          onClick={onToggleStarred}
        >
          <Bookmark size={12} />
          {t("search.filter.starred")}
        </SearchChip>
        <SearchChip
          active={highSignal}
          onClick={onToggleHighSignal}
        >
          <Sparkles size={12} />
          {t("search.filter.high_signal")}
        </SearchChip>
        <SearchChip active={hasActiveFilters}>
          <Filter size={12} />
          {t("search.filter.advanced")}
        </SearchChip>
        <div className="search-advanced-controls">
          <input
            type="date"
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
            className="search-filter-input"
          />
          <input
            type="date"
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
            className="search-filter-input"
          />
          <select
            value={feedUuid}
            onChange={(event) => onFeedChange(event.target.value)}
            className="search-filter-select"
          >
            <option value="">{t("search.filter.all_sources")}</option>
            {feeds.map((feed) => (
              <option key={feed.uuid} value={feed.uuid}>
                {feed.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
