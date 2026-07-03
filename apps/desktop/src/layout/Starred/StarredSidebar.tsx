import { useTranslation } from "react-i18next";
import { Tags } from "lucide-react";
import type { CollectionItem, TagItem } from "@/helpers/starredApi";

interface StarredSidebarProps {
  collections: CollectionItem[];
  tags: TagItem[];
  activeCollection: string | null;
  activeTag: string | null;
  onSelectCollection: (uuid: string | null) => void;
  onSelectTag: (uuid: string | null) => void;
  onSelectAll: () => void;
  totalArticles: number;
}

export function StarredSidebar({
  collections,
  tags,
  activeCollection,
  activeTag,
  onSelectCollection,
  onSelectTag,
  onSelectAll,
  totalArticles,
}: StarredSidebarProps) {
  const { t } = useTranslation();

  return (
    <aside className="starred-library-sidebar">
      <div className="starred-library-header">
        <div className="starred-library-title">
          Starred
        </div>
        <div className="starred-library-desc">
          {t("starred.subtitle")}
        </div>
      </div>
      <div className="starred-library-content">
        <div className="starred-library-section-title">
          {t("starred.sidebar.collections")}
        </div>
        <button
          type="button"
          onClick={onSelectAll}
          className={
            activeCollection === null && activeTag === null
              ? "starred-library-item starred-library-item--active"
              : "starred-library-item"
          }
        >
          <span
            className="starred-library-dot"
            style={{ background: "var(--amber-9)" }}
          />
          <span>{t("starred.sidebar.all")}</span>
          <span className="starred-library-count">
            {totalArticles}
          </span>
        </button>
        {collections.map((collection) => (
          <button
            type="button"
            key={collection.uuid}
            onClick={() => onSelectCollection(collection.uuid)}
            className={
              activeCollection === collection.uuid
                ? "starred-library-item starred-library-item--active"
                : "starred-library-item"
            }
          >
            <span
              className="starred-library-dot"
              style={{ background: "var(--accent-9)" }}
            />
            <span>{collection.name}</span>
            {typeof collection.article_count === "number" && (
              <span className="starred-library-count">
                {collection.article_count}
              </span>
            )}
          </button>
        ))}

        <div className="starred-library-section-title starred-library-section-title--spaced">
          {t("starred.sidebar.tags")}
        </div>
        {tags.map((tag) => (
          <button
            type="button"
            key={tag.uuid}
            onClick={() => onSelectTag(tag.uuid)}
            className={
              activeTag === tag.uuid
                ? "starred-library-item starred-library-item--active"
                : "starred-library-item"
            }
          >
            <Tags size={12} />
            #{tag.name}
            {typeof tag.article_count === "number" && (
              <span className="starred-library-count">
                {tag.article_count}
              </span>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}
