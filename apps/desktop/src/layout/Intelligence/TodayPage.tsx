import { useEffect, useCallback } from "react";
import { Flex, Text, Button } from "@radix-ui/themes";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import { SignalList } from "./SignalList";
import { PipelineIndicator } from "./PipelineIndicator";
import { TodayHeader } from "./TodayHeader";
import { TodayOverview } from "./TodayOverview";
import { TodayEmptyState } from "./TodayEmptyState";
import { RightPanel } from "./RightPanel";
import { EvidencePanel } from "./EvidencePanel";
import { DailyStatus } from "./DailyStatus";
import { NextSteps } from "./NextSteps";
import { InlineReader } from "./InlineReader";
import { Settings, Sparkles, Loader2 } from "lucide-react";

export function TodayPage() {
  const { t } = useTranslation();
  const store = useBearStore(
    useShallow((state) => ({
      signals: state.signals,
      signalsLoading: state.signalsLoading,
      signalsError: state.signalsError,
      pipelineStatus: state.pipelineStatus,
      pipelineStage: state.pipelineStage,
      pipelineProgress: state.pipelineProgress,
      pipelineError: state.pipelineError,
      aiConfig: state.aiConfig,
      subscribes: state.subscribes,
      overview: state.overview,
      overviewLoading: state.overviewLoading,
      overviewError: state.overviewError,
      fetchSignals: state.fetchSignals,
      fetchAIConfig: state.fetchAIConfig,
      fetchOverview: state.fetchOverview,
      setPipelineStatus: state.setPipelineStatus,
      setPipelineProgress: state.setPipelineProgress,
      triggerPipeline: state.triggerPipeline,
      lastUpdated: state.lastUpdated,
      setPipelineError: state.setPipelineError,
      updateSettingDialogStatus: state.updateSettingDialogStatus,
      expandedSignalId: state.expandedSignalId,
      scrollPositionMap: state.scrollPositionMap,
      // Inline reading state
      activeReadingSignalId: state.activeReadingSignalId,
      activeReadingSourceIndex: state.activeReadingSourceIndex,
      isInlineReading: state.isInlineReading,
      rightPanelExpanded: state.rightPanelExpanded,
      startInlineReading: state.startInlineReading,
      closeInlineReading: state.closeInlineReading,
      navigateReadingSource: state.navigateReadingSource,
      signalDetails: state.signalDetails,
      sourceArticleDetail: state.sourceArticleDetail,
      sourceArticleLoading: state.sourceArticleLoading,
      sourceArticleError: state.sourceArticleError,
      activeSourceArticleUuid: state.activeSourceArticleUuid,
      openSourceArticle: state.openSourceArticle,
      closeSourceArticle: state.closeSourceArticle,
      retrySourceArticle: state.retrySourceArticle,
    })),
  );

  useEffect(() => {
    store.fetchAIConfig();
    store.fetchSignals();
    store.fetchOverview();
  }, []);

  useEffect(() => {
    const signalId = store.expandedSignalId;
    if (signalId != null && store.scrollPositionMap[signalId] !== undefined) {
      requestAnimationFrame(() => {
        const scrollContainer = document.querySelector('[data-today-scroll]') as HTMLElement | null;
        if (scrollContainer) {
          scrollContainer.scrollTop = store.scrollPositionMap[signalId];
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!(window as any).__TAURI_INTERNALS__) return;

    const unsubs: (() => void)[] = [];
    let cancelled = false;

    import("@tauri-apps/api/event").then(async ({ listen }) => {
      if (cancelled) return;

      unsubs.push(
        await listen("pipeline:started", () => {
          store.setPipelineStatus("running");
        }),
      );
      unsubs.push(
        await listen("pipeline:progress", (e: any) => {
          const { stage, current, total } = e.payload;
          store.setPipelineProgress(stage, current, total);
        }),
      );
      unsubs.push(
        await listen("pipeline:completed", () => {
          store.setPipelineStatus("done");
        }),
      );
      unsubs.push(
        await listen("pipeline:failed", (e: any) => {
          const msg = e.payload?.error_message || "Unknown error";
          store.setPipelineError(msg);
        }),
      );
    });

    return () => {
      cancelled = true;
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  const hasApiKey = store.aiConfig?.has_api_key ?? false;
  const hasSignals = store.signals.length > 0;
  const hasSubscriptions = store.subscribes.length > 0;

  const activeReadingSignal = store.signals.find(
    (s) => s.id === store.activeReadingSignalId,
  );
  const activeReadingDetail = store.activeReadingSignalId
    ? store.signalDetails[store.activeReadingSignalId]
    : undefined;
  const activeSources = activeReadingDetail?.all_sources ?? activeReadingSignal?.sources ?? [];
  const currentReadingSource = activeSources[store.activeReadingSourceIndex] ?? null;

  const handleInlineRead = useCallback(
    (articleUuid: string, feedUuid: string, articleId: number) => {
      const signal = store.signals.find((s) =>
        s.sources.some((src) => src.article_id === articleId),
      );
      if (!signal) return;

      const detail = store.signalDetails[signal.id];
      const sources = detail?.all_sources ?? signal.sources;
      const sourceIndex = sources.findIndex((s) => s.article_id === articleId);

      store.startInlineReading(signal.id, sourceIndex >= 0 ? sourceIndex : 0);

      const source = sources[sourceIndex];
      if (source) {
        store.openSourceArticle(source);
      }
    },
    [store.signals, store.signalDetails, store.startInlineReading, store.openSourceArticle],
  );

  const handleReadingBack = useCallback(() => {
    store.closeInlineReading();
    store.closeSourceArticle();
  }, [store.closeInlineReading, store.closeSourceArticle]);

  const handleReadingNavigate = useCallback(
    (index: number) => {
      store.navigateReadingSource(index);
      const sources = activeReadingDetail?.all_sources ?? activeReadingSignal?.sources ?? [];
      const newSource = sources[index];
      if (newSource) {
        store.openSourceArticle(newSource);
      }
    },
    [store.navigateReadingSource, store.openSourceArticle, activeReadingDetail, activeReadingSignal],
  );

  const renderEmptyState = () => {
    if (!hasSubscriptions) {
      return <TodayEmptyState type="no_subscriptions" />;
    }

    if (!hasApiKey) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center h-full">
          <div className="mb-4">
            <Settings size={48} className="text-[var(--gray-6)]" />
          </div>
          <Text size="5" weight="medium" className="mb-2 text-[var(--gray-12)]">
            {t("today.empty.no_api_key")}
          </Text>
          <Button
            size="3"
            onClick={() => store.updateSettingDialogStatus(true)}
          >
            {t("today.empty.go_to_settings")}
          </Button>
        </div>
      );
    }

    if (!hasSignals) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center h-full">
          <div className="mb-4">
            <Sparkles size={48} className="text-[var(--gray-6)]" />
          </div>
          <Text size="5" weight="medium" className="mb-2 text-[var(--gray-12)]">
            {t("today.empty.no_signals")}
          </Text>
          <Button size="3" onClick={() => store.triggerPipeline()}>
            {t("today.empty.start_analysis")}
          </Button>
        </div>
      );
    }

    return <TodayEmptyState type="no_new_articles" />;
  };

  const renderRightPanelContent = () => {
    if (store.isInlineReading && currentReadingSource && activeSources.length > 0) {
      return (
        <InlineReader
          source={currentReadingSource}
          sources={activeSources}
          currentIndex={store.activeReadingSourceIndex}
          onBack={handleReadingBack}
          onNavigate={handleReadingNavigate}
          articleDetail={store.sourceArticleDetail}
          articleLoading={store.sourceArticleLoading}
          articleError={store.sourceArticleError}
          onRetry={store.retrySourceArticle}
        />
      );
    }

    return (
      <div className="flex flex-col h-full overflow-auto">
        <EvidencePanel signal={activeReadingSignal ?? store.signals[0] ?? null} />
        <DailyStatus overview={store.overview} loading={store.overviewLoading} progress={store.pipelineStatus === "running" ? store.pipelineProgress : undefined} />
        <NextSteps
          hasSignals={hasSignals}
          hasApiKey={hasApiKey}
          onOpenSettings={() => store.updateSettingDialogStatus(true)}
        />
      </div>
    );
  };

  return (
    <div className="flex h-full w-full">
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <TodayHeader
          pipelineStatus={store.pipelineStatus}
          lastUpdated={store.lastUpdated}
          sourceCount={store.overview?.article_count ?? 0}
          onRefresh={() => store.triggerPipeline()}
          onRetry={() => store.triggerPipeline()}
          pipelineError={store.pipelineError}
        />
        <PipelineIndicator
          status={store.pipelineStatus}
          stage={store.pipelineStage}
          progress={store.pipelineProgress}
          error={store.pipelineError}
          onRetry={() => store.triggerPipeline()}
          onTrigger={() => store.triggerPipeline()}
          lastUpdated={store.lastUpdated}
        />

        {store.signalsLoading && !hasSignals ? (
          <Flex align="center" justify="center" className="flex-1">
            <Loader2 className="animate-spin text-[var(--gray-8)]" size={32} />
          </Flex>
        ) : !hasApiKey || !hasSignals ? (
          renderEmptyState()
        ) : (
          <div className="flex-1 overflow-auto px-6 py-5" data-today-scroll>
            <TodayOverview
              overview={store.overview}
              overviewLoading={store.overviewLoading}
              overviewError={store.overviewError}
              hasApiKey={hasApiKey}
            />
            <SignalList
              signals={store.signals}
              activeReadingSignalId={store.activeReadingSignalId}
              activeReadingSourceIndex={store.activeReadingSourceIndex}
              onInlineRead={handleInlineRead}
            />
          </div>
        )}
      </div>

      {/* Right panel */}
      {(hasSignals || store.isInlineReading) && (
        <RightPanel expanded={store.rightPanelExpanded}>
          {renderRightPanelContent()}
        </RightPanel>
      )}
    </div>
  );
}
