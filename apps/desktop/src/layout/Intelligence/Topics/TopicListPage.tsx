import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Text } from "@radix-ui/themes";
import { FileText, Layers, Rss, Sparkles, TrendingUp } from "lucide-react";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/helpers/cn";
import { TopicCard } from "./TopicCard";

function TopicEmptyPreview({ title }: { title: string }) {
  const { t } = useTranslation();
  const sampleTopics = [
    {
      name: t("layout.topics.empty.sample_1_name"),
      desc: t("layout.topics.empty.sample_1_desc"),
      color: "var(--accent-9)",
      articles: 14,
      sources: 6,
    },
    {
      name: t("layout.topics.empty.sample_2_name"),
      desc: t("layout.topics.empty.sample_2_desc"),
      color: "var(--green-9)",
      articles: 8,
      sources: 4,
    },
  ];

  return (
    <div className="h-full overflow-auto px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[var(--gray-12)]">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--gray-10)]">
            {t("layout.topics.empty.subtitle")}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="grid gap-3">
            {sampleTopics.map((topic) => (
              <div
                key={topic.name}
                className="rounded-lg border border-dashed border-[var(--gray-6)] bg-[var(--color-background)] p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: topic.color }}
                    />
                    <div className="text-sm font-semibold text-[var(--gray-12)]">
                      {topic.name}
                    </div>
                  </div>
                  <span className="rounded-full bg-[var(--accent-a3)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent-11)]">
                    {t("layout.topics.empty.sample_badge")}
                  </span>
                </div>
                <p className="mb-3 text-xs leading-5 text-[var(--gray-11)]">
                  {topic.desc}
                </p>
                <div className="flex items-center gap-4 text-xs text-[var(--gray-9)]">
                  <span className="inline-flex items-center gap-1">
                    <FileText size={13} />
                    {topic.articles} articles
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Rss size={13} />
                    {topic.sources} sources
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <TrendingUp size={13} />
                    {t("layout.topics.empty.trending_up")}
                  </span>
                </div>
              </div>
            ))}

            <div className="rounded-lg border border-[var(--gray-5)] bg-[var(--gray-a2)] p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[var(--accent-11)]">
                <Sparkles size={14} />
                {t("layout.topics.empty.detail_title")}
              </div>
              <div className="grid gap-2 text-xs leading-5 text-[var(--gray-11)] sm:grid-cols-3">
                <div className="rounded-md bg-[var(--color-background)] p-3">
                  {t("layout.topics.empty.detail_1")}
                </div>
                <div className="rounded-md bg-[var(--color-background)] p-3">
                  {t("layout.topics.empty.detail_2")}
                </div>
                <div className="rounded-md bg-[var(--color-background)] p-3">
                  {t("layout.topics.empty.detail_3")}
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-lg border border-[var(--gray-5)] bg-[var(--gray-2)] p-4">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
              {t("layout.topics.empty.next_steps")}
            </div>
            <div className="space-y-3 text-xs leading-5 text-[var(--gray-11)]">
              <div className="rounded-md bg-[var(--color-background)] p-3">
                {t("layout.topics.empty.step_1")}
              </div>
              <div className="rounded-md bg-[var(--color-background)] p-3">
                {t("layout.topics.empty.step_2")}
              </div>
              <div className="rounded-md bg-[var(--color-background)] p-3">
                {t("layout.topics.empty.step_3")}
              </div>
            </div>
            <div className="space-y-3 text-xs leading-5 text-[var(--gray-11)]">
              <div className="rounded-md bg-[var(--color-background)] p-3">
                同步订阅源后，Today 的高信号内容会自动归入 Topic。
              </div>
              <div className="rounded-md bg-[var(--color-background)] p-3">
                在信号卡片中点击“追踪主题”，可以把主题固定到侧边栏。
              </div>
              <div className="rounded-md bg-[var(--color-background)] p-3">
                进入 Topic 后，可以从来源证据回到原文阅读。
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

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
    store.fetchTopics("active", store.sortMode || "last_updated");
  }, [store.sortMode]);

  if (store.loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[var(--gray-9)]">
        <Layers size={48} className="mb-4 text-[var(--gray-8)] animate-pulse" />
        <Text size="2" className="text-[var(--gray-9)]">
          {t("layout.topics.loading")}
        </Text>
      </div>
    );
  }

  if (store.error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Text size="2" className="text-[var(--red-9)]">
          {store.error}
        </Text>
      </div>
    );
  }

  if (store.topics.length === 0) {
    return <TopicEmptyPreview title={t("layout.topics.title")} />;
  }

  if (displayedTopics.length === 0) {
    return <TopicEmptyPreview title={t("layout.topics.title")} />;
  }

  return (
    <div className="h-full overflow-auto bg-[var(--color-background)]">
      <div className="px-7 pb-4 pt-6">
        <h1 className="text-xl font-semibold text-[var(--gray-12)] mb-1">
          {t("layout.topics.title")}
        </h1>
        <p className="text-sm text-[var(--gray-9)]">
          {t("layout.topics.subtitle")}
        </p>
      </div>
      <div className="flex items-center justify-between px-7 pb-4">
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
      <div className="flex flex-col gap-2.5 px-7 pb-6">
        {displayedTopics.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            onClick={(uuid) => navigate(`/local/topics/${uuid}`)}
          />
        ))}
      </div>
    </div>
  );
});
