import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, ExternalLink, Star, Loader2, AlertCircle, RotateCw } from "lucide-react";
import DOMPurify from "dompurify";
import type { SignalSource } from "@/stores/createTodaySlice";
import type { ArticleResItem } from "@/db";

interface InlineReaderProps {
  source: SignalSource;
  sources: SignalSource[];
  currentIndex: number;
  onBack: () => void;
  onNavigate: (index: number) => void;
  articleDetail: ArticleResItem | null;
  articleLoading: boolean;
  articleError: string | null;
  onRetry: () => void;
}

function getArticleContent(detail: ArticleResItem | null, excerpt: string | null): string {
  if (detail) {
    const { content, description } = detail;
    if (content && description) {
      return content.length > description.length ? content : description;
    }
    if (content || description) {
      return content || description || "";
    }
  }
  return excerpt?.trim() || "";
}

function sanitizeContent(html: string): string {
  let result = html;
  result = result.replace(/<a[^>]+>/gi, (a: string) => {
    if (!/\starget\s*=/gi.test(a)) {
      return a.replace(/^<a\s/, '<a target="_blank"');
    }
    return a;
  });
  result = result.replace(/<img\s+(?:[^>]*?\s+)?src="([^"]*)"[^>]*>/g, (match, src) => {
    return `<img src="${src}" style="max-width:100%;height:auto;" />`;
  });
  return DOMPurify.sanitize(result);
}

function formatSourceDate(date?: string) {
  if (!date) {
    return "";
  }
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true });
  } catch {
    return date;
  }
}

export function InlineReader({
  source,
  sources,
  currentIndex,
  onBack,
  onNavigate,
  articleDetail,
  articleLoading,
  articleError,
  onRetry,
}: InlineReaderProps) {
  const { t } = useTranslation();
  const [localStarred, setLocalStarred] = useState(false);

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < sources.length - 1;
  const sourceDate = formatSourceDate(source.pub_date);

  const htmlContent = sanitizeContent(getArticleContent(articleDetail, source.excerpt));
  const hasContent = htmlContent.length > 0;

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div
        className="flex min-w-0 items-center gap-2 px-5 py-3 border-b border-[var(--gray-4)] shrink-0"
      >
        <button
          onClick={onBack}
          className="flex shrink-0 items-center gap-1 text-[11px] text-[var(--gray-9)] hover:text-[var(--gray-12)] transition-colors px-2 py-1 rounded hover:bg-[var(--gray-3)]"
        >
          <ChevronLeft size={14} />
          <span>{t("today.inline_reader.back")}</span>
        </button>

        <div className="flex-1" />

        <span className="min-w-0 break-words text-[10px] text-[var(--gray-8)]">
          {t("today.inline_reader.source_of", { current: currentIndex + 1, total: sources.length })}
        </span>

        <a
          href={source.link}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 rounded text-[var(--gray-9)] hover:text-[var(--gray-12)] hover:bg-[var(--gray-3)] transition-colors"
        >
          <ExternalLink size={14} />
        </a>

        <button
          onClick={() => {
            if (source.article_uuid) {
              const newStatus = !localStarred ? 1 : 0;
              setLocalStarred(!localStarred);
              import("@/helpers/dataAgent").then(({ updateArticleStarStatus }) => {
                updateArticleStarStatus(source.article_uuid, newStatus);
              });
            }
          }}
          className="p-1 rounded transition-colors"
          style={{ color: localStarred ? "var(--accent-9)" : "var(--gray-9)" }}
        >
          <Star size={14} fill={localStarred ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="min-w-0 flex-1 overflow-auto px-7 py-6">
        <div
          className="mb-2 break-words text-[10px] font-semibold uppercase tracking-[0.5px]"
          style={{ color: "var(--accent-9)" }}
        >
          {source.feed_title}
        </div>
        <h1
          className="mb-3 break-words text-[20px] font-bold leading-[1.3] text-[var(--gray-12)]"
        >
          {source.title}
        </h1>
        <div className="mb-6 break-words text-[12px] leading-5 text-[var(--gray-9)]">
          {source.feed_title}
          {sourceDate && <> · {sourceDate}</>}
        </div>

        {articleLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-sm text-[var(--gray-9)]">
            <Loader2 className="animate-spin mb-3" size={24} />
            {t("today.inline_reader.loading")}
          </div>
        )}

        {articleError && !articleLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle size={32} className="text-[var(--red-9)] mb-3" />
            <p className="text-sm text-[var(--gray-11)] mb-3">{articleError}</p>
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 text-sm text-[var(--accent-9)] hover:text-[var(--accent-10)] transition-colors"
            >
              <RotateCw size={14} />
              {t("today.inline_reader.retry")}
            </button>
          </div>
        )}

        {!articleLoading && !articleError && hasContent && (
          <div
            className="prose prose-sm max-w-none break-words text-[14px] text-[var(--gray-11)] leading-[1.8]"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        )}

        {!articleLoading && !articleError && !hasContent && (
          <div className="rounded-lg border border-[var(--gray-5)] bg-[var(--gray-2)] px-5 py-12 text-center text-sm leading-6 text-[var(--gray-9)]">
            {t("today.inline_reader.content_placeholder")}
          </div>
        )}
      </div>

      <div
        className="flex min-w-0 items-center gap-2 px-5 py-3 border-t border-[var(--gray-4)] shrink-0"
      >
        <button
          onClick={() => canGoPrev && onNavigate(currentIndex - 1)}
          disabled={!canGoPrev}
          className="flex items-center gap-1 text-[11px] text-[var(--gray-9)] hover:text-[var(--gray-12)] transition-colors px-2 py-1 rounded hover:bg-[var(--gray-3)] disabled:opacity-40 disabled:cursor-default disabled:hover:bg-transparent"
        >
          <ChevronLeft size={14} />
          <span>{t("today.inline_reader.prev")}</span>
        </button>

        <div className="flex-1" />

        <span className="min-w-0 break-words text-center text-[10px] text-[var(--gray-8)]">
          {source.feed_title}
        </span>

        <div className="flex-1" />

        <button
          onClick={() => canGoNext && onNavigate(currentIndex + 1)}
          disabled={!canGoNext}
          className="flex items-center gap-1 text-[11px] text-[var(--gray-9)] hover:text-[var(--gray-12)] transition-colors px-2 py-1 rounded hover:bg-[var(--gray-3)] disabled:opacity-40 disabled:cursor-default disabled:hover:bg-transparent"
        >
          <span>{t("today.inline_reader.next")}</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
