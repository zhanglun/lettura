import { useTranslation } from "react-i18next";
import { Archive, Bookmark } from "lucide-react";
import { ArticleResItem } from "@/db";
import { CollectionSuggestion } from "./CollectionSuggestion";

interface StarredStatsPanelProps {
  articles: ArticleResItem[];
  feedCount: number;
  withNotesCount: number;
  suggestion: { collectionName: string; articleCount: number } | null;
  onOpenArticle: (article: ArticleResItem) => void;
  onCreateCollection: (name: string) => Promise<void>;
}

export function StarredStatsPanel({
  articles,
  feedCount,
  withNotesCount,
  suggestion,
  onOpenArticle,
  onCreateCollection,
}: StarredStatsPanelProps) {
  const { t } = useTranslation();

  return (
    <aside className="starred-panel">
      <div className="starred-panel-section">
        <div className="starred-panel-title">
          {t("starred.stats.title")}
        </div>
        <div className="starred-stats-grid">
          <div className="starred-stat-card">
            <div className="starred-stat-value">
              {articles.length}
            </div>
            <div className="starred-stat-label">
              {t("starred.stats.all")}
            </div>
          </div>
          <div className="starred-stat-card">
            <div className="starred-stat-value starred-stat-value--accent">
              {feedCount}
            </div>
            <div className="starred-stat-label">
              {t("starred.stats.sources")}
            </div>
          </div>
        </div>
      </div>

      <CollectionSuggestion
        suggestion={suggestion}
        withNotesCount={withNotesCount}
        onCreateCollection={onCreateCollection}
      />

      <div className="starred-panel-section">
        <div className="starred-panel-title">
          {t("starred.queue.title")}
        </div>
        {articles.slice(0, 3).map((article) => (
          <button
            type="button"
            key={article.uuid}
            onClick={() => onOpenArticle(article)}
            className="starred-queue-item"
          >
            <Bookmark size={13} className="starred-queue-icon" />
            <span className="starred-queue-title">{article.title}</span>
          </button>
        ))}
        {articles.length === 0 && (
          <div className="starred-queue-empty">
            <Archive size={14} className="mb-2" />
            {t("starred.queue.empty")}
          </div>
        )}
      </div>
    </aside>
  );
}
