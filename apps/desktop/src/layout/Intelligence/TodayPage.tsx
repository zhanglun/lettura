import { useEffect, useCallback } from "react";
import { Flex, Text, Button } from "@radix-ui/themes";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import { SignalList } from "./SignalList";
import { PipelineIndicator } from "./PipelineIndicator";
import { TodayEmptyState } from "./TodayEmptyState";
import { MainPanel } from "@/components/MainPanel";
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
      aiConfig: state.aiConfig,
      subscribes: state.subscribes,
      fetchSignals: state.fetchSignals,
      fetchAIConfig: state.fetchAIConfig,
      setPipelineStatus: state.setPipelineStatus,
      setPipelineProgress: state.setPipelineProgress,
      triggerPipeline: state.triggerPipeline,
      updateSettingDialogStatus: state.updateSettingDialogStatus,
    })),
  );

  useEffect(() => {
    store.fetchAIConfig();
    store.fetchSignals();
  }, []);

  useEffect(() => {
    if (!(window as any).__TAURI_INTERNALS__) return;

    const unsubs: Promise<() => void>[] = [];

    const { listen } = require("@tauri-apps/api/event") as typeof import("@tauri-apps/api/event");

    unsubs.push(
      listen("pipeline:started", () => {
        store.setPipelineStatus("running");
      }),
    );
    unsubs.push(
      listen("pipeline:progress", (e: any) => {
        const { stage, current, total } = e.payload;
        store.setPipelineProgress(stage, current, total);
      }),
    );
    unsubs.push(
      listen("pipeline:completed", () => {
        store.setPipelineStatus("done");
      }),
    );
    unsubs.push(
      listen("pipeline:failed", () => {
        store.setPipelineStatus("error");
      }),
    );

    return () => {
      unsubs.forEach((p) => p.then((unsub) => unsub()));
    };
  }, []);

  const hasApiKey = store.aiConfig?.has_api_key ?? false;
  const hasSignals = store.signals.length > 0;
  const hasSubscriptions = store.subscribes.length > 0;

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

  return (
    <MainPanel>
      <div className="h-full flex flex-col">
        <PipelineIndicator
          status={store.pipelineStatus}
          stage={store.pipelineStage}
          progress={store.pipelineProgress}
          onRetry={() => store.triggerPipeline()}
        />

        {store.signalsLoading && !hasSignals ? (
          <Flex align="center" justify="center" className="flex-1">
            <Loader2 className="animate-spin text-[var(--gray-8)]" size={32} />
          </Flex>
        ) : !hasApiKey || !hasSignals ? (
          renderEmptyState()
        ) : (
          <div className="flex-1 overflow-auto">
            <SignalList signals={store.signals} />
          </div>
        )}
      </div>
    </MainPanel>
  );
}
