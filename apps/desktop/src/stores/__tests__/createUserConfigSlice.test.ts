import { beforeEach, describe, expect, it, vi } from "vitest";
import { create } from "zustand";
import {
  createUserConfigSlice,
  type UserConfigSlice,
} from "../createUserConfigSlice";

vi.mock("@/helpers/http", () => ({
  apiGet: vi.fn(() =>
    Promise.resolve({ purge_on_days: 7, purge_unread_articles: false }),
  ),
  apiPost: vi.fn(() => Promise.resolve()),
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
      expect(state.aboutDialogStatus).toBe(false);
      expect(state.appMetadata).toEqual({});
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

  describe("getUserConfig", () => {
    it("should load user config from backend", async () => {
      await store.getState().getUserConfig();

      expect(store.getState().userConfig.purge_on_days).toBe(7);
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

    it("should handle toggling about dialog multiple times", () => {
      expect(store.getState().aboutDialogStatus).toBe(false);

      store.getState().updateAboutDialogStatus(true);
      expect(store.getState().aboutDialogStatus).toBe(true);

      store.getState().updateAboutDialogStatus(false);
      expect(store.getState().aboutDialogStatus).toBe(false);

      store.getState().updateAboutDialogStatus(true);
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
