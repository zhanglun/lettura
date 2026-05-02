import { Text, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { SignalSource } from "@/stores/createTodaySlice";
import { SignalSourceItem } from "./SignalSourceItem";
import { Newspaper } from "lucide-react";

const PREVIEW_COUNT = 5;

interface SignalSourceListProps {
  sources: SignalSource[];
  onSourceClick: (articleUuid: string, feedUuid: string, articleId: number) => void;
  onLoadAll?: () => void;
  loading?: boolean;
  onInlineRead?: (articleUuid: string, feedUuid: string, articleId: number) => void;
  activeReadingSourceIndex?: number;
  isActive?: boolean;
}

export function SignalSourceList({
  sources,
  onSourceClick,
  onLoadAll,
  loading,
  onInlineRead,
  activeReadingSourceIndex,
  isActive,
}: SignalSourceListProps) {
  const { t } = useTranslation();
  const hasMore = !isActive && sources.length > PREVIEW_COUNT;
  let displaySources = hasMore ? sources.slice(0, PREVIEW_COUNT) : sources;

  if (activeReadingSourceIndex != null && activeReadingSourceIndex >= displaySources.length && activeReadingSourceIndex < sources.length) {
    const start = PREVIEW_COUNT;
    const end = activeReadingSourceIndex + 1;
    displaySources = [...displaySources, ...sources.slice(start, end)];
  }

  return (
    <div className="mt-2 pt-2 border-t border-[var(--gray-4)]">
      <Flex align="center" gap="1" mb="2">
        <Newspaper size={14} className="text-[var(--gray-9)]" />
        <Text size="1" weight="medium" className="text-[var(--gray-9)]">
          {t("today.sources.title")}
        </Text>
      </Flex>

      <div className="flex flex-col gap-0.5">
        {displaySources.map((source, index) => (
          <SignalSourceItem
            key={source.article_id}
            source={source}
            onClick={onSourceClick}
            onInlineRead={onInlineRead}
            isCurrentlyReading={activeReadingSourceIndex != null && activeReadingSourceIndex === index}
          />
        ))}
      </div>

      {hasMore && onLoadAll && (
        <button
          className="w-full text-center py-2 mt-1 text-sm text-[var(--gray-9)] hover:text-[var(--gray-11)] transition-colors"
          onClick={onLoadAll}
          disabled={loading}
        >
          {loading
            ? t("today.sources.loading", "Loading...")
            : t("today.sources.show_all", {
                count: sources.length,
                defaultValue: `Show all ${sources.length} articles`,
              })}
        </button>
      )}

      <div className="mt-3 pt-3 border-t border-[var(--gray-4)]">
        <Text size="1" className="text-[var(--gray-8)]">
          {t("today.deep_read.continue_reading_hint")}
        </Text>
      </div>
    </div>
  );
}
