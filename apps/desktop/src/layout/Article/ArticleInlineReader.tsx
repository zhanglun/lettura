import { useState, useEffect, useCallback } from "react";
import { ArticleDetail } from "@/components/ArticleView/Detail";
import { ChevronLeft, ChevronRight, Star, Eye, EyeOff, ExternalLink, X } from "lucide-react";
import { ArticleResItem } from "@/db";
import { ArticleReadStatus, ArticleStarStatus } from "@/typing";
import * as dataAgent from "@/helpers/dataAgent";
import { open } from "@tauri-apps/plugin-shell";
import { useTranslation } from "react-i18next";

interface ArticleInlineReaderProps {
  article: ArticleResItem;
  onClose: () => void;
  goNext?: () => void;
  goPrev?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  index: number;
  total: number;
}

function ToolbarBtn({
  icon: Icon,
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  icon: React.ElementType;
  label?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-all disabled:opacity-40 disabled:cursor-default ${
        active
          ? "text-[var(--accent-9)]"
          : "text-[var(--gray-9)] hover:bg-[var(--gray-3)] hover:text-[var(--gray-12)]"
      }`}
    >
      <Icon size={13} />
      {label && <span>{label}</span>}
    </button>
  );
}

export function ArticleInlineReader({
  article,
  onClose,
  goNext,
  goPrev,
  canPrev = false,
  canNext = false,
  index,
  total,
}: ArticleInlineReaderProps) {
  const { t } = useTranslation();
  const [readStatus, setReadStatus] = useState(article.read_status);
  const [starred, setStarred] = useState(article.starred);

  useEffect(() => { setReadStatus(article.read_status); }, [article.read_status]);
  useEffect(() => { setStarred(article.starred); }, [article.starred]);

  const toggleStar = useCallback(() => {
    const next = starred === ArticleStarStatus.UNSTAR ? ArticleStarStatus.STARRED : ArticleStarStatus.UNSTAR;
    dataAgent.updateArticleStarStatus(article.uuid, next).then(() => { article.starred = next; setStarred(next); });
  }, [starred, article]);

  const toggleRead = useCallback(() => {
    const next = readStatus === ArticleReadStatus.UNREAD ? ArticleReadStatus.READ : ArticleReadStatus.UNREAD;
    dataAgent.updateArticleReadStatus(article.uuid, next).then(() => { article.read_status = next; setReadStatus(next); });
  }, [readStatus, article]);

  const handleOpenOriginal = useCallback(() => {
    if (article.link) open(article.link);
  }, [article.link]);

  return (
    <div className="border-t-2 border-[var(--accent-9)] border-b border-[var(--gray-4)] bg-[var(--color-panel-solid)]"
    >
        {/* Toolbar — sticky so it stays visible while the outer list scrolls */}
        <div className="sticky top-0 z-10 flex items-center gap-0.5 px-3 py-1.5 border-b border-[var(--gray-4)] bg-[var(--gray-1)]">
          <ToolbarBtn
            icon={Star}
            label={t(starred === ArticleStarStatus.STARRED ? "Unstar it" : "Star it")}
            active={starred === ArticleStarStatus.STARRED}
            onClick={toggleStar}
          />
          <ToolbarBtn
            icon={readStatus === ArticleReadStatus.READ ? EyeOff : Eye}
            label={t(readStatus === ArticleReadStatus.READ ? "Mark as unread" : "Mark as read")}
            onClick={toggleRead}
          />
          <ToolbarBtn
            icon={ExternalLink}
            label={t("Open in browser")}
            disabled={!article.link}
            onClick={handleOpenOriginal}
          />

          <div className="mx-1 h-4 w-px bg-[var(--gray-4)]" />

          <span className="px-1 text-[11px] text-[var(--gray-8)] tabular-nums flex-shrink-0">
            {index + 1} / {total}
          </span>

          <button
            type="button"
            disabled={!canPrev || !goPrev}
            onClick={() => goPrev?.()}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-[var(--gray-9)] hover:bg-[var(--gray-3)] hover:text-[var(--gray-12)] transition-all disabled:opacity-40 disabled:cursor-default"
          >
            <ChevronLeft size={12} />
            {t("article.view.prev")}
          </button>
          <button
            type="button"
            disabled={!canNext || !goNext}
            onClick={() => goNext?.()}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-[var(--gray-9)] hover:bg-[var(--gray-3)] hover:text-[var(--gray-12)] transition-all disabled:opacity-40 disabled:cursor-default"
          >
            {t("article.view.next")}
            <ChevronRight size={12} />
          </button>

          <div className="mx-1 h-4 w-px bg-[var(--gray-4)]" />

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--gray-9)] transition-all hover:bg-[rgba(220,38,38,0.08)] hover:text-[#dc2626]"
          >
            <X size={14} />
          </button>
        </div>

        {/* Article body — auto height, outer list scrolls */}
        <div>
          <div className="mx-auto max-w-[680px] px-6 pt-5 pb-4">
            <ArticleDetail article={article} />
          </div>
        </div>
    </div>
  );
}
