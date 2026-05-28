import { formatDistanceToNow, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";
import { Avatar } from "@radix-ui/themes";
import { ArticleResItem } from "@/db";
import { getFeedLogo } from "@/helpers/parseXML";

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable – silently ignore
  }
}

export function stripHtml(value = "") {
  return value.replace(/(<([^>]+)>)/gi, "").replace(/\s+/g, " ").trim();
}

export function formatTime(date?: string) {
  if (!date) return "";
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true });
  } catch {
    return date;
  }
}

export function SearchChip(props: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={
        props.active
          ? "inline-flex items-center gap-1 rounded-full border border-[var(--accent-8)] bg-[var(--accent-a3)] px-3 py-1.5 text-xs font-medium text-[var(--accent-11)]"
          : "inline-flex items-center gap-1 rounded-full border border-[var(--gray-5)] bg-[var(--color-panel-solid)] px-3 py-1.5 text-xs font-medium text-[var(--gray-11)] hover:bg-[var(--gray-a3)]"
      }
    >
      {props.children}
    </button>
  );
}

export function SearchResultCard(props: {
  article: ArticleResItem;
  query: string;
  onOpen: (article: ArticleResItem) => void;
}) {
  const { t } = useTranslation();
  const { article, query, onOpen } = props;
  const description = stripHtml(article.description || article.content || "");
  const match = query.trim();
  const hasMatch = match && description.toLowerCase().includes(match.toLowerCase());
  const before = hasMatch
    ? description.slice(0, description.toLowerCase().indexOf(match.toLowerCase()))
    : description;
  const hit = hasMatch
    ? description.slice(
        description.toLowerCase().indexOf(match.toLowerCase()),
        description.toLowerCase().indexOf(match.toLowerCase()) + match.length,
      )
    : "";
  const after = hasMatch
    ? description.slice(
        description.toLowerCase().indexOf(match.toLowerCase()) + match.length,
      )
    : "";

  return (
    <button
      type="button"
      onClick={() => onOpen(article)}
      className="search-result-card search-result-card--article"
    >
      <div className="search-result-meta">
        <span className="search-result-type">
          {t("search.result_type.article")}
        </span>
        <Avatar
          size="1"
          src={article.feed_logo || getFeedLogo(article.feed_url)}
          fallback={article.feed_title?.slice(0, 1) || "L"}
          className="rounded"
        />
        <span className="search-result-source">
          {article.feed_title || t("search.unknown_feed")}
        </span>
        {article.starred === 1 && (
          <span className="search-result-tag search-result-tag--starred">
            {t("search.filter.starred")}
          </span>
        )}
        <span className="search-result-time">
          {formatTime(article.create_date)}
        </span>
      </div>
      <div className="search-result-title">
        {article.title}
      </div>
      <p className="search-result-snippet">
        {hasMatch ? (
          <>
            {before.slice(-120)}
            <mark className="search-result-mark">
              {hit}
            </mark>
            {after.slice(0, 220)}
          </>
        ) : (
          description || t("search.no_summary")
        )}
      </p>
    </button>
  );
}
