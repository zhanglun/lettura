import { Text, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { Activity, Loader2 } from "lucide-react";
import type { TodayOverview } from "@/stores/createTodaySlice";

interface DailyStatusProps {
  overview: TodayOverview | null;
  loading: boolean;
}

export function DailyStatus({ overview, loading }: DailyStatusProps) {
  const { t } = useTranslation();

  return (
    <div className="p-4 border-t border-[var(--gray-4)]">
      <Flex align="center" gap="2" mb="3">
        <Activity size={16} className="text-[var(--gray-9)]" />
        <Text size="2" weight="medium" className="text-[var(--gray-12)]">
          {t("today.right_panel.daily_status.title")}
        </Text>
      </Flex>

      {loading && (
        <Flex align="center" gap="2">
          <Loader2 size={14} className="animate-spin text-[var(--gray-9)]" />
          <Text size="1" className="text-[var(--gray-9)]">
            {t("today.right_panel.daily_status.loading")}
          </Text>
        </Flex>
      )}

      {!loading && overview && (
        <div className="flex gap-3">
          <div className="flex flex-col items-center flex-1 rounded-md bg-[var(--gray-2)] px-2 py-2">
            <Text size="4" weight="bold" className="text-[var(--accent-9)]">
              {overview.signal_count}
            </Text>
            <Text size="1" className="text-[var(--gray-9)]">
              {t("today.right_panel.daily_status.signals")}
            </Text>
          </div>
          <div className="flex flex-col items-center flex-1 rounded-md bg-[var(--gray-2)] px-2 py-2">
            <Text size="4" weight="bold" className="text-[var(--accent-9)]">
              {overview.article_count}
            </Text>
            <Text size="1" className="text-[var(--gray-9)]">
              {t("today.right_panel.daily_status.articles")}
            </Text>
          </div>
        </div>
      )}

      {!loading && !overview && (
        <Text size="1" className="text-[var(--gray-9)]">
          {t("today.right_panel.daily_status.no_data")}
        </Text>
      )}
    </div>
  );
}
