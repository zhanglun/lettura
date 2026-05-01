import { Text, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { FileText, ShieldCheck } from "lucide-react";
import type { Signal } from "@/stores/createTodaySlice";

interface EvidencePanelProps {
  signal: Signal | null;
}

export function EvidencePanel({ signal }: EvidencePanelProps) {
  const { t } = useTranslation();

  if (!signal) return null;

  const uniqueFeeds = new Set(signal.sources.map((s) => s.feed_uuid)).size;

  return (
    <div className="p-4">
      <Flex align="center" gap="2" mb="3">
        <ShieldCheck size={16} className="text-[var(--accent-9)]" />
        <Text size="2" weight="medium" className="text-[var(--gray-12)]">
          {t("today.right_panel.evidence_title")}
        </Text>
      </Flex>

      <Flex align="center" gap="2" mb="3">
        <Text size="2" className="text-[var(--gray-11)]">
          {signal.source_count} {t("today.signal_card.articles")}
        </Text>
        <Text size="1" className="text-[var(--gray-8)]">
          · {uniqueFeeds} {t("today.signal_card.sources")}
        </Text>
      </Flex>

      <div className="flex flex-col gap-1.5">
        {signal.sources.slice(0, 5).map((source) => (
          <div
            key={source.article_id}
            className="rounded-md px-2.5 py-2 bg-[var(--gray-2)] border border-[var(--gray-4)]"
          >
            <Flex align="center" gap="1" mb="1">
              <Text size="1" className="text-[var(--gray-9)]">
                {source.feed_title}
              </Text>
            </Flex>
            <Flex align="start" gap="1.5">
              <FileText size={13} className="text-[var(--gray-8)] mt-0.5 shrink-0" />
              <Text size="1" className="text-[var(--gray-11)] leading-snug line-clamp-2">
                {source.title}
              </Text>
            </Flex>
          </div>
        ))}
      </div>
    </div>
  );
}
