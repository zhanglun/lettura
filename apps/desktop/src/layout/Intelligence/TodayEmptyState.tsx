import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Text } from "@radix-ui/themes";
import { Inbox, Rss, AlertTriangle } from "lucide-react";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";

type EmptyType = "no_subscriptions" | "no_new_articles" | "load_error";

interface TodayEmptyStateProps {
  type: EmptyType;
}

export function TodayEmptyState({ type }: TodayEmptyStateProps) {
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

  if (type === "load_error") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center h-full">
        <div className="mb-4">
          <AlertTriangle size={48} className="text-[var(--amber-9)]" />
        </div>
        <Text size="5" weight="medium" className="mb-2 text-[var(--gray-12)]">
          {t("today.empty.error_title")}
        </Text>
        <Text size="2" className="text-[var(--gray-11)] mb-6">
          {t("today.empty.error_subtitle")}
        </Text>
      </div>
    );
  }

  if (type === "no_subscriptions") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center h-full">
        <div className="mb-4">
          <Rss size={48} className="text-[var(--gray-6)]" />
        </div>
        <Text size="5" weight="medium" className="mb-2 text-[var(--gray-12)]">
          {t("today.empty.no_feeds_title")}
        </Text>
        <Text size="2" className="text-[var(--gray-11)] mb-6">
          {t("today.empty.no_feeds_subtitle")}
        </Text>
        <Button size="3" onClick={handleAddFeeds}>
          {t("today.empty.add_feeds")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center h-full">
      <div className="mb-4">
        <Inbox size={48} className="text-[var(--gray-6)]" />
      </div>
      <Text size="5" weight="medium" className="mb-2 text-[var(--gray-12)]">
        {t("today.empty.no_articles_title")}
      </Text>
      <Text size="2" className="text-[var(--gray-11)] mb-6">
        {t("today.empty.no_articles_subtitle")}
      </Text>
      <Button size="2" variant="outline" onClick={handleExplore}>
        {t("today.empty.explore_all")}
      </Button>
    </div>
  );
}
