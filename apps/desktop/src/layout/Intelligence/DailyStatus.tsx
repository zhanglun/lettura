import { Text, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import type { TodayOverview } from "@/stores/createTodaySlice";

interface DailyStatusProps {
  overview: TodayOverview | null;
  loading: boolean;
  progress?: number;
  highSignalCount?: number;
}

export function DailyStatus({ overview, loading, progress, highSignalCount }: DailyStatusProps) {
  const { t } = useTranslation();

  return (
    <div className="min-w-0 px-4 py-5 border-t border-[var(--gray-3)]">
      <div className="text-[11px] font-semibold text-[var(--gray-9)] uppercase tracking-[0.5px] mb-2.5">
        {t("today.right_panel.daily_status.title")}
      </div>

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
            <span className="shrink-0 whitespace-nowrap text-[var(--accent-9)] font-semibold">{highSignalCount ?? 0} {t("today.right_panel.daily_status.signals_unit")}</span>
          </div>
          <div className="h-1 bg-[var(--gray-3)] rounded-full overflow-hidden mt-1">
            <div className="h-full bg-[var(--accent-9)] rounded-full transition-all" style={{ width: `${Math.round((progress ?? 0) * 100)}%` }} />
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
