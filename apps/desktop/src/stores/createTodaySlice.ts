import { StateCreator } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface SignalSource {
  article_id: number;
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

  fetchSignals: (limit?: number) => Promise<void>;
  fetchAIConfig: () => Promise<void>;
  setPipelineStatus: (status: PipelineStatus) => void;
  setPipelineProgress: (stage: string, current: number, total: number) => void;
  triggerPipeline: (runType?: string) => Promise<void>;
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
});
