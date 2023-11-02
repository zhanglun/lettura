import { StateCreator } from "zustand";
import * as dataAgent from "../helpers/dataAgent";

export interface UserConfigSlice {
  userConfig: UserConfig;
  getUserConfig: any;
  updateUserConfig: (cfg: UserConfig) => void;

  viewOrigin: boolean;
  updateViewOrigin: (status: boolean) => void;
  viewOriginLoading: boolean;
  updateViewOriginLoading: (status: boolean) => void;

  lastViewRouteBeforeSetting: Location | null;
  setLastViewRouteBeforeSetting: (l: Location) => void;
}

export const createUserConfigSlice: StateCreator<UserConfigSlice> = (
  set,
  get
) => ({
  userConfig: {},

  getUserConfig: () => {
    dataAgent.getUserConfig().then(({ data: cfg }) => {
      set(() => ({
        userConfig: cfg,
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

  viewOrigin: false,

  updateViewOrigin: (status: boolean) => {
    console.log("%c Line:40 🥃 status", "color:#ea7e5c", status);
    set(() => ({
      viewOrigin: status,
    }));
  },

  viewOriginLoading: false,

  updateViewOriginLoading: (status: boolean) => {
    set(() => ({
      viewOriginLoading: status,
    }));
  },

  // settings
  lastViewRouteBeforeSetting: null,
  setLastViewRouteBeforeSetting(s: Location) {
    set(() => ({
      lastViewRouteBeforeSetting: s,
    }));
  },
});
