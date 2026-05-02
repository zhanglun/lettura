import { Flex, Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { TodayOverview as TodayOverviewType } from "@/stores/createTodaySlice";
import { Clock } from "lucide-react";

interface TodayOverviewProps {
  overview: TodayOverviewType | null;
  overviewLoading: boolean;
  overviewError: string | null;
  hasApiKey: boolean;
}

function getTimeAgoMinutes(generatedAt: string): number | null {
  const generated = new Date(generatedAt);
  const now = new Date();
  const diffMs = now.getTime() - generated.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  return diffMin >= 0 ? diffMin : null;
}

export function TodayOverview({
  overview,
  overviewLoading,
  overviewError,
  hasApiKey,
}: TodayOverviewProps) {
  const { t } = useTranslation();

  if (!hasApiKey) return null;

  if (overviewLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--accent-a3)] rounded-md mb-5">
        <div className="h-3 w-[80%] animate-pulse rounded bg-[var(--gray-4)]" />
      </div>
    );
  }

  if (overviewError) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--accent-a3)] rounded-md mb-5">
        <Text size="2" className="text-[var(--gray-9)]">
          {t("today.overview_error")}
        </Text>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--accent-a3)] rounded-md mb-5">
        <Text size="2" className="text-[var(--gray-9)]">
          {t("today.overview_no_data")}
        </Text>
      </div>
    );
  }

  const minutesAgo = overview.is_stale
    ? getTimeAgoMinutes(overview.generated_at)
    : null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--accent-a3)] rounded-md mb-5">
      <Clock size={14} className="shrink-0 text-[var(--accent-9)]" />
      <Text size="2" className="text-[var(--gray-11)]">
        <strong>{t("today.overview_title")}</strong> {overview.summary}
      </Text>
      {minutesAgo !== null && (
        <Text size="1" className="shrink-0 text-[var(--gray-8)]">
          {t("today.overview_updated_minutes_ago", { minutes: minutesAgo })}
        </Text>
      )}
    </div>
  );
}
