import { useEffect, useRef, useState } from "react";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { db } from "@/helpers/podcastDB";
import { showErrorToast } from "@/helpers/errorHandler";

/**
 * 音频元素是模块级单例：LPodcast（壳层）与 PodcastAdapter（详情页）
 * 会同时消费本 hook，若各自 new Audio() 会产生多实例同时播放同一曲目
 * （第二实例的 play() 打断第一实例 → AbortError → 误报 Failed to play）。
 */
let sharedAudio: HTMLAudioElement | null = null;
function getAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio();
  }
  return sharedAudio;
}

/** 停掉共享音频（消费者全部卸载/曲目清空时调用，否则声音会残响） */
export function stopSharedAudio() {
  if (sharedAudio) {
    sharedAudio.pause();
  }
}

/** 进度写库节流（timeupdate 高频触发，且可能有多个消费者监听） */
const PROGRESS_FLUSH_MS = 5000;

/** ended 每个消费者各收一次（壳层 + 详情页各挂一份监听），只放行一次 */
let lastEndedAt = 0;

/** 倍速持久化（音量交给系统，不设应用内控件） */
const PLAYBACK_RATE_KEY = "lpodcast_playback_rate";

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastFlushRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(() => {
    const saved = localStorage.getItem(PLAYBACK_RATE_KEY);
    return saved ? parseFloat(saved) : 1;
  });

  const store = useBearStore(
    useShallow((state) => ({
      currentTrack: state.currentTrack,
      podcastPlayingStatus: state.podcastPlayingStatus,
      updatePodcastPlayingStatus: state.updatePodcastPlayingStatus,
      playNext: state.playNext,
    })),
  );

  // 接入单例元素；卸载只落盘进度，不销毁元素（其他消费者仍在用）
  useEffect(() => {
    const audio = getAudio();
    audioRef.current = audio;
    audio.playbackRate = playbackRate;

    if (store.currentTrack?.uuid) {
      db.podcasts
        .where("uuid")
        .equals(store.currentTrack.uuid)
        .first()
        .then((podcast) => {
          if (podcast?.progress && audioRef.current) {
            audioRef.current.currentTime = podcast.progress;
            setProgress(podcast.progress);
          }
        });
    }

    return () => {
      if (audioRef.current && store.currentTrack?.uuid && audioRef.current.currentTime > 0) {
        db.podcasts.where("uuid").equals(store.currentTrack.uuid).modify({
          progress: audioRef.current.currentTime,
        });
      }
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.currentTrack?.uuid]);

  // Handle track changes and set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!(audio && store.currentTrack)) return;

    // 如果是新的曲目，需要设置新的 src
    if (audio.src !== store.currentTrack.url) {
      audio.src = store.currentTrack.url;
      // 加载保存的进度
      db.podcasts
        .where("uuid")
        .equals(store.currentTrack.uuid)
        .first()
        .then((podcast) => {
          if (podcast?.progress) {
            audio.currentTime = podcast.progress;
            setProgress(podcast.progress);
          }
        });
    }

    // 根据播放状态来控制播放
    if (store.podcastPlayingStatus) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // AbortError = 播放请求被后续操作打断（切曲/暂停竞态），是正常现象
          if (error?.name === "AbortError") return;
          showErrorToast(error, "Failed to play audio");
          store.updatePodcastPlayingStatus(false);
        });
      }
    } else {
      audio.pause();
    }

    // 设置音频事件监听器
    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime;
      setProgress(currentTime);

      const now = Date.now();
      if (
        store.currentTrack?.uuid &&
        now - lastFlushRef.current > PROGRESS_FLUSH_MS
      ) {
        lastFlushRef.current = now;
        db.podcasts.where("uuid").equals(store.currentTrack.uuid).modify({
          progress: currentTime,
        });
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      // 回填单集时长：队列行的时长靠它（首播后永久可用）
      if (store.currentTrack?.uuid && Number.isFinite(audio.duration)) {
        db.podcasts.where("uuid").equals(store.currentTrack.uuid).modify({
          duration: audio.duration,
        });
      }
    };

    const handleEnded = () => {
      // ponytail: 1s 去重窗口；若将来出现更多消费者或同集连播，改成单引擎持有监听
      const now = Date.now();
      if (now - lastEndedAt < 1000) return;
      lastEndedAt = now;

      // 播放结束时清除进度
      if (store.currentTrack?.uuid) {
        db.podcasts.where("uuid").equals(store.currentTrack.uuid).modify({
          progress: 0,
        });
      }
      store.playNext();
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [store.currentTrack, store.podcastPlayingStatus]);

  // 倍速：持久化并应用到音频元素
  useEffect(() => {
    localStorage.setItem(PLAYBACK_RATE_KEY, String(playbackRate));
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = () => {
    store.updatePodcastPlayingStatus(!store.podcastPlayingStatus);
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);

      // 保存新的播放进度
      if (store.currentTrack?.uuid) {
        db.podcasts.where("uuid").equals(store.currentTrack.uuid).modify({
          progress: time,
        });
      }
    }
  };

  // ±30s 跳转
  const skip = (delta: number) => {
    if (!audioRef.current) return;
    const next = Math.max(
      0,
      Math.min(audioRef.current.currentTime + delta, duration || Infinity),
    );
    seek(next);
  };

  // 系统媒体键 / 锁屏控件：桌面端的标准播客行为（WebView 不支持时整段跳过）
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    const state = () => useBearStore.getState();

    if (store.currentTrack) {
      ms.metadata = new MediaMetadata({
        title: store.currentTrack.title,
        artist: store.currentTrack.author ?? "",
        album: store.currentTrack.feed_title,
        artwork: store.currentTrack.thumbnail
          ? [{ src: store.currentTrack.thumbnail }]
          : undefined,
      });
    }

    const handle = (action: MediaSessionAction, fn: () => void) => {
      try {
        ms.setActionHandler(action, fn);
      } catch {
        // 该动作在当前平台不支持：忽略
      }
    };
    // 跳转只改 currentTime：timeupdate 会把进度同步到 UI 与库
    const nudge = (delta: number) => {
      const audio = getAudio();
      audio.currentTime = Math.max(
        0,
        Math.min(audio.duration || Infinity, audio.currentTime + delta),
      );
    };
    handle("play", () => state().updatePodcastPlayingStatus(true));
    handle("pause", () => state().updatePodcastPlayingStatus(false));
    handle("seekbackward", () => nudge(-30));
    handle("seekforward", () => nudge(30));
    handle("previoustrack", () => state().playPrev());
    handle("nexttrack", () => state().playNext());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.currentTrack?.uuid]);

  return {
    currentTrack: store.currentTrack,
    isPlaying: store.podcastPlayingStatus,
    progress,
    duration,
    playbackRate,
    setPlaybackRate,
    togglePlay,
    seek,
    skip,
  };
};
