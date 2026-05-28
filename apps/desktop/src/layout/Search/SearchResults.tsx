import { useTranslation } from "react-i18next";
import { FileSearch } from "lucide-react";
import { Button } from "@radix-ui/themes";
import { ArticleResItem, FeedResItem } from "@/db";
import { RouteConfig } from "@/config";
import type { SignalSearchResult, TopicSearchResult } from "./types";
import { SearchResultCard } from "./utils";

interface SearchResultsProps {
  resultList: ArticleResItem[];
  signalResults: SignalSearchResult[];
  topicResults: TopicSearchResult[];
  isFetching: boolean;
  hasMore: boolean;
  query: string;
  selectedFeed: FeedResItem | undefined;
  onLoadMore: () => void;
  onOpenArticle: (article: ArticleResItem) => void;
  onNavigateToToday: () => void;
  onNavigateToTopic: (uuid: string) => void;
}

export function SearchResults({
  resultList,
  signalResults,
  topicResults,
  isFetching,
  hasMore,
  query,
  selectedFeed,
  onLoadMore,
  onOpenArticle,
  onNavigateToToday,
  onNavigateToTopic,
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

      {signalResults.length > 0 && (
        <div className="search-result-section">
          <div className="search-result-section-title">
            {t("search.section.signals")}
          </div>
          <div className="search-result-stack">
            {signalResults.map((signal, i) => (
              <div
                key={i}
                className="search-result-card search-result-card--signal"
                onClick={onNavigateToToday}
              >
                <div className="search-result-meta">
                  <span className="search-result-type">
                    {t("search.result_type.signal")}
                  </span>
                  {signal.topic_title && (
                    <span className="search-result-tag search-result-tag--topic">
                      {signal.topic_title}
                    </span>
                  )}
                  <span className="search-result-time">
                    {t("search.result_meta", {
                      articles: signal.article_count,
                      sources: signal.source_count,
                    })}
                  </span>
                </div>
                <div className="search-result-title">{signal.signal_title}</div>
                {signal.summary && (
                  <p className="search-result-snippet">{signal.summary}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {topicResults.length > 0 && (
        <div className="search-result-section">
          <div className="search-result-section-title">
            {t("search.section.topics")}
          </div>
          <div className="search-result-stack">
            {topicResults.map((topic) => (
              <div
                key={topic.uuid}
                className="search-result-card search-result-card--topic"
                onClick={() => onNavigateToTopic(topic.uuid)}
              >
                <div className="search-result-meta">
                  <span className="search-result-type">
                    {t("search.result_type.topic")}
                  </span>
                  <span className="search-result-time">
                    {t("search.result_meta", {
                      articles: topic.article_count,
                      sources: topic.source_count,
                    })}
                  </span>
                </div>
                <div className="search-result-title">{topic.title}</div>
                {topic.description && (
                  <p className="search-result-snippet">{topic.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
