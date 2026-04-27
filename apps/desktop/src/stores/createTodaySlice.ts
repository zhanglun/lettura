import { StateCreator } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import {
  submitFeedback as invokeSubmitFeedback,
  type FeedbackType,
  type TodayOverview as TodayOverviewType,
  getTodayOverview,
} from "@/helpers/dataAgent";

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
}

export type PipelineStatus = "idle" | "running" | "done" | "error";

export interface TodaySlice {
  signals: Signal[];
  signalsLoading: boolean;
  signalsError: string | null;
  lastUpdated: string | null;

  pipelineStatus: PipelineStatus;
  pipelineStage: string | null;
  pipelineProgress: number;

  aiConfig: AIConfigPublic | null;

  expandedSignalId: number | null;
  signalDetails: Record<number, SignalDetail>;
  feedbackMap: Record<number, FeedbackType | null>;
  scrollPositionMap: Record<number, number>;

  overview: TodayOverviewType | null;
  overviewLoading: boolean;
  overviewError: string | null;

  fetchSignals: (limit?: number) => Promise<void>;
  fetchAIConfig: () => Promise<void>;
  setPipelineStatus: (status: PipelineStatus) => void;
  setPipelineProgress: (stage: string, current: number, total: number) => void;
  triggerPipeline: (runType?: string) => Promise<void>;
  toggleSourceExpand: (signalId: number) => void;
  fetchSignalDetail: (signalId: number) => Promise<void>;
  submitFeedback: (signalId: number, feedbackType: FeedbackType) => Promise<void>;
  setScrollPosition: (signalId: number, scrollY: number) => void;
  fetchOverview: () => Promise<void>;
}

export const createTodaySlice: StateCreator<TodaySlice> = (set, get) => ({
  signals: [],
  signalsLoading: false,
  signalsError: null,
  lastUpdated: null,

  pipelineStatus: "idle",
  pipelineStage: null,
  pipelineProgress: 0,

  aiConfig: null,

  expandedSignalId: null,
  signalDetails: {},
  feedbackMap: {},
  scrollPositionMap: {},

  overview: null,
  overviewLoading: false,
  overviewError: null,

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
      setTimeout(() => set({ pipelineStatus: "idle" }), 3000);
    }
  },

  setPipelineProgress: (stage, current, total) => {
    set({
      pipelineStage: stage,
      pipelineProgress: total > 0 ? current / total : 0,
    });
  },

  triggerPipeline: async (runType) => {
    try {
      await invoke("trigger_pipeline", { runType: runType || "manual" });
    } catch (e) {
      set({ pipelineStatus: "error", signalsError: String(e) });
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

  submitFeedback: async (signalId, feedbackType) => {
    await invokeSubmitFeedback(signalId, feedbackType);
    set((state) => ({
      feedbackMap: { ...state.feedbackMap, [signalId]: feedbackType },
    }));
  },

  setScrollPosition: (signalId, scrollY) => {
    set((state) => ({
      scrollPositionMap: { ...state.scrollPositionMap, [signalId]: scrollY },
    }));
  },

  fetchOverview: async () => {
    set({ overviewLoading: true, overviewError: null });
    try {
      const overview = await getTodayOverview();
      set({ overview, overviewLoading: false });
    } catch (e) {
      set({ overviewError: String(e), overviewLoading: false });
    }
  },
});
