import { ArticleDetail } from "@/components/ArticleView/Detail";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { ArticleResItem } from "@/db";
import { ReaderControlBtn, ReaderControls } from "@/components/ReaderControls";
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
  onArticleUpdate?: (updated: ArticleResItem) => void;
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
  onArticleUpdate,
}: ArticleInlineReaderProps) {
  const { t } = useTranslation();

  return (
    <div className="border-t-2 border-[var(--accent-9)] border-b border-[var(--gray-4)] bg-[var(--color-panel-solid)]">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex items-center gap-0.5 px-3 py-1.5 border-b border-[var(--gray-4)] bg-[var(--gray-1)]">
        <ReaderControls
          article={article}
          showBrowser
          onStarChange={onArticleUpdate}
          onReadChange={onArticleUpdate}
        />

        <div className="mx-1 h-4 w-px bg-[var(--gray-4)]" />

        <span className="px-1 text-[11px] text-[var(--gray-8)] tabular-nums flex-shrink-0">
          {index + 1} / {total}
        </span>

        <ReaderControlBtn
          icon={ChevronLeft}
          label={t("article.view.prev")}
          disabled={!canPrev || !goPrev}
          onClick={() => goPrev?.()}
        />
        <ReaderControlBtn
          icon={ChevronRight}
          label={t("article.view.next")}
          disabled={!canNext || !goNext}
          onClick={() => goNext?.()}
        />

        <div className="mx-1 h-4 w-px bg-[var(--gray-4)]" />

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--gray-9)] transition-all hover:bg-[rgba(220,38,38,0.08)] hover:text-[#dc2626]"
        >
          <X size={14} />
        </button>
      </div>

      {/* Article body */}
      <div>
        <div className="mx-auto max-w-[680px] px-6 pt-5 pb-4">
          <ArticleDetail article={article} />
        </div>
      </div>
    </div>
  );
}
