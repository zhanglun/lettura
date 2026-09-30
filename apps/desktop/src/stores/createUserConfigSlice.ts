import type { StateCreator } from "zustand";
import { apiGet, apiPost } from "../helpers/http";

export interface UserConfigSlice {
  userConfig: UserConfig;
  getUserConfig: any;
  updateUserConfig: (cfg: UserConfig) => Promise<unknown>;

  aboutDialogStatus: boolean;
  updateAboutDialogStatus: (status: boolean) => void;
  appMetadata: any;
  updateAppMetadata: (metadata: any) => void;
}

export const createUserConfigSlice: StateCreator<UserConfigSlice> = (
  set,
  get,
) => ({
  userConfig: {} as UserConfig,

  getUserConfig: () => {
    return apiGet<UserConfig>("/user-config").then((cfg) => {
      set(() => ({
        userConfig: cfg,
      }));

      return cfg;
    });
  },

  updateUserConfig: (config: UserConfig) => {
    const cfg = { ...get().userConfig, ...config };

    // 乐观更新：UI 即时生效（切主题/密度等视觉反馈不等落盘），TOML 经
    // HTTP 到 Rust 同步写盘在后台完成。返回的 promise 仍等持久化结束，
    // 需要 await 的调用方语义不变。
    set(() => ({
      userConfig: cfg,
    }));
    return apiPost<number>("/user-config", cfg);
  },

  aboutDialogStatus: false,
  updateAboutDialogStatus: (status: boolean) => {
    set(() => ({
      aboutDialogStatus: status,
    }));
  },
  appMetadata: {},
  updateAppMetadata: (metadata: any) => {
    set(() => ({
      appMetadata: metadata,
    }));
  },
});
