import { useState } from "react";
import { Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Signal } from "@/stores/createTodaySlice";

interface EvidencePanelProps {
  signal: Signal | null;
  onInlineRead?: (articleUuid: string, feedUuid: string, articleId: number) => void;
}

const PREVIEW_COUNT = 5;

export function EvidencePanel({ signal, onInlineRead }: EvidencePanelProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  if (!signal) return null;

  const hasMore = signal.sources.length > PREVIEW_COUNT;
  const visibleSources = expanded ? signal.sources : signal.sources.slice(0, PREVIEW_COUNT);

  return (
    <section className="today-right-section">
      <div className="mb-2.5 flex items-center gap-2">
        <div className="today-right-title mb-0">
          {t("today.right_panel.evidence_title")}
        </div>
        {hasMore && (
          <Text size="1" className="text-[var(--gray-8)]">
            ({signal.sources.length})
          </Text>
        )}
      </div>

      <div className="flex min-w-0 flex-col">
        {visibleSources.map((source) => (
          <button
            type="button"
            key={source.article_id}
            className="today-evidence-card"
            onClick={() =>
              onInlineRead?.(
                source.article_uuid,
                source.feed_uuid,
                source.article_id,
              )
            }
          >
            <span className="today-evidence-source">
              {source.feed_title}
            </span>
            <div className="today-evidence-title">
              {source.title}
            </div>
          </button>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-2 text-xs text-[var(--gray-9)] hover:text-[var(--gray-11)] transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp size={12} />
              {t("today.right_panel.show_less")}
            </>
          ) : (
            <>
              <ChevronDown size={12} />
              {t("today.right_panel.show_more", { count: signal.sources.length - PREVIEW_COUNT })}
            </>
          )}
        </button>
      )}
    </section>
  );
}
