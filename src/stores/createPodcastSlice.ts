import { StateCreator } from "zustand";
import { AudioTrack } from "@/components/LPodcast";
import { Podcast, db } from "@/helpers/podcastDB";
import { toast } from "sonner";

export interface PodcastSlice {
  podcastPanelStatus: boolean;
  updatePodcastPanelStatus: (status: boolean) => void;
  podcastPlayingStatus: boolean;
  updatePodcastPlayingStatus: (status: boolean) => void;
  currentTrack: AudioTrack | null;
  setCurrentTrack: (track: AudioTrack | null) => void;
  tracks: AudioTrack[];
  setTracks: (tracks: AudioTrack[]) => void;
  currentPlayingIndex: number;
  setCurrentPlayingIndex: (index: number) => void;
  playNext: () => void;
  playPrev: () => void;
  addToPlayListAndPlay: (record: Podcast) => Promise<void>;
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

  currentPlayingIndex: -1,
  setCurrentPlayingIndex: (index: number) => {
    set(() => ({
      currentPlayingIndex: index,
    }));
  },

  playNext: () => {
    const { tracks, currentPlayingIndex, setCurrentTrack, setCurrentPlayingIndex } = get();
    if (tracks.length === 0) return;
    
    const nextIndex = currentPlayingIndex + 1 >= tracks.length ? 0 : currentPlayingIndex + 1;
    setCurrentPlayingIndex(nextIndex);
    setCurrentTrack(tracks[nextIndex]);
  },

  playPrev: () => {
    const { tracks, currentPlayingIndex, setCurrentTrack, setCurrentPlayingIndex } = get();
    if (tracks.length === 0) return;
    
    const prevIndex = currentPlayingIndex - 1 < 0 ? tracks.length - 1 : currentPlayingIndex - 1;
    setCurrentPlayingIndex(prevIndex);
    setCurrentTrack(tracks[prevIndex]);
  },

  addToPlayListAndPlay: async (record: Podcast) => {
    try {
      // 尝试添加到数据库
      await db.podcasts.add(record);
      toast.success("start playing");
    } catch (error: any) {
      if (error.name !== "ConstraintError") {
        throw error;
      }
      // 如果已经在列表中，继续播放
    }

    // 转换为 AudioTrack 格式
    const newTrack: AudioTrack = {
      id: record.uuid,
      title: record.title,
      url: record.mediaURL,
    };

    // 更新状态
    const { tracks, setTracks, setCurrentTrack, updatePodcastPanelStatus, updatePodcastPlayingStatus, setCurrentPlayingIndex } = get();
    
    // 检查是否已经在列表中
    const existingTrackIndex = tracks.findIndex(track => track.id === newTrack.id);
    if (existingTrackIndex === -1) {
      // 如果不在列表中，添加到列表末尾并播放
      setTracks([...tracks, newTrack]);
      setCurrentPlayingIndex(tracks.length); // 新曲目的索引
    } else {
      // 如果已在列表中，直接播放该曲目
      setCurrentPlayingIndex(existingTrackIndex);
    }
    
    // 设置为当前播放的曲目
    setCurrentTrack(newTrack);
    // 显示播放器面板
    updatePodcastPanelStatus(true);
    // 开始播放
    updatePodcastPlayingStatus(true);
  },
});
