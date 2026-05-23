import { useState } from "react";
import { Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Signal } from "@/stores/createTodaySlice";

interface EvidencePanelProps {
  signal: Signal | null;
}

const PREVIEW_COUNT = 5;

export function EvidencePanel({ signal }: EvidencePanelProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  if (!signal) return null;

  const hasMore = signal.sources.length > PREVIEW_COUNT;
  const visibleSources = expanded ? signal.sources : signal.sources.slice(0, PREVIEW_COUNT);

  return (
    <div className="min-w-0 px-4 py-5">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="text-[11px] font-semibold text-[var(--gray-9)] uppercase tracking-[0.5px]">
          {t("today.right_panel.evidence_title")}
        </div>
        {hasMore && (
          <Text size="1" className="text-[var(--gray-8)]">
            ({signal.sources.length})
          </Text>
        )}
      </div>

      <div className="flex min-w-0 flex-col">
        {visibleSources.map((source, index) => (
          <div
            key={source.article_id}
            className={`flex min-w-0 gap-2.5 py-2 text-xs ${index < visibleSources.length - 1 ? 'border-b border-[var(--gray-4)]' : ''}`}
          >
            <span className="min-w-[80px] max-w-[100px] shrink-0 break-words font-medium leading-relaxed text-[var(--gray-12)]">
              {source.feed_title}
            </span>
            <span className="min-w-0 break-words leading-relaxed text-[var(--gray-11)]">
              {source.title}
            </span>
          </div>
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
    </div>
  );
}
