import { describe, it, expect, beforeEach, vi } from "vitest";
import { create } from "zustand";
import {
  createOnboardingSlice,
  OnboardingSlice,
} from "../createOnboardingSlice";
import {
  createUserConfigSlice,
  UserConfigSlice,
} from "../createUserConfigSlice";

const mockPacks = [
  {
    id: "tech",
    name: "Tech Essentials",
    description: "Essential tech feeds",
    icon: "💻",
    language: "en",
    tags: ["technology"],
    source_count: 10,
  },
  {
    id: "design",
    name: "Design Daily",
    description: "Daily design inspiration",
    icon: "🎨",
    language: "en",
    tags: ["design"],
    source_count: 8,
  },
];

const mockPreview = {
  id: "tech",
  name: "Tech Essentials",
  description: "Essential tech feeds",
  icon: "💻",
  language: "en",
  tags: ["technology"],
  sources: [
    { feed_url: "https://example.com/feed.xml", title: "Example", site_url: "https://example.com", language: "en" },
  ],
};

const mockInstallResult = {
  installed_feeds: 10,
  installed_sources: 10,
  sync_started: true,
};

vi.mock("@/helpers/dataAgent", () => ({
  getStarterPacks: vi.fn(() => Promise.resolve(mockPacks)),
  previewPack: vi.fn(() => Promise.resolve(mockPreview)),
  installPack: vi.fn(() => Promise.resolve(mockInstallResult)),
  importOpmlAsSource: vi.fn(() => Promise.resolve()),
  getUserConfig: vi.fn(() =>
    Promise.resolve({
      data: { purge_on_days: 7, purge_unread_articles: false },
    }),
  ),
  updateUserConfig: vi.fn(() => Promise.resolve()),
}));

const createTestStore = () =>
  create<OnboardingSlice & UserConfigSlice>((set, get, ...args) => ({
    ...createUserConfigSlice(set, get as any, ...args),
    ...createOnboardingSlice(set, get as any, ...args),
  }));

