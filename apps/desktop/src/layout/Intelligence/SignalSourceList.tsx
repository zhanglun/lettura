import { Text, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { SignalSource } from "@/stores/createTodaySlice";
import { SignalSourceItem } from "./SignalSourceItem";
import { Newspaper, BookOpen } from "lucide-react";
import { useMemo } from "react";

const PREVIEW_COUNT = 5;

interface SignalSourceListProps {
  sources: SignalSource[];
  onSourceClick: (articleUuid: string, feedUuid: string, articleId: number) => void;
  onLoadAll?: () => void;
  loading?: boolean;
}

export function SignalSourceList({
  sources,
  onSourceClick,
  onLoadAll,
  loading,
}: SignalSourceListProps) {
  const { t } = useTranslation();

  const sortedSources = useMemo(
    () =>
      [...sources].sort((a, b) => {
        if (!a.pub_date) return 1;
        if (!b.pub_date) return -1;
        return new Date(b.pub_date).getTime() - new Date(a.pub_date).getTime();
      }),
    [sources],
  );

  const hasMore = sortedSources.length > PREVIEW_COUNT;
  const displaySources = hasMore ? sortedSources.slice(0, PREVIEW_COUNT) : sortedSources;

  return (
    <div className="mt-2 pt-2 border-t border-[var(--gray-4)]">
      <Flex align="center" gap="1" mb="2">
        <Newspaper size={14} className="text-[var(--gray-9)]" />
        <Text size="1" weight="medium" className="text-[var(--gray-9)]">
          {t("today.sources.title")}
        </Text>
      </Flex>

      <div className="flex flex-col gap-0.5">
        {displaySources.map((source) => (
          <SignalSourceItem
            key={source.article_id}
            source={source}
            onClick={onSourceClick}
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
                count: sortedSources.length,
                defaultValue: `Show all ${sortedSources.length} articles`,
              })}
        </button>
      )}

      <div className="mt-3 pt-3 border-t border-[var(--gray-4)]">
        <Flex align="center" justify="center" gap="2">
          <BookOpen size={14} className="text-[var(--gray-8)]" />
          <Text size="1" className="text-[var(--gray-9)]">
            {t("today.sources.continue_reading_hint")}
          </Text>
        </Flex>
      </div>
    </div>
  );
}
