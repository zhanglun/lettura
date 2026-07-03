import { StateCreator } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import * as dataAgent from "@/helpers/dataAgent";
import type { ArticleResItem } from "@/db";
import { toast } from "sonner";
import i18next from "i18next";
import type {
  SignalSource,
  Signal,
  SignalDetail,
  AIConfigPublic,
  TodayOverview,
  PipelineStatus,
  FeedbackEntry,
} from "@/typing";

export type {
  SignalSource,
  Signal,
  SignalDetail,
  AIConfigPublic,
  TodayOverview,
  PipelineStatus,
  FeedbackEntry,
}

export interface TodaySlice {
  signals: Signal[];
  signalsLoading: boolean;
  signalsError: string | null;
  lastUpdated: string | null;

  pipelineStatus: PipelineStatus;
  pipelineStage: string | null;
  pipelineProgress: number;
  pipelineError: string | null;

  aiConfig: AIConfigPublic | null;

  expandedSignalId: number | null;
  pendingFocusSignalId: number | null;
  signalDetails: Record<number, SignalDetail>;

  overview: TodayOverview | null;
  overviewLoading: boolean;
  overviewError: string | null;

  feedbackHistory: FeedbackEntry[];
  feedbackMap: Record<number, string | null>;

  scrollPositionMap: Record<number, number>;
  setScrollPosition: (signalId: number, scrollY: number) => void;

  activeReadingSignalId: number | null;
  activeReadingSourceIndex: number;
  isInlineReading: boolean;
  rightPanelExpanded: boolean;

  // Source article detail
  activeSourceArticleUuid: string | null;
  sourceArticleDetail: ArticleResItem | null;
  sourceArticleLoading: boolean;
  sourceArticleError: string | null;

  startInlineReading: (signalId: number, sourceIndex?: number) => void;
  closeInlineReading: () => void;
  navigateReadingSource: (index: number) => void;
  openSourceArticle: (source: SignalSource) => void;
  closeSourceArticle: () => void;
  retrySourceArticle: () => void;

  fetchSignals: (limit?: number) => Promise<void>;
  fetchAIConfig: () => Promise<void>;
  setPipelineStatus: (status: PipelineStatus) => void;
  setPipelineProgress: (stage: string, current: number, total: number) => void;
  setPipelineError: (error: string) => void;
  triggerPipeline: (runType?: string) => Promise<void>;
  focusSignal: (signalId: number) => void;
  clearPendingFocusSignal: () => void;
  toggleSourceExpand: (signalId: number) => void;
  fetchSignalDetail: (signalId: number) => Promise<void>;
  fetchOverview: () => Promise<void>;
  submitFeedback: (signalId: number, feedbackType: "useful" | "not_relevant" | "follow_topic", comment?: string) => Promise<void>;
  clearFeedback: (signalId: number) => void;
  fetchFeedbackHistory: (limit?: number) => Promise<void>;
}

