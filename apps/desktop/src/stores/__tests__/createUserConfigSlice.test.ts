import { describe, it, expect, beforeEach, vi } from "vitest";
import { create } from "zustand";
import {
  createUserConfigSlice,
  UserConfigSlice,
} from "../createUserConfigSlice";

vi.mock("@/helpers/dataAgent", () => ({
  getUserConfig: vi.fn(() =>
    Promise.resolve({
      data: { purge_on_days: 7, purge_unread_articles: false },
    }),
  ),
  updateUserConfig: vi.fn(() => Promise.resolve()),
}));

const createTestStore = () =>
  create<UserConfigSlice>((set, get, ...args) =>
    createUserConfigSlice(set, get as any, ...args),
  );

describe("createUserConfigSlice", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe("initial state", () => {
    it("should initialize with default values", () => {
      const state = store.getState();

      expect(state.userConfig).toEqual({} as UserConfig);
      expect(state.viewOrigin).toBe(false);
      expect(state.viewOriginLoading).toBe(false);
      expect(state.podcastPanelStatus).toBe(false);
      expect(state.podcastPlayingStatus).toBe(false);
      expect(state.settingDialogStatus).toBe(false);
      expect(state.aboutDialogStatus).toBe(false);
      expect(state.appMetadata).toEqual({});
    });
  });

  describe("updateViewOrigin", () => {
    it("should set viewOrigin to true", () => {
      store.getState().updateViewOrigin(true);

      expect(store.getState().viewOrigin).toBe(true);
    });

    it("should set viewOrigin to false", () => {
      store.getState().updateViewOrigin(true);
      expect(store.getState().viewOrigin).toBe(true);

      store.getState().updateViewOrigin(false);
      expect(store.getState().viewOrigin).toBe(false);
    });
  });

  describe("updateViewOriginLoading", () => {
    it("should set viewOriginLoading to true", () => {
      store.getState().updateViewOriginLoading(true);

      expect(store.getState().viewOriginLoading).toBe(true);
    });

    it("should set viewOriginLoading to false", () => {
      store.getState().updateViewOriginLoading(true);
      expect(store.getState().viewOriginLoading).toBe(true);

      store.getState().updateViewOriginLoading(false);
      expect(store.getState().viewOriginLoading).toBe(false);
    });
  });

  describe("updatePodcastPanelStatus", () => {
    it("should set podcastPanelStatus to true", () => {
      store.getState().updatePodcastPanelStatus(true);

      expect(store.getState().podcastPanelStatus).toBe(true);
    });

    it("should set podcastPanelStatus to false", () => {
      store.getState().updatePodcastPanelStatus(true);
      expect(store.getState().podcastPanelStatus).toBe(true);

      store.getState().updatePodcastPanelStatus(false);
      expect(store.getState().podcastPanelStatus).toBe(false);
    });
  });

  describe("updatePodcastPlayingStatus", () => {
    it("should set podcastPlayingStatus to true", () => {
      store.getState().updatePodcastPlayingStatus(true);

      expect(store.getState().podcastPlayingStatus).toBe(true);
    });

    it("should set podcastPlayingStatus to false", () => {
      store.getState().updatePodcastPlayingStatus(true);
      expect(store.getState().podcastPlayingStatus).toBe(true);

      store.getState().updatePodcastPlayingStatus(false);
      expect(store.getState().podcastPlayingStatus).toBe(false);
    });
  });

  describe("updateSettingDialogStatus", () => {
    it("should set settingDialogStatus to true", () => {
      store.getState().updateSettingDialogStatus(true);

      expect(store.getState().settingDialogStatus).toBe(true);
    });

    it("should set settingDialogStatus to false", () => {
      store.getState().updateSettingDialogStatus(true);
      expect(store.getState().settingDialogStatus).toBe(true);

      store.getState().updateSettingDialogStatus(false);
      expect(store.getState().settingDialogStatus).toBe(false);
    });
  });

  describe("updateAboutDialogStatus", () => {
    it("should set aboutDialogStatus to true", () => {
      store.getState().updateAboutDialogStatus(true);

      expect(store.getState().aboutDialogStatus).toBe(true);
    });

    it("should set aboutDialogStatus to false", () => {
      store.getState().updateAboutDialogStatus(true);
      expect(store.getState().aboutDialogStatus).toBe(true);

      store.getState().updateAboutDialogStatus(false);
      expect(store.getState().aboutDialogStatus).toBe(false);
    });
  });

  describe("updateAppMetadata", () => {
    it("should set appMetadata", () => {
      const metadata = {
        version: "1.0.0",
        name: "Test App",
      };

      store.getState().updateAppMetadata(metadata);

      expect(store.getState().appMetadata).toEqual(metadata);
    });

    it("should replace entire appMetadata", () => {
      const metadata1 = {
        version: "1.0.0",
        name: "Test App",
      };

      const metadata2 = {
        version: "2.0.0",
        name: "Updated App",
      };

      store.getState().updateAppMetadata(metadata1);
      expect(store.getState().appMetadata).toEqual(metadata1);

      store.getState().updateAppMetadata(metadata2);
      expect(store.getState().appMetadata).toEqual(metadata2);
    });

    it("should handle empty metadata", () => {
      store.getState().updateAppMetadata({});

      expect(store.getState().appMetadata).toEqual({});
    });
  });

  describe("setLastSyncTime", () => {
    it("should set last sync time in userConfig", async () => {
      const date = new Date("2024-01-01T00:00:00Z");

      store.getState().setLastSyncTime(date);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(store.getState().userConfig.last_sync_time).toEqual(date);
    });

    it("should update existing userConfig", async () => {
      const existingConfig: UserConfig = {
        purge_on_days: 7,
        purge_unread_articles: false,
        update_interval: 30,
        last_sync_time: new Date("2024-01-01T00:00:00Z"),
      };

      store.setState({ userConfig: existingConfig });

      const newDate = new Date("2024-01-02T00:00:00Z");
      store.getState().setLastSyncTime(newDate);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(store.getState().userConfig.last_sync_time).toEqual(newDate);
      expect(store.getState().userConfig.update_interval).toBe(30);
    });
  });

  describe("updateUserConfig", () => {
    it("should merge new config with existing config", async () => {
      const existingConfig: UserConfig = {
        purge_on_days: 7,
        purge_unread_articles: false,
        update_interval: 30,
        color_scheme: "dark",
      };

      store.setState({ userConfig: existingConfig });

      const newConfig: UserConfig = {
        purge_on_days: 14,
        purge_unread_articles: true,
        color_scheme: "light",
        theme: "custom",
      };

      store.getState().updateUserConfig(newConfig);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(store.getState().userConfig.purge_on_days).toBe(14);
      expect(store.getState().userConfig.purge_unread_articles).toBe(true);
      expect(store.getState().userConfig.color_scheme).toBe("light");
      expect(store.getState().userConfig.theme).toBe("custom");
      expect(store.getState().userConfig.update_interval).toBe(30);
    });

    it("should replace entire userConfig if empty", async () => {
      const config: UserConfig = {
        purge_on_days: 30,
        purge_unread_articles: true,
        update_interval: 60,
      };

      store.setState({ userConfig: {} as UserConfig });
      store.getState().updateUserConfig(config);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(store.getState().userConfig).toEqual(config);
    });

    it("should handle config with only required fields", async () => {
      const minimalConfig: UserConfig = {
        purge_on_days: 0,
        purge_unread_articles: false,
      };

      store.setState({ userConfig: {} as UserConfig });
      store.getState().updateUserConfig(minimalConfig);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(store.getState().userConfig).toEqual(minimalConfig);
    });
  });

  describe("state immutability", () => {
    it("should not mutate original metadata object", () => {
      const metadata = {
        version: "1.0.0",
        name: "Test App",
      };

      const original = { ...metadata };
      store.getState().updateAppMetadata(metadata);

      expect(metadata).toEqual(original);
    });

    it("should not mutate original config object", () => {
      const config: UserConfig = {
        purge_on_days: 7,
        purge_unread_articles: false,
        update_interval: 30,
      };

      const original = { ...config };
      store.setState({ userConfig: config });
      store
        .getState()
        .updateUserConfig({ purge_on_days: 14, purge_unread_articles: false });

      expect(config).toEqual(original);
    });
  });

  describe("edge cases", () => {
    it("should handle undefined config", () => {
      store.setState({ userConfig: undefined as any });

      expect(() => {
        store
          .getState()
          .updateUserConfig({ purge_on_days: 7, purge_unread_articles: false });
      }).not.toThrow();
    });

    it("should handle null config", () => {
      store.setState({ userConfig: null as any });

      expect(() => {
        store
          .getState()
          .updateUserConfig({ purge_on_days: 7, purge_unread_articles: false });
      }).not.toThrow();
    });

    it("should handle toggling boolean states multiple times", () => {
      expect(store.getState().viewOrigin).toBe(false);

      store.getState().updateViewOrigin(true);
      expect(store.getState().viewOrigin).toBe(true);

      store.getState().updateViewOrigin(false);
      expect(store.getState().viewOrigin).toBe(false);

      store.getState().updateViewOrigin(true);
      expect(store.getState().viewOrigin).toBe(true);
    });

    it("should handle multiple dialog states simultaneously", () => {
      store.getState().updateSettingDialogStatus(true);
      store.getState().updateAboutDialogStatus(true);

      expect(store.getState().settingDialogStatus).toBe(true);
      expect(store.getState().aboutDialogStatus).toBe(true);

      store.getState().updateSettingDialogStatus(false);

      expect(store.getState().settingDialogStatus).toBe(false);
      expect(store.getState().aboutDialogStatus).toBe(true);
    });

    it("should handle zero purge_on_days", async () => {
      const config: UserConfig = {
        purge_on_days: 0,
        purge_unread_articles: false,
      };

      store.setState({ userConfig: {} as UserConfig });
      store.getState().updateUserConfig(config);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(store.getState().userConfig.purge_on_days).toBe(0);
    });

    it("should handle negative purge_on_days (edge case)", async () => {
      const config: UserConfig = {
        purge_on_days: -1,
        purge_unread_articles: false,
      };

      store.setState({ userConfig: {} as UserConfig });
      store.getState().updateUserConfig(config);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(store.getState().userConfig.purge_on_days).toBe(-1);
    });
  });
});
