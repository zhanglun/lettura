import { Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import type { Signal } from "@/stores/createTodaySlice";

interface EvidencePanelProps {
  signal: Signal | null;
}

export function EvidencePanel({ signal }: EvidencePanelProps) {
  const { t } = useTranslation();

  if (!signal) return null;

  const visibleCount = Math.min(signal.sources.length, 5);

  return (
    <div className="min-w-0 p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <Text size="2" weight="medium" className="min-w-0 text-[var(--gray-12)] uppercase text-[11px] tracking-wide">
          {t("today.right_panel.evidence_title")}
        </Text>
      </div>

      <div className="flex min-w-0 flex-col">
        {signal.sources.slice(0, 5).map((source, index) => (
          <div
            key={source.article_id}
            className={`flex min-w-0 gap-2.5 py-2 text-xs ${index < visibleCount - 1 ? 'border-b border-[var(--gray-4)]' : ''}`}
          >
            <span className="min-w-[72px] max-w-[92px] shrink-0 break-words font-medium leading-relaxed text-[var(--gray-12)]">
              {source.feed_title}
            </span>
            <span className="min-w-0 break-words leading-relaxed text-[var(--gray-11)]">
              {source.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
