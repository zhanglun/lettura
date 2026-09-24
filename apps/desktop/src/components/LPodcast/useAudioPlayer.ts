import { useEffect, useRef, useState } from "react";
import { AudioTrack } from "./index";
import { STORAGE_KEYS } from "./utils";
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

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastFlushRef = useRef(0);
  const [volume, setVolume] = useState(() => {
    const savedVolume = localStorage.getItem(STORAGE_KEYS.VOLUME);
    return savedVolume ? parseFloat(savedVolume) : 1;
  });
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PLAYBACK_RATE);
    return saved ? parseFloat(saved) : 1;
  });

  const store = useBearStore(
    useShallow((state) => ({
      currentTrack: state.currentTrack,
      tracks: state.tracks,
      podcastPlayingStatus: state.podcastPlayingStatus,
      updatePodcastPlayingStatus: state.updatePodcastPlayingStatus,
      setCurrentTrack: state.setCurrentTrack,
      playNext: state.playNext,
      playPrev: state.playPrev,
    })),
  );

  // 接入单例元素；卸载只落盘进度，不销毁元素（其他消费者仍在用）
  useEffect(() => {
    const audio = getAudio();
    audioRef.current = audio;
    audio.volume = volume;
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
    };

    const handleEnded = () => {
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

  // Save volume to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VOLUME, volume.toString());
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // 倍速：持久化并应用到音频元素
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLAYBACK_RATE, String(playbackRate));
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

  const playTrack = (track: AudioTrack) => {
    if (track.uuid !== store.currentTrack?.uuid) {
      // 先暂停当前播放
      store.updatePodcastPlayingStatus(false);
      // 设置新的曲目
      store.setCurrentTrack(track);
      // 延迟一帧后开始播放
      requestAnimationFrame(() => {
        store.updatePodcastPlayingStatus(true);
      });
    } else {
      store.updatePodcastPlayingStatus(!store.podcastPlayingStatus);
    }
  };

  return {
    currentTrack: store.currentTrack,
    isPlaying: store.podcastPlayingStatus,
    volume,
    progress,
    duration,
    playbackRate,
    setPlaybackRate,
    togglePlay,
    setVolume,
    seek,
    skip,
    playTrack,
    setProgress,
    playPrevious: store.playPrev,
    playNext: store.playNext,
  };
};
