import { StateCreator } from "zustand";
import { AudioTrack } from "@/components/LPodcast";

export interface PodcastSlice {
  podcastPanelStatus: boolean;
  updatePodcastPanelStatus: (status: boolean) => void;
  podcastPlayingStatus: boolean;
  updatePodcastPlayingStatus: (status: boolean) => void;
  currentTrack: AudioTrack | null;
  setCurrentTrack: (track: AudioTrack | null) => void;
  tracks: AudioTrack[];
  setTracks: (tracks: AudioTrack[]) => void;
}

export const createPodcastSlice: StateCreator<PodcastSlice, [], [], PodcastSlice> = (
  set,
  get
) => ({
  podcastPanelStatus: false,
  updatePodcastPanelStatus: (status: boolean) => {
    set(() => ({
      podcastPanelStatus: status,
    }));
  },

  podcastPlayingStatus: false,
  updatePodcastPlayingStatus: (status: boolean) => {
    set(() => ({
      podcastPlayingStatus: status,
    }));
  },

  currentTrack: null,
  setCurrentTrack: (track: AudioTrack | null) => {
    set(() => ({
      currentTrack: track,
    }));
  },

  tracks: [],
  setTracks: (tracks: AudioTrack[]) => {
    set(() => ({
      tracks,
    }));
  },
});
