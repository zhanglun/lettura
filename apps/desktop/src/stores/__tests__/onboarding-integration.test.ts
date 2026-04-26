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
    id: "ai",
    name: "AI & ML",
    description: "AI feeds",
    icon: "🤖",
    language: "en",
    tags: ["ai"],
    source_count: 12,
  },
  {
    id: "tech",
    name: "Tech Essentials",
    description: "Essential tech feeds",
    icon: "💻",
    language: "en",
    tags: ["technology"],
    source_count: 10,
  },
];

const mockInstallResult = {
  installed_feeds: 12,
  installed_sources: 12,
  sync_started: true,
};

const mockUserConfig = {
  purge_on_days: 7,
  purge_unread_articles: false,
  app: { onboarding_completed: false },
};

vi.mock("@/helpers/dataAgent", () => ({
  getStarterPacks: vi.fn(() => Promise.resolve(mockPacks)),
  previewPack: vi.fn(() => Promise.resolve(null)),
  installPack: vi.fn(() => Promise.resolve(mockInstallResult)),
  importOpmlAsSource: vi.fn(() => Promise.resolve()),
  getUserConfig: vi.fn(() => Promise.resolve({ data: { ...mockUserConfig } })),
  updateUserConfig: vi.fn(() => Promise.resolve()),
}));

type TestStore = OnboardingSlice & UserConfigSlice;

const createTestStore = () =>
  create<TestStore>((set, get, ...args) => ({
    ...createUserConfigSlice(set, get as any, ...args),
    ...createOnboardingSlice(set, get as any, ...args),
  }));

describe("C5-C8: Onboarding integration tests", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createTestStore();
  });

  describe("C5: complete onboarding flow", () => {
    it("should complete the full onboarding flow from start to finish", async () => {
      store.getState().setOnboardingOpen(true);
      expect(store.getState().onboardingOpen).toBe(true);
      expect(store.getState().onboardingStep).toBe("welcome");

      store.getState().setOnboardingStep("select-pack");
      await store.getState().fetchPacks();
      expect(store.getState().packs.length).toBeGreaterThan(0);

      store.getState().togglePackSelection("ai");
      store.getState().togglePackSelection("tech");
      expect(store.getState().selectedPackIds).toEqual(["ai", "tech"]);

      store.getState().setOnboardingStep("installing");
      await store.getState().startInstall(["ai", "tech"]);

      expect(store.getState().installStatus).toBe("success");
      expect(store.getState().installResult?.installed_sources).toBe(12);
      expect(store.getState().installProgress).toEqual({ completed: 2, total: 2 });

      store.getState().setOnboardingStep("complete");
      await store.getState().getUserConfig();
      await store.getState().completeOnboarding();

      expect(store.getState().onboardingOpen).toBe(false);
      expect(store.getState().onboardingStep).toBe("welcome");
    });
  });

  describe("C7: onboarding_completed persists", () => {
    it("should send onboarding_completed=true to backend via updateUserConfig", async () => {
      const { updateUserConfig } = await import("@/helpers/dataAgent");

      await store.getState().getUserConfig();
      await store.getState().completeOnboarding();

      expect(updateUserConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          app: { onboarding_completed: true },
        }),
      );
    });

    it("should produce config that prevents onboarding on next launch", async () => {
      const { updateUserConfig } = await import("@/helpers/dataAgent");

      await store.getState().getUserConfig();
      await store.getState().completeOnboarding();

      const lastCall = (updateUserConfig as any).mock.calls.at(-1);
      const sentConfig = lastCall[0];

      // App.tsx check: if (appConfig && !appConfig.onboarding_completed) → open dialog
      expect(sentConfig.app.onboarding_completed).toBe(true);
    });
  });

  describe("C8: install failure handling", () => {
    it("should show error state when installation fails", async () => {
      const { installPack } = await import("@/helpers/dataAgent");
      (installPack as any).mockRejectedValueOnce(
        new Error("Network timeout"),
      );

      await store.getState().startInstall(["ai"]);

      const state = store.getState();
      expect(state.installStatus).toBe("all_failed");
      expect(state.installError).toBe("Network timeout");
      expect(state.installResult).toBeNull();
    });

    it("should allow skipping onboarding after install failure", async () => {
      const { installPack, updateUserConfig } = await import(
        "@/helpers/dataAgent"
      );
      (installPack as any).mockRejectedValueOnce(
        new Error("Network timeout"),
      );

      store.getState().setOnboardingOpen(true);
      await store.getState().startInstall(["ai"]);

      expect(store.getState().installStatus).toBe("all_failed");

      await store.getState().getUserConfig();
      await store.getState().completeOnboarding();

      expect(store.getState().onboardingOpen).toBe(false);
      expect(updateUserConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          app: { onboarding_completed: true },
        }),
      );
    });
  });
});
