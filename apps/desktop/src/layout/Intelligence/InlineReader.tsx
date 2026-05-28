import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ChevronLeft, ExternalLink, Star, Loader2, AlertCircle, RotateCw } from "lucide-react";
import type { SignalSource } from "@/stores/createTodaySlice";
import type { ArticleResItem } from "@/db";
import { useBearStore } from "@/stores";
import { pickArticleContent, processArticleHtml } from "@/helpers/articleContent";
import { wraperWithRadix } from "@/components/ArticleView/ContentRender";
import { ArticleNavFooter } from "@/components/ArticleNavFooter";

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

  const rawContent = pickArticleContent(articleDetail?.content, articleDetail?.description, source.excerpt);
  const processedHtml = processArticleHtml(rawContent);
  const contentElement = wraperWithRadix(processedHtml);
  const hasContent = rawContent.length > 0;

  return (
    <div className="today-reading-panel">
      <div className="today-reading-header">
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
                updateArticleStarStatus(source.article_uuid, newStatus).then(() => {
                  const store = useBearStore.getState();
                  const list = store.articleList;
                  const idx = list.findIndex((a) => a.uuid === source.article_uuid);
                  if (idx !== -1) {
                    const updated = [...list];
                    updated[idx] = { ...updated[idx], starred: newStatus };
                    store.setArticleList(updated);
                  }
                });
              });
            }
          }}
          className="p-1 rounded transition-colors"
          style={{ color: localStarred ? "var(--accent-9)" : "var(--gray-9)" }}
        >
          <Star size={14} fill={localStarred ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="today-reading-body">
        <div
          className="today-reading-feed"
        >
          {source.feed_title}
        </div>
        <h1 className="today-reading-title">{source.title}</h1>
        <div className="today-reading-meta">
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
          <div className="today-reading-content">
            {contentElement}
          </div>
        )}

        {!articleLoading && !articleError && !hasContent && (
          <div className="rounded-lg border border-[var(--gray-5)] bg-[var(--gray-2)] px-5 py-12 text-center text-sm leading-6 text-[var(--gray-9)]">
            {t("today.inline_reader.content_placeholder")}
          </div>
        )}
      </div>

      <ArticleNavFooter
        canPrev={canGoPrev}
        canNext={canGoNext}
        onPrev={() => onNavigate(currentIndex - 1)}
        onNext={() => onNavigate(currentIndex + 1)}
        prevLabel={t("today.inline_reader.prev")}
        nextLabel={t("today.inline_reader.next")}
        label={source.feed_title}
      />
    </div>
  );
}
