import { StateCreator } from "zustand";
import type { UserConfigSlice } from "@/stores/createUserConfigSlice";
import * as dataAgent from "@/helpers/dataAgent";

export type OnboardingStep =
  | "welcome"
  | "interests"
  | "select-pack"
  | "installing"
  | "complete";
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

  // Selected interest IDs
  selectedInterestIds: string[];
  toggleInterestSelection: (interestId: string) => void;
  setSelectedInterestIds: (ids: string[]) => void;

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
  completeOnboarding: () => Promise<void>;
}

const INTEREST_TAGS: Record<string, string[]> = {
  ai: ["ai", "ml", "machine-learning", "artificial intelligence"],
  developer: ["developer", "dev", "programming", "code", "software", "engineering"],
  startup: ["startup", "founder", "venture", "vc"],
  design: ["design", "ux", "ui"],
  product: ["product", "pm"],
  research: ["research", "science", "paper", "papers"],
  business: ["business", "finance", "market", "strategy"],
};

export const getPackInterestScore = (
  pack: StarterPackSummary,
  selectedInterestIds: string[],
) => {
  const normalizedTags = pack.tags.map((tag) => tag.toLowerCase());
  return selectedInterestIds.reduce((score, interestId, index) => {
    const aliases = INTEREST_TAGS[interestId] || [interestId];
    const matched = aliases.some((alias) => normalizedTags.includes(alias));
    if (!matched) return score;
    return score + (selectedInterestIds.length - index);
  }, 0);
};

const rankPacksByInterests = (
  packs: StarterPackSummary[],
  selectedInterestIds: string[],
) =>
  [...packs].sort((a, b) => {
    const scoreDiff =
      getPackInterestScore(b, selectedInterestIds) -
      getPackInterestScore(a, selectedInterestIds);
    if (scoreDiff !== 0) return scoreDiff;
    return b.source_count - a.source_count;
  });

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
      const selectedInterestIds = get().selectedInterestIds;
      const rankedPacks = rankPacksByInterests(packs, selectedInterestIds);
      const selectedPackIds = get().selectedPackIds;
      const recommendedPackIds = rankedPacks
        .filter((pack) => getPackInterestScore(pack, selectedInterestIds) > 0)
        .slice(0, 3)
        .map((pack) => pack.id);
      set({
        packs: rankedPacks,
        packsLoading: false,
        selectedPackIds:
          selectedPackIds.length === 0 ? recommendedPackIds : selectedPackIds,
      });
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

  selectedInterestIds: ["ai", "developer"],
  toggleInterestSelection: (interestId) => {
    const current = get().selectedInterestIds;
    if (current.includes(interestId)) {
      set({ selectedInterestIds: current.filter((id) => id !== interestId) });
    } else {
      set({ selectedInterestIds: [...current, interestId] });
    }
  },
  setSelectedInterestIds: (ids) => set({ selectedInterestIds: ids }),

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

  completeOnboarding: async () => {
    const state = get() as OnboardingSlice & UserConfigSlice;
    try {
      await state.updateUserConfig({
        ...state.userConfig,
        app: { onboarding_completed: true },
      });
      set({ onboardingOpen: false, onboardingStep: "welcome" });
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
    }
  },
});
