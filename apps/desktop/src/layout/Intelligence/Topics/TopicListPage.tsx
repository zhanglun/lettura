import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Text } from "@radix-ui/themes";
import { Layers } from "lucide-react";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/helpers/cn";
import { TopicCard } from "./TopicCard";
import { MainPanel } from "@/components/MainPanel";

export const TopicListPage = React.memo(function () {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const store = useBearStore(
    useShallow((state) => ({
      topics: state.topics,
      loading: state.loading,
      error: state.error,
      fetchTopics: state.fetchTopics,
      sortMode: state.sortMode,
      filterMode: state.filterMode,
      setSortMode: state.setSortMode,
      setFilterMode: state.setFilterMode,
    })),
  );

  const displayedTopics = useMemo(() => {
    if (store.filterMode === "following") {
      return store.topics.filter((t) => t.is_following);
    }
    return store.topics;
  }, [store.topics, store.filterMode]);

  useEffect(() => {
    store.fetchTopics("active", "last_updated");
  }, []);

  if (store.loading) {
    return (
      <MainPanel>
        <div className="flex flex-col items-center justify-center h-full text-[var(--gray-9)]">
        <Layers size={48} className="mb-4 text-[var(--gray-8)] animate-pulse" />
        <Text size="2" className="text-[var(--gray-9)]">
          {t("layout.topics.loading")}
        </Text>
      </div>
    </MainPanel>
    );
  }

  if (store.error) {
    return (
      <MainPanel>
        <div className="flex flex-col items-center justify-center h-full">
          <Text size="2" className="text-[var(--red-9)]">
            {store.error}
          </Text>
        </div>
      </MainPanel>
    );
  }

  if (store.topics.length === 0) {
    return (
      <MainPanel>
        <div className="flex flex-col items-center justify-center h-full text-[var(--gray-9)]">
        <Layers size={48} className="mb-4 text-[var(--gray-8)]" />
        <Text size="2" className="text-[var(--gray-11)]">
          {t("layout.topics.empty")}
        </Text>
      </div>
    </MainPanel>
    );
  }

  if (displayedTopics.length === 0) {
    return (
      <MainPanel>
        <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold text-[var(--gray-12)] mb-6">
          {t("layout.topics.title")}
        </h1>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 bg-[var(--gray-2)] rounded-md p-0.5">
            <button
              className={cn(
                "px-3 py-1 rounded text-xs transition-colors",
                store.filterMode === "all"
                  ? "bg-[var(--color-background)] text-[var(--gray-12)] shadow-sm"
                  : "text-[var(--gray-9)] hover:text-[var(--gray-11)]",
              )}
              onClick={() => store.setFilterMode("all")}
            >
              {t("layout.topics.filter.all")}
            </button>
            <button
              className={cn(
                "px-3 py-1 rounded text-xs transition-colors",
                store.filterMode === "following"
                  ? "bg-[var(--color-background)] text-[var(--gray-12)] shadow-sm"
                  : "text-[var(--gray-9)] hover:text-[var(--gray-11)]",
              )}
              onClick={() => store.setFilterMode("following")}
            >
              {t("layout.topics.filter.following")}
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-[var(--gray-9)]">
          <Text size="2" className="text-[var(--gray-11)]">
            {t("layout.topics.empty")}
          </Text>
        </div>
      </div>
    </MainPanel>
    );
  }

  return (
    <MainPanel>
      <div className="p-6 max-w-3xl mx-auto overflow-auto h-full">
      <h1 className="text-xl font-semibold text-[var(--gray-12)] mb-6">
        {t("layout.topics.title")}
      </h1>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 bg-[var(--gray-2)] rounded-md p-0.5">
          <button
            className={cn(
              "px-3 py-1 rounded text-xs transition-colors",
              store.filterMode === "all"
                ? "bg-[var(--color-background)] text-[var(--gray-12)] shadow-sm"
                : "text-[var(--gray-9)] hover:text-[var(--gray-11)]",
            )}
            onClick={() => store.setFilterMode("all")}
          >
            {t("layout.topics.filter.all")}
          </button>
          <button
            className={cn(
              "px-3 py-1 rounded text-xs transition-colors",
              store.filterMode === "following"
                ? "bg-[var(--color-background)] text-[var(--gray-12)] shadow-sm"
                : "text-[var(--gray-9)] hover:text-[var(--gray-11)]",
            )}
            onClick={() => store.setFilterMode("following")}
          >
            {t("layout.topics.filter.following")}
          </button>
        </div>
        <select
          value={store.sortMode}
          onChange={(e) => store.setSortMode(e.target.value as "relevance" | "recent" | "article_count")}
          className="text-xs text-[var(--gray-11)] bg-[var(--gray-2)] border border-[var(--gray-4)] rounded px-2 py-1"
        >
          <option value="relevance">{t("layout.topics.sort.relevance")}</option>
          <option value="recent">{t("layout.topics.sort.recent")}</option>
          <option value="article_count">{t("layout.topics.sort.article_count")}</option>
        </select>
      </div>
      <div className="flex flex-col gap-3">
        {displayedTopics.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            onClick={(uuid) => navigate(`/local/topics/${uuid}`)}
          />
        ))}
      </div>
    </div>
    </MainPanel>
  );
});
