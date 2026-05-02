import { Text, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { RouteConfig } from "@/config";
import { Compass, ArrowRight, Settings } from "lucide-react";

interface NextStepsProps {
  hasSignals: boolean;
  hasApiKey: boolean;
  onOpenSettings: () => void;
}

export function NextSteps({ hasSignals, hasApiKey, onOpenSettings }: NextStepsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-w-0 p-4 border-t border-[var(--gray-4)]">
      <Flex align="center" gap="2" mb="3">
        <Compass size={16} className="text-[var(--gray-9)]" />
        <Text size="2" weight="medium" className="min-w-0 break-words text-[var(--gray-12)]">
          {t("today.right_panel.next_steps.title")}
        </Text>
      </Flex>

      <div className="flex min-w-0 flex-col gap-2">
        {hasSignals && (
          <button
            onClick={() => navigate(RouteConfig.LOCAL_TOPICS)}
            className="flex min-w-0 items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[var(--gray-11)] hover:bg-[var(--gray-3)] hover:text-[var(--gray-12)] transition-colors"
          >
            <ArrowRight size={14} className="shrink-0" />
            <span className="min-w-0 break-words">{t("today.right_panel.next_steps.explore_topics")}</span>
          </button>
        )}

        <button
          onClick={() => navigate(RouteConfig.LOCAL_ALL)}
          className="flex min-w-0 items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[var(--gray-11)] hover:bg-[var(--gray-3)] hover:text-[var(--gray-12)] transition-colors"
        >
          <ArrowRight size={14} className="shrink-0" />
          <span className="min-w-0 break-words">{t("today.right_panel.next_steps.manage_feeds")}</span>
        </button>

        {!hasApiKey && (
          <button
            onClick={onOpenSettings}
            className="flex min-w-0 items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[var(--accent-9)] hover:bg-[var(--accent-2)] transition-colors"
          >
            <Settings size={14} className="shrink-0" />
            <span className="min-w-0 break-words">{t("today.right_panel.next_steps.configure_ai")}</span>
          </button>
        )}
      </div>
    </div>
  );
}
