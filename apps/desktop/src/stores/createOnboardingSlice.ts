import { StateCreator } from "zustand";
import type { UserConfigSlice } from "@/stores/createUserConfigSlice";
import * as dataAgent from "@/helpers/dataAgent";

export type OnboardingStep = "welcome" | "select-pack" | "installing" | "complete";
export type InstallStatus = "idle" | "installing" | "partial_success" | "all_failed" | "success";

export interface StarterPackSummary {
  id: string;
  name: string;
  description: string;
  icon: string;
  language: string;
  tags: string[];
  source_count: number;
}

export interface PackPreview {
  id: string;
  name: string;
  description: string;
  icon: string;
  language: string;
  tags: string[];
  sources: { feed_url: string; title: string; site_url: string; language: string }[];
}

export interface InstallResult {
  installed_feeds: number;
  installed_sources: number;
  sync_started: boolean;
}

export interface OnboardingSlice {
  // Dialog visibility
  onboardingOpen: boolean;
  setOnboardingOpen: (open: boolean) => void;

  // Current step
  onboardingStep: OnboardingStep;
  setOnboardingStep: (step: OnboardingStep) => void;

  // Packs data
  packs: StarterPackSummary[];
  packsLoading: boolean;
  packsError: string | null;
  fetchPacks: () => Promise<void>;

  // Selected pack IDs
  selectedPackIds: string[];
  togglePackSelection: (packId: string) => void;
  setSelectedPackIds: (ids: string[]) => void;

  // Pack preview
  previewPack: PackPreview | null;
  previewLoading: boolean;
  fetchPackPreview: (packId: string) => Promise<void>;
  clearPreview: () => void;

  // Install
  installStatus: InstallStatus;
  installProgress: { completed: number; total: number };
  installError: string | null;
  installResult: InstallResult | null;
  startInstall: (packIds: string[]) => Promise<void>;

  // OPML import
  opmlImporting: boolean;
  opmlImportError: string | null;
  importOpmlAsSource: (opmlContent: string) => Promise<void>;

  // Complete
  completeOnboarding: () => void;
}

export const createOnboardingSlice: StateCreator<OnboardingSlice> = (
  set,
  get,
) => ({
  onboardingOpen: false,
  setOnboardingOpen: (open) => set({ onboardingOpen: open }),

  onboardingStep: "welcome",
  setOnboardingStep: (step) => set({ onboardingStep: step }),

  packs: [],
  packsLoading: false,
  packsError: null,
  fetchPacks: async () => {
    set({ packsLoading: true, packsError: null });
    try {
      const packs = await dataAgent.getStarterPacks();
      set({ packs, packsLoading: false });
    } catch (err: any) {
      set({ packsError: err?.message || "Failed to load packs", packsLoading: false });
    }
  },

  selectedPackIds: [],
  togglePackSelection: (packId) => {
    const current = get().selectedPackIds;
    if (current.includes(packId)) {
      set({ selectedPackIds: current.filter((id) => id !== packId) });
    } else {
      set({ selectedPackIds: [...current, packId] });
    }
  },
  setSelectedPackIds: (ids) => set({ selectedPackIds: ids }),

  previewPack: null,
  previewLoading: false,
  fetchPackPreview: async (packId) => {
    set({ previewLoading: true });
    try {
      const preview = await dataAgent.previewPack(packId);
      set({ previewPack: preview, previewLoading: false });
    } catch {
      set({ previewLoading: false });
    }
  },
  clearPreview: () => set({ previewPack: null }),

  installStatus: "idle",
  installProgress: { completed: 0, total: 0 },
  installError: null,
  installResult: null,
  startInstall: async (packIds) => {
    set({ installStatus: "installing", installProgress: { completed: 0, total: packIds.length }, installError: null });
    try {
      const result = await dataAgent.installPack(packIds);
      set({
        installResult: result,
        installStatus: "success",
        installProgress: { completed: packIds.length, total: packIds.length },
      });
    } catch (err: any) {
      const msg = err?.message || "Installation failed";
      set({
        installError: msg,
        installStatus: "all_failed",
      });
    }
  },

  opmlImporting: false,
  opmlImportError: null,
  importOpmlAsSource: async (opmlContent) => {
    set({ opmlImporting: true, opmlImportError: null });
    try {
      await dataAgent.importOpmlAsSource(opmlContent);
      set({ opmlImporting: false });
    } catch (err: any) {
      set({ opmlImportError: err?.message || "OPML import failed", opmlImporting: false });
    }
  },

  completeOnboarding: () => {
    const state = get() as OnboardingSlice & UserConfigSlice;
    state.updateUserConfig({
      ...state.userConfig,
      app: { onboarding_completed: true },
    });
    set({ onboardingOpen: false, onboardingStep: "welcome" });
  },
});
