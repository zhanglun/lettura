import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Text } from "@radix-ui/themes";
import { Layers } from "lucide-react";
import { cn } from "@/helpers/cn";
import { RouteConfig } from "@/config";
import { TopicCard } from "./TopicCard";
import { PipelineIndicator } from "../PipelineIndicator";
import type { TopicItem } from "@/stores/topicSlice";
import type { PipelineStatus } from "@/stores/createTodaySlice";

interface TopicMainProps {
  topics: TopicItem[];
  loading: boolean;
  error: string | null;
  selectedUuid?: string;
  sortMode: string;
  filterMode: string;
  pipelineStatus: PipelineStatus;
  pipelineError: string | null;
  pipelineStage: string | null;
  pipelineProgress: number | null;
  aiConfig: { has_api_key: boolean } | null;
  triggerPipeline: () => void;
  lastUpdated: string | null;
  updateSettingDialogStatus: (open: boolean) => void;
  muteTopic: (id: number) => void;
  unmuteTopic: (id: number) => void;
  onFilterModeChange: (mode: string) => void;
  onSortModeChange: (mode: string) => void;
}

export function TopicMain({
  topics,
  loading,
  error,
  selectedUuid,
  sortMode,
  filterMode,
  pipelineStatus,
  pipelineError,
  pipelineStage,
  pipelineProgress,
  aiConfig,
  triggerPipeline,
  lastUpdated,
  updateSettingDialogStatus,
  muteTopic,
  unmuteTopic,
  onFilterModeChange,
  onSortModeChange,
}: TopicMainProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const hasApiKey = aiConfig?.has_api_key ?? false;

  const trackedTopics = useMemo(() => topics.filter((t) => t.is_following), [topics]);
  const discoveredTopics = useMemo(() => topics.filter((t) => !t.is_following && !t.is_muted), [topics]);
  const mutedTopics = useMemo(() => topics.filter((t) => t.is_muted), [topics]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[var(--gray-9)]">
        <Layers size={48} className="mb-4 text-[var(--gray-8)] animate-pulse" />
        <Text size="2" className="text-[var(--gray-9)]">
          {t("layout.topics.loading")}
        </Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Text size="2" className="text-[var(--red-9)]">
          {error}
        </Text>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <PipelineIndicator
          status={pipelineStatus}
          stage={pipelineStage}
          progress={pipelineProgress ?? undefined}
          error={pipelineError}
          onTrigger={triggerPipeline}
          onRetry={triggerPipeline}
          lastUpdated={lastUpdated}
          compact
        />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <Text size="5" weight="bold" className="text-[var(--gray-12)] mb-2">
            {t("layout.topics.title")}
          </Text>
          {!hasApiKey ? (
            <>
              <Text size="2" className="text-[var(--gray-9)] mb-4 text-center">
                {t("layout.topics.empty.no_api_key_desc")}
              </Text>
              <button
                onClick={() => updateSettingDialogStatus(true)}
                className="rounded-md bg-[var(--accent-9)] px-4 py-2 text-sm text-[var(--accent-contrast)] transition-colors hover:bg-[var(--accent-10)]"
              >
                {t("layout.topics.empty.go_to_settings")}
              </button>
            </>
          ) : (
            <>
              <Text size="2" className="text-[var(--gray-9)] mb-4 text-center">
                {t("layout.topics.empty.trigger_analysis_desc")}
              </Text>
              <button
                onClick={() => triggerPipeline()}
                className="rounded-md bg-[var(--accent-9)] px-4 py-2 text-sm text-[var(--accent-contrast)] transition-colors hover:bg-[var(--accent-10)]"
              >
                {t("layout.topics.empty.trigger_analysis")}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const filteredTopics =
    filterMode === "following"
      ? trackedTopics
      : filterMode === "muted"
        ? mutedTopics
        : filterMode === "updated"
          ? topics.filter((t) => {
              const updatedAt = new Date(t.last_updated_at);
              const now = new Date();
              return (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60) < 24;
            })
          : filterMode === "discovered"
            ? discoveredTopics
            : null;

  const filterModes = ["all", "following", "updated", "muted"] as const;

  return (
    <div className="h-full min-h-0 overflow-auto bg-[var(--color-background)]">
      {/* Header */}
      <div className="px-5 pb-3 pt-5">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg font-semibold text-[var(--gray-12)]">{t("layout.topics.title")}</h1>
          <PipelineIndicator
            status={pipelineStatus}
            stage={pipelineStage}
            progress={pipelineProgress ?? undefined}
            error={pipelineError}
            onTrigger={triggerPipeline}
            onRetry={triggerPipeline}
            lastUpdated={lastUpdated}
            compact
          />
        </div>
        <p className="text-xs text-[var(--gray-9)]">{t("layout.topics.subtitle")}</p>

        {/* Hero Note */}
        <div className="mt-3 rounded-lg border border-[var(--accent-6)] bg-[var(--accent-a2)] px-4 py-2.5">
          <p className="text-[11px] text-[var(--accent-11)] leading-relaxed">{t("layout.topics.hero_note")}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 pb-3">
        <div className="flex items-center gap-0.5 rounded-md bg-[var(--gray-2)] border border-[var(--gray-4)] p-0.5">
          {filterModes.map((mode) => (
            <button
              key={mode}
              className={cn(
                "rounded px-2 py-1 text-[11px] transition-colors",
                filterMode === mode
                  ? "bg-[var(--color-background)] text-[var(--gray-12)] shadow-sm"
                  : "text-[var(--gray-9)] hover:text-[var(--gray-11)]",
              )}
              onClick={() => onFilterModeChange(mode)}
            >
              {t(
                `layout.topics.filter.${mode === "all" ? "all" : mode === "following" ? "following" : mode === "muted" ? "muted" : "updated"}`,
              )}
            </button>
          ))}
        </div>
        <select
          value={sortMode}
          onChange={(e) => onSortModeChange(e.target.value)}
          className="text-[11px] text-[var(--gray-11)] bg-[var(--gray-2)] border border-[var(--gray-4)] rounded px-2 py-1"
        >
          <option value="relevance">{t("layout.topics.sort.relevance")}</option>
          <option value="recent">{t("layout.topics.sort.recent")}</option>
          <option value="article_count">{t("layout.topics.sort.article_count")}</option>
        </select>
      </div>

      {/* Topic Cards */}
      {filterMode !== "all" && filteredTopics ? (
        <div className="px-5 pb-5">
          <div className="flex flex-col gap-2">
            {filteredTopics.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                selected={selectedUuid === topic.uuid}
                onClick={(uuid) => navigate(`${RouteConfig.LOCAL_TOPICS}/${uuid}`)}
                onMute={(id) => muteTopic(id)}
                onUnmute={(id) => unmuteTopic(id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {trackedTopics.length > 0 && (
            <div className="px-5 pb-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gray-10)] mb-2">
                {t("layout.topics.filter.tracked")}
              </h2>
              <div className="flex flex-col gap-2">
                {trackedTopics.map((topic) => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    selected={selectedUuid === topic.uuid}
                    onClick={(uuid) => navigate(`${RouteConfig.LOCAL_TOPICS}/${uuid}`)}
                    onMute={(id) => muteTopic(id)}
                  />
                ))}
              </div>
            </div>
          )}
          {discoveredTopics.length > 0 && (
            <div className="px-5 pb-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gray-10)] mb-2">
                {t("layout.topics.filter.discovered")}
              </h2>
              <div className="flex flex-col gap-2">
                {discoveredTopics.map((topic) => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    selected={selectedUuid === topic.uuid}
                    onClick={(uuid) => navigate(`${RouteConfig.LOCAL_TOPICS}/${uuid}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