export const createTodaySlice: StateCreator<TodaySlice> = (set, get) => ({
  signals: [],
  signalsLoading: false,
  signalsError: null,
  lastUpdated: null,

  pipelineStatus: "idle",
  pipelineStage: null,
  pipelineProgress: 0,
  pipelineError: null,

  aiConfig: null,

  expandedSignalId: null,
  pendingFocusSignalId: null,
  signalDetails: {},

  overview: null,
  overviewLoading: false,
  overviewError: null,

  feedbackHistory: [],
  feedbackMap: {},

  scrollPositionMap: {},

  activeReadingSignalId: null,
  activeReadingSourceIndex: 0,
  isInlineReading: false,
  rightPanelExpanded: false,

  activeSourceArticleUuid: null,
  sourceArticleDetail: null,
  sourceArticleLoading: false,
  sourceArticleError: null,

  fetchSignals: async (limit = 5) => {
    set({ signalsLoading: true, signalsError: null });
    try {
      const signals: Signal[] = await invoke("get_today_signals", { limit });
      set({
        signals,
        signalsLoading: false,
        lastUpdated: new Date().toISOString(),
      });
    } catch (e) {
      set({ signalsError: String(e), signalsLoading: false });
    }
  },

  fetchAIConfig: async () => {
    try {
      const config: AIConfigPublic = await invoke("get_ai_config");
      set({ aiConfig: config });
    } catch {
      set({ aiConfig: null });
    }
  },

  setPipelineStatus: (status) => {
    set({ pipelineStatus: status });
    if (status === "done") {
      const { fetchSignals, fetchOverview } = get();
      fetchSignals();
      fetchOverview();
      setTimeout(() => set({ pipelineStatus: "idle", pipelineError: null }), 3000);
    }
  },

  setPipelineProgress: (stage, current, total) => {
    set({
      pipelineStage: stage,
      pipelineProgress: total > 0 ? current / total : 0,
    });
  },

  setPipelineError: (error) => {
    set({ pipelineStatus: "error", pipelineError: error });
  },

  triggerPipeline: async (runType) => {
    set({ pipelineStatus: "running", pipelineError: null });
    try {
      await invoke("trigger_pipeline", { runType: runType || "full" });
    } catch (e) {
      const msg = String(e);
      if (msg.includes("PL_ALREADY_RUNNING")) {
        return;
      }
      set({ pipelineStatus: "error", pipelineError: msg });
    }
  },

  toggleSourceExpand: (signalId) => {
    const { expandedSignalId } = get();
    set({
      expandedSignalId: expandedSignalId === signalId ? null : signalId,
    });
  },

  focusSignal: (signalId) => {
    set({
      expandedSignalId: signalId,
      pendingFocusSignalId: signalId,
      isInlineReading: false,
      rightPanelExpanded: false,
    });
  },

  clearPendingFocusSignal: () => {
    set({ pendingFocusSignalId: null });
  },

  fetchSignalDetail: async (signalId) => {
    try {
      const detail: SignalDetail = await invoke("get_signal_detail", {
        signalId,
      });
      set((state) => ({
        signalDetails: {
          ...state.signalDetails,
          [signalId]: detail,
        },
      }));
    } catch (e) {
      console.error("Failed to fetch signal detail:", e);
    }
  },

  fetchOverview: async () => {
    set({ overviewLoading: true, overviewError: null });
    try {
      const overview: TodayOverview = await invoke("get_today_overview");
      set({ overview, overviewLoading: false });
    } catch (e) {
      set({ overviewError: String(e), overviewLoading: false });
    }
  },

  submitFeedback: async (signalId, feedbackType, comment) => {
    await invoke("submit_feedback", { signalId, feedbackType, comment });
    set((state) => ({
      feedbackMap: { ...state.feedbackMap, [signalId]: feedbackType },
    }));
    toast.success(i18next.t("today.feedback.success"));
    get().fetchSignals();
  },

  clearFeedback: (signalId) => {
    set((state) => ({
      feedbackMap: { ...state.feedbackMap, [signalId]: null },
    }));
  },

  fetchFeedbackHistory: async (limit) => {
    try {
      const history: FeedbackEntry[] = await invoke("get_feedback_history", { limit });
      set({ feedbackHistory: history });
    } catch (e) {
      console.error("Failed to fetch feedback history:", e);
    }
  },

  startInlineReading: (signalId, sourceIndex = 0) => {
    set(() => ({
      activeReadingSignalId: signalId,
      activeReadingSourceIndex: sourceIndex,
      isInlineReading: true,
      rightPanelExpanded: true,
    }));
  },

  closeInlineReading: () => {
    set({
      activeReadingSignalId: null,
      activeReadingSourceIndex: 0,
      isInlineReading: false,
      rightPanelExpanded: false,
    });
  },

  navigateReadingSource: (index) => {
    const { isInlineReading } = get();
    if (!isInlineReading) return;
    set({ activeReadingSourceIndex: index });
  },

  openSourceArticle: async (source) => {
    const { activeSourceArticleUuid } = get();
    if (activeSourceArticleUuid === source.article_uuid) return;

    set({
      activeSourceArticleUuid: source.article_uuid,
      sourceArticleDetail: null,
      sourceArticleLoading: true,
      sourceArticleError: null,
    });

    try {
      const res = await dataAgent.getArticleDetail(source.article_uuid, {});
      const data = res.data;
      set({ sourceArticleDetail: data, sourceArticleLoading: false });
    } catch (e) {
      set({ sourceArticleError: String(e), sourceArticleLoading: false });
    }
  },

  closeSourceArticle: () => {
    set({
      activeSourceArticleUuid: null,
      sourceArticleDetail: null,
      sourceArticleLoading: false,
      sourceArticleError: null,
    });
  },

  retrySourceArticle: () => {
    const { activeSourceArticleUuid } = get();
    if (!activeSourceArticleUuid) return;
    const signal = get().signals.find((s) =>
      s.sources.some((src) => src.article_uuid === activeSourceArticleUuid),
    );
    const detail = signal ? get().signalDetails[signal.id] : undefined;
    const sources = detail?.all_sources ?? signal?.sources ?? [];
    const source = sources.find((s) => s.article_uuid === activeSourceArticleUuid);
    if (!source) return;

    set({
      sourceArticleDetail: null,
      sourceArticleLoading: true,
      sourceArticleError: null,
    });

    dataAgent
      .getArticleDetail(source.article_uuid, {})
      .then((res) => {
        set({ sourceArticleDetail: res.data, sourceArticleLoading: false });
      })
      .catch((e) => {
        set({ sourceArticleError: String(e), sourceArticleLoading: false });
      });
  },

  setScrollPosition: (signalId, scrollY) => {
    set((state) => ({
      scrollPositionMap: { ...state.scrollPositionMap, [signalId]: scrollY },
    }));
  },
});
