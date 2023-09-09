import { StateCreator } from "zustand";
import * as dataAgent from "../helpers/dataAgent";

export interface UserConfigSlice {
  userConfig: UserConfig;
  getUserConfig: any;
  updateUserConfig: (cfg: UserConfig) => void;
}

export const createUserConfigSlice: StateCreator<UserConfigSlice> = (set, get) => ({
  userConfig: {},

  getUserConfig: () => {
    dataAgent.getUserConfig().then((res) => {
      set(() => ({
        userConfig: res,
      }));
    });
  },

  updateUserConfig: (config: UserConfig) => {
    const cfg = { ...get().userConfig, ...config };

    dataAgent.updateUserConfig(cfg).then(() => {
      set(() => ({
        userConfig: cfg,
      }));
    });
  },
});
