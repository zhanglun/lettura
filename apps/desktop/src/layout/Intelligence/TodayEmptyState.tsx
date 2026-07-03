import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@radix-ui/themes";
import { AlertTriangle, Inbox, Rss, Settings, Sparkles } from "lucide-react";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";

type EmptyType =
  | "no_subscriptions"
  | "no_api_key"
  | "no_signals"
  | "no_new_articles"
  | "load_error";

interface TodayEmptyStateProps {
  type: EmptyType;
  onRetry?: () => void;
  onConfigureAI?: () => void;
  onRunAnalysis?: () => void;
}

export function TodayEmptyState({
  type,
  onRetry,
  onConfigureAI,
  onRunAnalysis,
}: TodayEmptyStateProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const store = useBearStore(
    useShallow((state) => ({
      setOnboardingOpen: state.setOnboardingOpen,
    })),
  );

  const handleAddFeeds = () => {
    store.setOnboardingOpen(true);
  };

  const handleExplore = () => {
    navigate("/local/all");
  };

  if (type === "no_api_key") {
    return (
      <div className="today-empty-state">
        <div className="today-empty-card">
          <div className="today-empty-icon">
            <Settings size={20} />
          </div>
          <h2 className="today-empty-title">
            {t("today.empty.no_api_key_title")}
          </h2>
          <p className="today-empty-description">
            {t("today.empty.no_api_key_subtitle")}
          </p>
          <div className="today-empty-actions">
            <Button size="3" onClick={onConfigureAI}>
              {t("today.empty.go_to_settings")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (type === "no_signals") {
    return (
      <div className="today-empty-state">
        <div className="today-empty-card">
          <div className="today-empty-icon">
            <Sparkles size={20} />
          </div>
          <h2 className="today-empty-title">
            {t("today.empty.no_signals_title")}
          </h2>
          <p className="today-empty-description">
            {t("today.empty.no_signals_subtitle")}
          </p>
          <div className="today-empty-actions">
            <Button size="3" onClick={onRunAnalysis}>
              {t("today.empty.start_analysis")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (type === "load_error") {
    return (
      <div className="today-empty-state">
        <div className="today-empty-card">
          <div className="today-empty-icon text-[var(--amber-9)]">
            <AlertTriangle size={20} />
          </div>
          <h2 className="today-empty-title">
            {t("today.empty.error_title")}
          </h2>
          <p className="today-empty-description">
            {t("today.empty.error_subtitle")}
          </p>
          {onRetry && (
            <div className="today-empty-actions">
              <Button size="2" onClick={onRetry}>
                {t("today.empty.retry")}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (type === "no_subscriptions") {
    return (
      <div className="today-empty-state">
        <div className="today-empty-card">
          <div className="today-empty-icon">
            <Rss size={20} />
          </div>
          <h2 className="today-empty-title">
            {t("today.empty.no_feeds_title")}
          </h2>
          <p className="today-empty-description">
            {t("today.empty.no_feeds_subtitle")}
          </p>
          <div className="today-empty-actions">
            <Button size="3" onClick={handleAddFeeds}>
              {t("today.empty.add_feeds")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="today-empty-state">
      <div className="today-empty-card">
        <div className="today-empty-icon">
          <Inbox size={20} />
        </div>
        <h2 className="today-empty-title">
          {t("today.empty.no_articles_title")}
        </h2>
      <p className="today-empty-description">
        {t("today.empty.no_articles_subtitle")}
      </p>
      <div className="today-empty-actions">
        <Button size="2" variant="outline" onClick={handleExplore}>
          {t("today.empty.explore_all")}
        </Button>
      </div>
    </div>
  </div>
  );
}
