import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { RouteConfig } from "@/config";
import { Layers, Rss, Settings } from "lucide-react";

interface NextStepsProps {
  hasSignals: boolean;
  hasApiKey: boolean;
  onOpenSettings: () => void;
}

export function NextSteps({ hasSignals, hasApiKey, onOpenSettings }: NextStepsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="today-right-section">
      <div className="today-right-title">
        {t("today.right_panel.next_steps.title")}
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        {hasSignals && (
          <button
            onClick={() => navigate(RouteConfig.LOCAL_TOPICS)}
            className="flex min-w-0 w-full items-center gap-1.5 rounded-md px-3 py-1.5 text-left text-xs font-medium text-[var(--gray-11)] border border-[var(--gray-5)] bg-transparent hover:bg-[var(--gray-2)] hover:border-[var(--gray-6)] transition-colors"
          >
            <Layers size={14} className="shrink-0" />
            <span className="min-w-0 break-words">{t("today.right_panel.next_steps.explore_topics")}</span>
          </button>
        )}

        <button
          onClick={() => navigate(RouteConfig.LOCAL_ALL)}
          className="flex min-w-0 w-full items-center gap-1.5 rounded-md px-3 py-1.5 text-left text-xs font-medium text-[var(--gray-11)] border border-[var(--gray-5)] bg-transparent hover:bg-[var(--gray-2)] hover:border-[var(--gray-6)] transition-colors"
        >
          <Rss size={14} className="shrink-0" />
          <span className="min-w-0 break-words">{t("today.right_panel.next_steps.manage_feeds")}</span>
        </button>

        {!hasApiKey && (
          <button
            onClick={onOpenSettings}
            className="flex min-w-0 w-full items-center gap-1.5 rounded-md px-3 py-1.5 text-left text-xs font-medium text-[var(--accent-9)] border border-[var(--accent-6)] bg-transparent hover:bg-[var(--accent-2)] transition-colors"
          >
            <Settings size={14} className="shrink-0" />
            <span className="min-w-0 break-words">{t("today.right_panel.next_steps.configure_ai")}</span>
          </button>
        )}
      </div>
    </section>
  );
}
