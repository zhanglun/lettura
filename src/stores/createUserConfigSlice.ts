import { StateCreator } from "zustand";
import * as dataAgent from "../helpers/dataAgent";

export interface UserConfigSlice {
  userConfig: UserConfig;
  getUserConfig: any;
  updateUserConfig: (cfg: UserConfig) => void;

  setLastSyncTime: (t: Date) => void;

  viewOrigin: boolean;
  updateViewOrigin: (status: boolean) => void;
  viewOriginLoading: boolean;
  updateViewOriginLoading: (status: boolean) => void;

  podcastPanelStatus: boolean;
  updatePodcastPanelStatus: (status: boolean) => void;
  podcastPlayingStatus: boolean,
  updatePodcastPlayingStatus: (status: boolean) => void;
}

export const createUserConfigSlice: StateCreator<UserConfigSlice> = (
  set,
  get
) => ({
  userConfig: {} as UserConfig,

  getUserConfig: () => {
    return dataAgent.getUserConfig().then(({ data: cfg }) => {
      set(() => ({
        userConfig: cfg,
      }));

      return cfg;
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

  setLastSyncTime(t) {
    get().updateUserConfig({
      ...get().userConfig,
      last_sync_time: t,
    })
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

  podcastPanelStatus: false,
  updatePodcastPanelStatus: (status: boolean) => {
    set(() => ({
      podcastPanelStatus: status
    }))
  },
  podcastPlayingStatus: false,
  updatePodcastPlayingStatus: (status: boolean) => {
    set(() => ({
      podcastPlayingStatus: status
    }))
  },

});
