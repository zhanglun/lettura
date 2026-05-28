import { useCallback } from "react";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { RightPanel } from "./RightPanel";
import { EvidencePanel } from "./EvidencePanel";
import { DailyStatus } from "./DailyStatus";
import { NextSteps } from "./NextSteps";
import { InlineReader } from "./InlineReader";

export function TodayRightPanel() {
  const store = useBearStore(
    useShallow((state) => ({
      isInlineReading: state.isInlineReading,
      rightPanelExpanded: state.rightPanelExpanded,
      activeReadingSignalId: state.activeReadingSignalId,
      activeReadingSourceIndex: state.activeReadingSourceIndex,
      expandedSignalId: state.expandedSignalId,
      signalDetails: state.signalDetails,
      sourceArticleDetail: state.sourceArticleDetail,
      sourceArticleLoading: state.sourceArticleLoading,
      sourceArticleError: state.sourceArticleError,
      startInlineReading: state.startInlineReading,
      closeInlineReading: state.closeInlineReading,
      navigateReadingSource: state.navigateReadingSource,
      openSourceArticle: state.openSourceArticle,
      closeSourceArticle: state.closeSourceArticle,
      retrySourceArticle: state.retrySourceArticle,
      signals: state.signals,
      overview: state.overview,
      overviewLoading: state.overviewLoading,
      pipelineStatus: state.pipelineStatus,
      pipelineProgress: state.pipelineProgress,
      aiConfig: state.aiConfig,
      updateSettingDialogStatus: state.updateSettingDialogStatus,
    })),
  );

  const activeReadingSignal = store.signals.find(
    (s) => s.id === store.activeReadingSignalId,
  );
  const expandedSignal = store.signals.find(
    (s) => s.id === store.expandedSignalId,
  );
  const evidenceSignal = activeReadingSignal ?? expandedSignal ?? store.signals[0] ?? null;
  const activeReadingDetail = store.activeReadingSignalId
    ? store.signalDetails[store.activeReadingSignalId]
    : undefined;
  const activeSources =
    activeReadingDetail?.all_sources ?? activeReadingSignal?.sources ?? [];
  const currentReadingSource =
    activeSources[store.activeReadingSourceIndex] ?? null;

  const hasApiKey = store.aiConfig?.has_api_key ?? false;
  const hasSignals = store.signals.length > 0;

  const handleReadingBack = useCallback(() => {
    store.closeInlineReading();
    store.closeSourceArticle();
  }, [store.closeInlineReading, store.closeSourceArticle]);

  const handleReadingNavigate = useCallback(
    (index: number) => {
      store.navigateReadingSource(index);
      const sources =
        activeReadingDetail?.all_sources ?? activeReadingSignal?.sources ?? [];
      const newSource = sources[index];
      if (newSource) {
        store.openSourceArticle(newSource);
      }
    },
    [
      store.navigateReadingSource,
      store.openSourceArticle,
      activeReadingDetail,
      activeReadingSignal,
    ],
  );

  const handleEvidenceInlineRead = useCallback(
    (articleUuid: string, feedUuid: string, articleId: number) => {
      const signal = store.signals.find((item) =>
        item.sources.some((source) => source.article_id === articleId),
      );
      if (!signal) return;

      const detail = store.signalDetails[signal.id];
      const sources = detail?.all_sources ?? signal.sources;
      const sourceIndex = sources.findIndex(
        (source) => source.article_id === articleId,
      );
      const source = sources[sourceIndex];
      if (!source) return;

      store.startInlineReading(signal.id, sourceIndex >= 0 ? sourceIndex : 0);
      store.openSourceArticle(source);
    },
    [
      store.signals,
      store.signalDetails,
      store.startInlineReading,
      store.openSourceArticle,
    ],
  );

  return (
    <RightPanel expanded={store.rightPanelExpanded}>
      {store.isInlineReading && currentReadingSource && activeSources.length > 0 ? (
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
      ) : (
        <div className="today-right-scroll">
          <EvidencePanel
            signal={evidenceSignal}
            onInlineRead={handleEvidenceInlineRead}
          />
          <DailyStatus
            overview={store.overview}
            loading={store.overviewLoading}
            progress={
              store.pipelineStatus === "running"
                ? store.pipelineProgress
                : undefined
            }
            highSignalCount={
              store.signals.filter((s) => s.relevance_score >= 0.8).length
            }
          />
          <NextSteps
            hasSignals={hasSignals}
            hasApiKey={hasApiKey}
            onOpenSettings={() => store.updateSettingDialogStatus(true)}
          />
        </div>
      )}
    </RightPanel>
  );
}
