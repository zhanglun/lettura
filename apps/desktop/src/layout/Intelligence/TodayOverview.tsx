import { Flex, Text, Skeleton } from "@radix-ui/themes";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import { RefreshCw, Radio, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RouteConfig } from "@/config";
import { TodayOverview as TodayOverviewType } from "@/helpers/dataAgent";

function formatMinutesAgo(isoString: string): string | null {
  const generated = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - generated.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return null;
  return `${diffMin}`;
}

export function TodayOverview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { overview, overviewLoading, overviewError, fetchOverview } =
    useBearStore(
      useShallow((state) => ({
        overview: state.overview,
        overviewLoading: state.overviewLoading,
        overviewError: state.overviewError,
        fetchOverview: state.fetchOverview,
      })),
    );

  if (overviewLoading && !overview) {
    return (
      <div className="px-4 py-3 border-b border-[var(--gray-4)]">
        <Flex align="center" gap="2" className="mb-2">
          <Radio size={14} className="text-[var(--gray-8)]" />
          <Text size="1" color="gray">
            {t("today.overview")}
          </Text>
        </Flex>
        <Skeleton className="h-4 w-4/5" />
      </div>
    );
  }

  if (overviewError === "AI_NO_API_KEY") {
    return (
      <div className="px-4 py-3 border-b border-[var(--gray-4)]">
        <Flex align="center" gap="2">
          <Settings size={14} className="text-[var(--accent-9)]" />
          <button
            onClick={() => navigate(RouteConfig.SETTINGS)}
            className="text-left cursor-pointer"
          >
            <Text size="2" className="text-[var(--accent-9)] hover:underline">
              {t("today.overview_no_api_key")}
            </Text>
          </button>
        </Flex>
      </div>
    );
  }

  if (!overview && overviewError && overviewError !== "TODAY_NO_DATA") {
    return (
      <div className="px-4 py-3 border-b border-[var(--gray-4)]">
        <Flex align="center" gap="2">
          <Radio size={14} className="text-[var(--gray-8)]" />
          <Text size="2" color="gray">
            {t("today.overview_error")}
          </Text>
        </Flex>
      </div>
    );
  }

  if (overviewError === "TODAY_NO_DATA" || (!overview && !overviewLoading)) {
    return null;
  }

  if (!overview) return null;

  const minutesAgo = overview.is_stale
    ? formatMinutesAgo(overview.generated_at)
    : null;

  return (
    <div className="px-4 py-3 border-b border-[var(--gray-4)]">
      <Flex align="center" gap="2" className="mb-1">
        <Radio size={14} className="text-[var(--gray-8)]" />
        <Text size="1" color="gray">
          {t("today.overview")}
        </Text>
      </Flex>
      <Flex align="center" justify="between" gap="3">
        <Text size="2" className="text-[var(--gray-11)] flex-1 leading-relaxed">
          {overview.summary}
        </Text>
        {minutesAgo !== null && (
          <Flex align="center" gap="1" className="shrink-0">
            <Text size="1" color="gray">
              {t("today.overview_updated_minutes_ago", {
                minutes: minutesAgo,
              })}
            </Text>
            <button
              onClick={() => fetchOverview()}
              className="p-1 hover:bg-[var(--gray-3)] rounded cursor-pointer"
              title={t("today.overview")}
            >
              <RefreshCw size={12} className="text-[var(--gray-8)]" />
            </button>
          </Flex>
        )}
      </Flex>
    </div>
  );
}
