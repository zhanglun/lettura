import { StateCreator } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface SignalSource {
  article_id: number;
  article_uuid: string;
  title: string;
  link: string;
  feed_title: string;
  feed_uuid: string;
  pub_date: string;
  excerpt: string | null;
}

export interface Signal {
  id: number;
  title: string;
  summary: string;
  why_it_matters: string;
  relevance_score: number;
  source_count: number;
  sources: SignalSource[];
  topic_id: number | null;
  topic_title: string | null;
  created_at: string;
}

export interface SignalDetail {
  signal: Signal;
  all_sources: SignalSource[];
}

export interface AIConfigPublic {
  has_api_key: boolean;
  model: string;
  embedding_model: string;
  base_url: string;
  enable_embedding: boolean;
}

export interface TodayOverview {
  summary: string;
  signal_count: number;
  article_count: number;
  generated_at: string;
  is_stale: boolean;
}

export type PipelineStatus = "idle" | "running" | "done" | "error";

export interface FeedbackEntry {
  id: number;
  signal_id: number;
  feedback_type: string;
  comment: string | null;
  create_date: string;
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

  startInlineReading: (signalId: number, sourceIndex?: number) => void;
  closeInlineReading: () => void;
  navigateReadingSource: (index: number) => void;

  fetchSignals: (limit?: number) => Promise<void>;
  fetchAIConfig: () => Promise<void>;
  setPipelineStatus: (status: PipelineStatus) => void;
  setPipelineProgress: (stage: string, current: number, total: number) => void;
  setPipelineError: (error: string) => void;
  triggerPipeline: (runType?: string) => Promise<void>;
  toggleSourceExpand: (signalId: number) => void;
  fetchSignalDetail: (signalId: number) => Promise<void>;
  fetchOverview: () => Promise<void>;
  submitFeedback: (signalId: number, feedbackType: "useful" | "not_relevant" | "follow_topic", comment?: string) => Promise<void>;
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
      const { fetchSignals } = get();
      fetchSignals();
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
      set({ pipelineStatus: "error", pipelineError: String(e) });
    }
  },

  toggleSourceExpand: (signalId) => {
    const { expandedSignalId } = get();
    set({
      expandedSignalId: expandedSignalId === signalId ? null : signalId,
    });
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
    get().fetchSignals();
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
    set((state) => {
      const wasReadingAnother = state.activeReadingSignalId !== null && state.activeReadingSignalId !== signalId;
      return {
        activeReadingSignalId: signalId,
        activeReadingSourceIndex: wasReadingAnother ? 0 : sourceIndex,
        isInlineReading: true,
        rightPanelExpanded: true,
      };
    });
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

  setScrollPosition: (signalId, scrollY) => {
    set((state) => ({
      scrollPositionMap: { ...state.scrollPositionMap, [signalId]: scrollY },
    }));
  },
});
