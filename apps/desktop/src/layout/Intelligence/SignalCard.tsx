import { Text, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { Signal } from "@/stores/createTodaySlice";
import { FileText } from "lucide-react";

interface SignalCardProps {
  signal: Signal;
}

export function SignalCard({ signal }: SignalCardProps) {
  const { t } = useTranslation();

  return (
    <div className="group rounded-lg border border-[var(--gray-4)] bg-[var(--color-background)] p-4 transition-all hover:border-[var(--gray-7)] hover:shadow-sm cursor-default">
      <Flex direction="column" gap="2">
        <Text
          size="4"
          weight="medium"
          className="text-[var(--gray-12)] leading-snug"
        >
          {signal.title}
        </Text>

        <Text
          size="2"
          className="text-[var(--gray-11)] leading-relaxed line-clamp-2"
        >
          {signal.summary}
        </Text>

        <Flex align="center" gap="2" mt="1">
          <FileText size={14} className="text-[var(--gray-9)]" />
          <Text size="1" className="text-[var(--gray-9)]">
            {signal.source_count} {t("today.signal_card.articles")} ·{" "}
            {new Set(signal.sources.map((s) => s.feed_uuid)).size}{" "}
            {t("today.signal_card.sources")}
          </Text>
        </Flex>
      </Flex>
    </div>
  );
}
