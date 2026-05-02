import { Text, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { Activity, Loader2 } from "lucide-react";
import type { TodayOverview } from "@/stores/createTodaySlice";

interface DailyStatusProps {
  overview: TodayOverview | null;
  loading: boolean;
  progress?: number;
}

export function DailyStatus({ overview, loading, progress }: DailyStatusProps) {
  const { t } = useTranslation();

  return (
    <div className="min-w-0 p-4 border-t border-[var(--gray-4)]">
      <Flex align="center" gap="2" mb="3">
        <Activity size={16} className="text-[var(--gray-9)]" />
        <Text size="2" weight="medium" className="min-w-0 break-words text-[var(--gray-12)]">
          {t("today.right_panel.daily_status.title")}
        </Text>
      </Flex>

      {loading && (
        <Flex align="center" gap="2">
          <Loader2 size={14} className="animate-spin text-[var(--gray-9)]" />
          <Text size="1" className="min-w-0 break-words text-[var(--gray-9)]">
            {t("today.right_panel.daily_status.loading")}
          </Text>
        </Flex>
      )}

      {!loading && overview && (
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex min-w-0 justify-between gap-3 text-xs">
            <span className="min-w-0 break-words text-[var(--gray-9)]">{t("today.right_panel.daily_status.synced")}</span>
            <span className="shrink-0 whitespace-nowrap text-[var(--gray-12)] font-medium">{overview.article_count} {t("today.right_panel.daily_status.articles_unit")}</span>
          </div>
          <div className="flex min-w-0 justify-between gap-3 text-xs">
            <span className="min-w-0 break-words text-[var(--gray-9)]">{t("today.right_panel.daily_status.analyzed")}</span>
            <span className="shrink-0 whitespace-nowrap text-[var(--gray-12)] font-medium">{overview.signal_count} {t("today.right_panel.daily_status.signals_unit")}</span>
          </div>
          <div className="flex min-w-0 justify-between gap-3 text-xs">
            <span className="min-w-0 break-words text-[var(--gray-9)]">{t("today.right_panel.daily_status.high_signal")}</span>
            <span className="shrink-0 whitespace-nowrap text-[var(--accent-9)] font-semibold">{overview.signal_count} {t("today.right_panel.daily_status.signals_unit")}</span>
          </div>
          <div className="h-1 bg-[var(--gray-3)] rounded-full overflow-hidden mt-1">
            <div className="h-full bg-[var(--accent-9)] rounded-full transition-all" style={{ width: `${Math.round((progress ?? 1) * 100)}%` }} />
          </div>
        </div>
      )}

      {!loading && !overview && (
        <Text size="1" className="min-w-0 break-words text-[var(--gray-9)]">
          {t("today.right_panel.daily_status.no_data")}
        </Text>
      )}
    </div>
  );
}
