import { StateCreator } from "zustand";
import { AudioTrack } from "@/components/LPodcast";
import { Podcast, db } from "@/helpers/podcastDB";
import { showErrorToast } from "@/helpers/errorHandler";

export type PlayerMode = "bar" | "full" | "min";

/** 睡眠定时：minutes 供 UI 显示，endsAt 供剩余时间计算 */
export interface SleepTimer {
  minutes: number;
  endsAt: number;
}

export const SLEEP_STEPS = [15, 30, 60] as const;

export interface PodcastSlice {
  /** 播放器形态：bar 底部条 / full 沉浸页 / min 收起圆钮（podcast.html 契约） */
  playerMode: PlayerMode;
  setPlayerMode: (mode: PlayerMode) => void;
  podcastPlayingStatus: boolean;
  updatePodcastPlayingStatus: (status: boolean) => void;
  currentTrack: AudioTrack | null;
  setCurrentTrack: (track: AudioTrack | null) => void;
  tracks: AudioTrack[];
  setTracks: (tracks: AudioTrack[]) => void;
  /** 上一集/下一集：索引由 currentTrack 推导，队列点击不会失同步 */
  playNext: () => void;
  playPrev: () => void;
  /** 点行即切：队列与播放列表共用（点当前集 = 播放/暂停） */
  playTrack: (track: AudioTrack) => void;
  addToPlayListAndPlay: (record: Podcast) => Promise<void>;
  removeTrack: (track: AudioTrack) => void;
  /** 睡眠定时（到点暂停）；null = 关闭 */
  sleepTimer: SleepTimer | null;
  setSleepTimer: (minutes: number | null) => void;
}

/** 睡眠定时句柄挂在模块级：slice 重载/多次设置时旧定时器必须作废 */
let sleepTimerHandle: ReturnType<typeof setTimeout> | null = null;

export const createPodcastSlice: StateCreator<
  PodcastSlice,
  [],
  [],
  PodcastSlice
> = (set, get) => ({
  playerMode: "bar",
  setPlayerMode: (mode: PlayerMode) => {
    set(() => ({
      playerMode: mode,
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

  playNext: () => {
    const { tracks, currentTrack, setCurrentTrack } = get();
    if (tracks.length === 0) return;
    const idx = tracks.findIndex((t) => t.uuid === currentTrack?.uuid);
    const next = tracks[(idx + 1) % tracks.length];
    setCurrentTrack(next);
    get().updatePodcastPlayingStatus(true);
  },

  playPrev: () => {
    const { tracks, currentTrack, setCurrentTrack } = get();
    if (tracks.length === 0) return;
    const idx = tracks.findIndex((t) => t.uuid === currentTrack?.uuid);
    const prev = tracks[(idx - 1 + tracks.length) % tracks.length];
    setCurrentTrack(prev);
    get().updatePodcastPlayingStatus(true);
  },

  playTrack: (track: AudioTrack) => {
    const { currentTrack, setCurrentTrack, podcastPlayingStatus } = get();
    if (track.uuid === currentTrack?.uuid) {
      get().updatePodcastPlayingStatus(!podcastPlayingStatus);
      return;
    }
    setCurrentTrack(track);
    get().updatePodcastPlayingStatus(true);
  },

  addToPlayListAndPlay: async (record: Podcast) => {
    try {
      // 尝试添加到数据库（已存在时 ConstraintError 忽略，继续播放）
      await db.podcasts.add(record);
    } catch (error: any) {
      if (error.name !== "ConstraintError") {
        throw error;
      }
    }

    // 转换为 AudioTrack 格式
    const newTrack: AudioTrack = {
      uuid: record.uuid,
      title: record.title,
      url: record.mediaURL,
      thumbnail: record.thumbnail,
      author: record.author,
      duration: record.duration,
      feed_title: record.feed_title,
      feed_logo: record.feed_logo,
    };

    const { tracks, setTracks, setCurrentTrack, updatePodcastPlayingStatus } =
      get();

    if (!tracks.some((track) => track.uuid === newTrack.uuid)) {
      setTracks([...tracks, newTrack]);
    }
    setCurrentTrack(newTrack);
    updatePodcastPlayingStatus(true);
  },

  async removeTrack(track: AudioTrack) {
    const {
      tracks,
      setTracks,
      currentTrack,
      setCurrentTrack,
      updatePodcastPlayingStatus,
    } = get();

    const removedIndex = tracks.findIndex((t) => t.uuid === track.uuid);
    const newTracks = tracks.filter((t) => t.uuid !== track.uuid);
    setTracks(newTracks);

    // 从数据库中删除
    try {
      await db.podcasts.where("uuid").equals(track.uuid).delete();
    } catch (error) {
      showErrorToast(error, "Failed to delete podcast from database");
      return;
    }

    // 删除的是当前曲目：接替者顶上（标准队列行为），清空才停播
    if (currentTrack?.uuid === track.uuid) {
      const successor =
        newTracks.length > 0
          ? newTracks[Math.min(removedIndex, newTracks.length - 1)]
          : null;
      setCurrentTrack(successor);
      if (!successor) {
        updatePodcastPlayingStatus(false);
      }
    }
  },

  sleepTimer: null,
  setSleepTimer: (minutes: number | null) => {
    if (sleepTimerHandle) {
      clearTimeout(sleepTimerHandle);
      sleepTimerHandle = null;
    }
    if (!minutes) {
      set(() => ({ sleepTimer: null }));
      return;
    }
    const timer: SleepTimer = {
      minutes,
      endsAt: Date.now() + minutes * 60_000,
    };
    set(() => ({ sleepTimer: timer }));
    sleepTimerHandle = setTimeout(() => {
      sleepTimerHandle = null;
      set(() => ({ sleepTimer: null }));
      get().updatePodcastPlayingStatus(false);
    }, minutes * 60_000);
  },
});
