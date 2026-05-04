import { Flex, Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow, parseISO } from "date-fns";
import { PipelineStatus } from "@/stores/createTodaySlice";
import { Loader2, Check, AlertTriangle, RefreshCw } from "lucide-react";

interface TodayHeaderProps {
  pipelineStatus: PipelineStatus;
  lastUpdated: string | null;
  sourceCount: number;
  onRefresh: () => void;
  onRetry: () => void;
  pipelineError: string | null;
}

interface StatusPillProps {
  status: PipelineStatus;
  lastUpdated: string | null;
  sourceCount: number;
  onRefresh: () => void;
  onRetry: () => void;
}

function StatusPill({
  status,
  lastUpdated,
  sourceCount,
  onRefresh,
  onRetry,
}: StatusPillProps) {
  const { t } = useTranslation();

  if (status === "idle" && lastUpdated) {
    const timeAgo = formatDistanceToNow(parseISO(lastUpdated), { addSuffix: true });
    return (
      <Flex align="center" gap="2" className="text-xs rounded-full px-3 py-1 bg-[var(--gray-3)] text-[var(--gray-11)]">
        <Text size="1">{t("today.header.last_updated", { time: timeAgo })}</Text>
        <button onClick={onRefresh} className="hover:text-[var(--gray-12)] transition-colors">
          <RefreshCw size={12} />
        </button>
      </Flex>
    );
  }

  if (status === "running") {
    return (
      <Flex align="center" gap="2" className="text-xs rounded-full px-3 py-1 bg-[var(--gray-3)] text-[var(--gray-11)]">
        <Loader2 size={12} className="animate-spin" />
        <Text size="1">{t("today.header.analyzing")}</Text>
      </Flex>
    );
  }

  if (status === "done") {
    return (
      <Flex align="center" gap="2" className="text-xs rounded-full px-3 py-1 bg-[var(--gray-3)] text-[var(--gray-11)]">
        <Check size={12} className="text-[var(--green-9)]" />
        <Text size="1">{t("today.header.done", { count: sourceCount })}</Text>
      </Flex>
    );
  }

  if (status === "error") {
    return (
      <button
        onClick={onRetry}
        className="flex items-center gap-2 text-xs rounded-full px-3 py-1 bg-[var(--gray-3)] text-[var(--gray-11)] hover:text-[var(--gray-12)] transition-colors"
      >
        <AlertTriangle size={12} className="text-[var(--amber-9)]" />
        <Text size="1">{t("today.header.error_retry")}</Text>
      </button>
    );
  }

  return null;
}

export function TodayHeader({
  pipelineStatus,
  lastUpdated,
  sourceCount,
  onRefresh,
  onRetry,
  pipelineError: _pipelineError,
}: TodayHeaderProps) {
  const { t } = useTranslation();

  if (pipelineStatus === "idle" && !lastUpdated) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div>
        <h1 className="text-xl font-semibold text-[var(--gray-12)]">{t("today.title")}</h1>
        <p className="text-sm text-[var(--gray-10)]">{t("today.subtitle")}</p>
      </div>
      <StatusPill
        status={pipelineStatus}
        lastUpdated={lastUpdated}
        sourceCount={sourceCount}
        onRefresh={onRefresh}
        onRetry={onRetry}
      />
    </div>
  );
}