describe("createOnboardingSlice", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createTestStore();
  });

  describe("initial state", () => {
    it("should initialize with default values", () => {
      const state = store.getState();

      expect(state.onboardingOpen).toBe(false);
      expect(state.onboardingStep).toBe("welcome");
      expect(state.packs).toEqual([]);
      expect(state.packsLoading).toBe(false);
      expect(state.packsError).toBeNull();
      expect(state.selectedPackIds).toEqual([]);
      expect(state.previewPack).toBeNull();
      expect(state.previewLoading).toBe(false);
      expect(state.installStatus).toBe("idle");
      expect(state.installProgress).toEqual({ completed: 0, total: 0 });
      expect(state.installError).toBeNull();
      expect(state.installResult).toBeNull();
      expect(state.opmlImporting).toBe(false);
      expect(state.opmlImportError).toBeNull();
    });
  });

  describe("setOnboardingOpen", () => {
    it("should open the dialog", () => {
      store.getState().setOnboardingOpen(true);

      expect(store.getState().onboardingOpen).toBe(true);
    });

    it("should close the dialog", () => {
      store.getState().setOnboardingOpen(true);
      expect(store.getState().onboardingOpen).toBe(true);

      store.getState().setOnboardingOpen(false);
      expect(store.getState().onboardingOpen).toBe(false);
    });
  });

  describe("setOnboardingStep", () => {
    const steps: Array<["welcome" | "select-pack" | "installing" | "complete"]> = [
      ["welcome"],
      ["select-pack"],
      ["installing"],
      ["complete"],
    ];

    it.each(steps)("should set step to %s", (step) => {
      store.getState().setOnboardingStep(step);

      expect(store.getState().onboardingStep).toBe(step);
    });

    it("should cycle through all steps", () => {
      store.getState().setOnboardingStep("welcome");
      expect(store.getState().onboardingStep).toBe("welcome");

      store.getState().setOnboardingStep("select-pack");
      expect(store.getState().onboardingStep).toBe("select-pack");

      store.getState().setOnboardingStep("installing");
      expect(store.getState().onboardingStep).toBe("installing");

      store.getState().setOnboardingStep("complete");
      expect(store.getState().onboardingStep).toBe("complete");
    });
  });

  describe("togglePackSelection", () => {
    it("should add a pack", () => {
      store.getState().togglePackSelection("tech");

      expect(store.getState().selectedPackIds).toEqual(["tech"]);
    });

    it("should remove a pack on second toggle", () => {
      store.getState().togglePackSelection("tech");
      expect(store.getState().selectedPackIds).toEqual(["tech"]);

      store.getState().togglePackSelection("tech");
      expect(store.getState().selectedPackIds).toEqual([]);
    });

    it("should handle multiple packs", () => {
      store.getState().togglePackSelection("tech");
      store.getState().togglePackSelection("design");

      expect(store.getState().selectedPackIds).toEqual(["tech", "design"]);

      store.getState().togglePackSelection("tech");

      expect(store.getState().selectedPackIds).toEqual(["design"]);
    });
  });

  describe("setSelectedPackIds", () => {
    it("should replace entire selection", () => {
      store.getState().togglePackSelection("tech");
      store.getState().setSelectedPackIds(["design", "news"]);

      expect(store.getState().selectedPackIds).toEqual(["design", "news"]);
    });

    it("should clear selection with empty array", () => {
      store.getState().togglePackSelection("tech");
      store.getState().setSelectedPackIds([]);

      expect(store.getState().selectedPackIds).toEqual([]);
    });
  });

  describe("fetchPacks", () => {
    it("should fetch and store packs", async () => {
      await store.getState().fetchPacks();

      const state = store.getState();
      expect(state.packs).toEqual(mockPacks);
      expect(state.packsLoading).toBe(false);
      expect(state.packsError).toBeNull();
    });

    it("should handle fetch errors", async () => {
      const { getStarterPacks } = await import("@/helpers/dataAgent");
      (getStarterPacks as any).mockRejectedValueOnce(new Error("Network error"));

      await store.getState().fetchPacks();

      const state = store.getState();
      expect(state.packs).toEqual([]);
      expect(state.packsLoading).toBe(false);
      expect(state.packsError).toBe("Network error");
    });
  });

  describe("fetchPackPreview", () => {
    it("should fetch and store preview", async () => {
      await store.getState().fetchPackPreview("tech");

      const state = store.getState();
      expect(state.previewPack).toEqual(mockPreview);
      expect(state.previewLoading).toBe(false);
    });

    it("should handle errors gracefully", async () => {
      const { previewPack } = await import("@/helpers/dataAgent");
      (previewPack as any).mockRejectedValueOnce(new Error("Preview failed"));

      await store.getState().fetchPackPreview("missing");

      const state = store.getState();
      expect(state.previewPack).toBeNull();
      expect(state.previewLoading).toBe(false);
    });
  });

  describe("clearPreview", () => {
    it("should clear preview data", async () => {
      await store.getState().fetchPackPreview("tech");
      expect(store.getState().previewPack).toEqual(mockPreview);

      store.getState().clearPreview();
      expect(store.getState().previewPack).toBeNull();
    });
  });

  describe("startInstall", () => {
    it("should install packs and update status to success", async () => {
      await store.getState().startInstall(["tech", "design"]);

      const state = store.getState();
      expect(state.installStatus).toBe("success");
      expect(state.installResult).toEqual(mockInstallResult);
      expect(state.installProgress).toEqual({ completed: 2, total: 2 });
      expect(state.installError).toBeNull();
    });

    it("should handle failure", async () => {
      const { installPack } = await import("@/helpers/dataAgent");
      (installPack as any).mockRejectedValueOnce(new Error("Install failed"));

      await store.getState().startInstall(["bad-pack"]);

      const state = store.getState();
      expect(state.installStatus).toBe("all_failed");
      expect(state.installError).toBe("Install failed");
      expect(state.installResult).toBeNull();
    });
  });

  describe("importOpmlAsSource", () => {
    it("should import OPML content", async () => {
      const opml = '<opml><body><outline xmlUrl="https://example.com/feed"/></body></opml>';

      await store.getState().importOpmlAsSource(opml);

      const state = store.getState();
      expect(state.opmlImporting).toBe(false);
      expect(state.opmlImportError).toBeNull();
    });

    it("should handle import errors", async () => {
      const { importOpmlAsSource } = await import("@/helpers/dataAgent");
      (importOpmlAsSource as any).mockRejectedValueOnce(new Error("Invalid OPML"));

      await store.getState().importOpmlAsSource("bad-content");

      const state = store.getState();
      expect(state.opmlImporting).toBe(false);
      expect(state.opmlImportError).toBe("Invalid OPML");
    });
  });

  describe("completeOnboarding", () => {
    it("should update config and close dialog on success", async () => {
      store.getState().setOnboardingOpen(true);
      store.getState().setOnboardingStep("complete");

      await store.getState().completeOnboarding();

      const state = store.getState();
      expect(state.onboardingOpen).toBe(false);
      expect(state.onboardingStep).toBe("welcome");
    });

    it("should call updateUserConfig with onboarding_completed", async () => {
      const { updateUserConfig } = await import("@/helpers/dataAgent");

      await store.getState().completeOnboarding();

      expect(updateUserConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          app: { onboarding_completed: true },
        }),
      );
    });
  });

  describe("state immutability", () => {
    it("should not mutate snapshot on subsequent operations", async () => {
      const snapshot = { ...store.getState() };

      store.getState().setOnboardingOpen(true);
      store.getState().setOnboardingStep("select-pack");
      store.getState().togglePackSelection("tech");

      const current = store.getState();
      expect(current.onboardingOpen).toBe(true);
      expect(current.onboardingStep).toBe("select-pack");
      expect(current.selectedPackIds).toEqual(["tech"]);

      expect(snapshot.onboardingOpen).toBe(false);
      expect(snapshot.onboardingStep).toBe("welcome");
      expect(snapshot.selectedPackIds).toEqual([]);
    });
  });
});
