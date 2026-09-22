import { useTranslation } from "react-i18next";
import { FileSearch } from "lucide-react";
import { Button } from "@radix-ui/themes";
import { ArticleResItem, FeedResItem } from "@/db";
import { RouteConfig } from "@/config";
import { SearchResultCard, HighlightText } from "./utils";

interface SearchResultsProps {
  resultList: ArticleResItem[];
  isFetching: boolean;
  hasMore: boolean;
  query: string;
  selectedFeed: FeedResItem | undefined;
  onLoadMore: () => void;
  onOpenArticle: (article: ArticleResItem) => void;
}

export function SearchResults({
  resultList,
  isFetching,
  hasMore,
  query,
  selectedFeed,
  onLoadMore,
  onOpenArticle,
}: SearchResultsProps) {
  const { t } = useTranslation();

  return (
    <div className="search-results">
      <div className="search-results-summary">
        <span>
          {resultList.length > 0
            ? t("search.result_count", { count: resultList.length })
            : query
              ? t("search.hint_enter")
              : t("search.hint_type")}
        </span>
        {selectedFeed && <span>{t("search.source_label", { title: selectedFeed.title })}</span>}
      </div>

      {resultList.length === 0 && isFetching ? (
        <div className="search-result-stack">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="search-result-card"
            >
              <div className="mb-3 h-3 w-32 rounded bg-[var(--gray-a4)]" />
              <div className="mb-2 h-4 w-3/4 rounded bg-[var(--gray-a4)]" />
              <div className="h-3 w-full rounded bg-[var(--gray-a3)]" />
            </div>
          ))}
        </div>
      ) : resultList.length === 0 ? (
        <div className="search-empty-card">
          <FileSearch
            size={38}
            strokeWidth={1.5}
            className="text-[var(--gray-9)]"
          />
          <h2 className="mt-4 text-base font-semibold text-[var(--gray-12)]">
            {t("search.empty.title")}
          </h2>
          <p className="mt-2 max-w-[360px] text-sm leading-6 text-[var(--gray-10)]">
            {t("search.empty.subtitle")}
          </p>
        </div>
      ) : (
        <div className="search-result-stack">
          {resultList.map((article) => (
            <SearchResultCard
              key={article.uuid}
              article={article}
              query={query}
              onOpen={onOpenArticle}
            />
          ))}
          {hasMore && (
            <Button
              variant="surface"
              color="gray"
              loading={isFetching}
              onClick={onLoadMore}
            >
              {t("search.load_more")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
