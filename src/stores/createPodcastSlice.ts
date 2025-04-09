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
  removeTrack: (track: AudioTrack) => void;
}

export const createPodcastSlice: StateCreator<PodcastSlice, [], [], PodcastSlice> = (set, get) => ({
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
    } catch (error: any) {
      if (error.name !== "ConstraintError") {
        throw error;
      }
      // 如果已经在列表中，继续播放
    }

    // 转换为 AudioTrack 格式
    const newTrack: AudioTrack = {
      uuid: record.uuid,
      title: record.title,
      url: record.mediaURL,
      thumbnail: record.thumbnail,
      author: record.author,
      // duration: record.duration,
      feed_title: record.feed_title,
      feed_logo: record.feed_logo,
    };

    // 更新状态
    const {
      tracks,
      setTracks,
      setCurrentTrack,
      updatePodcastPanelStatus,
      updatePodcastPlayingStatus,
      setCurrentPlayingIndex,
    } = get();

    // 检查是否已经在列表中
    const existingTrackIndex = tracks.findIndex((track) => track.uuid === newTrack.uuid);
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

  async removeTrack(track: AudioTrack) {
    const { tracks, setTracks, currentTrack, setCurrentTrack, updatePodcastPlayingStatus, setCurrentPlayingIndex } =
      get();

    // 从列表中移除
    const newTracks = tracks.filter((t) => t.uuid !== track.uuid);
    setTracks(newTracks);

    // 从数据库中删除
    try {
      await db.podcasts.where("uuid").equals(track.uuid).delete();
    } catch (error) {
      console.error("Failed to delete podcast from database:", error);
      return;
    }

    // 如果删除的是当前播放的音频，重置播放状态
    if (currentTrack?.uuid === track.uuid) {
      setCurrentTrack(null);
      updatePodcastPlayingStatus(false);
      setCurrentPlayingIndex(-1);
    } else {
      // 如果删除的音频在当前播放音频之前，需要更新当前播放索引
      const currentIndex = tracks.findIndex((t) => t.uuid === currentTrack?.uuid);
      const removedIndex = tracks.findIndex((t) => t.uuid === track.uuid);
      if (removedIndex < currentIndex) {
        setCurrentPlayingIndex(currentIndex - 1);
      }
    }
  },
});
