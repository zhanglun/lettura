import type { StateCreator } from "zustand";
import { apiGet, apiPost } from "../helpers/http";

// 持久化合并：滑杆逐 tick 调用 updateUserConfig 只落一次盘（600ms 尾随窗口，
// 窗口关闭时读最新状态）。乐观更新不受影响；窗口内所有调用共享同一笔
// 落盘 promise，await 语义不变（等的是同一笔写）。
let writeTimer: ReturnType<typeof setTimeout> | null = null;
let pendingWrite: Promise<unknown> = Promise.resolve();

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

    // 乐观更新：UI 即时生效（切主题/密度等视觉反馈不等落盘）。
    set(() => ({
      userConfig: cfg,
    }));
    if (!writeTimer) {
      pendingWrite = new Promise<number>((resolve, reject) => {
        writeTimer = setTimeout(() => {
          writeTimer = null;
          apiPost<number>("/user-config", get().userConfig).then(resolve, reject);
        }, 600);
      });
    }
    return pendingWrite;
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
