import { Button, Flex, Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { PipelineStatus } from "@/stores/createTodaySlice";
import { Loader2, Check, AlertTriangle } from "lucide-react";

interface PipelineIndicatorProps {
  status: PipelineStatus;
  stage?: string | null;
  progress?: number;
  error?: string | null;
  onRetry?: () => void;
}

export function PipelineIndicator({
  status,
  stage,
  progress,
  error,
  onRetry,
}: PipelineIndicatorProps) {
  const { t } = useTranslation();

  if (status === "idle") return null;

  if (status === "running") {
    return (
      <Flex align="center" gap="2" className="px-4 py-2">
        <Loader2 size={16} className="animate-spin text-[var(--accent-9)]" />
        <Text size="1" className="text-[var(--gray-11)]">
          {t("today.pipeline.running")}
        </Text>
        {stage && (
          <Text size="1" className="text-[var(--gray-9)]">
            ({t(`today.pipeline.stage_${stage}`) || stage}
            {progress !== undefined && progress > 0
              ? ` ${Math.round(progress * 100)}%`
              : ""}
            )
          </Text>
        )}
      </Flex>
    );
  }

  if (status === "done") {
    return (
      <Flex align="center" gap="2" className="px-4 py-2">
        <Check size={16} className="text-[var(--green-9)]" />
        <Text size="1" className="text-[var(--green-9)]">
          {t("today.pipeline.done")}
        </Text>
      </Flex>
    );
  }

  if (status === "error") {
    return (
      <Flex direction="column" gap="1" className="px-4 py-2">
        <Flex align="center" gap="2">
          <AlertTriangle size={16} className="text-[var(--amber-9)]" />
          <Text size="1" className="text-[var(--amber-9)]">
            {t("today.pipeline.error")}
          </Text>
          {onRetry && (
            <Button size="1" variant="ghost" onClick={onRetry}>
              {t("today.pipeline.retry")}
            </Button>
          )}
        </Flex>
        {error && (
          <Text size="1" className="text-[var(--gray-9)] pl-6">
            {error}
          </Text>
        )}
      </Flex>
    );
  }

  return null;
}
