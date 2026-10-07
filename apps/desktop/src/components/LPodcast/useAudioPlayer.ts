import { t } from "i18next";
import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { toast } from "@/helpers/toast";
import { useAppStore } from "@/stores";

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

/** 键盘 ←/→ 的 ±30s：在模块级共享音频上直接 seek（AppLayout 等无 hook 场景调用） */
export function seekSharedAudioBy(delta: number) {
  if (!sharedAudio) return;
  const max = Number.isFinite(sharedAudio.duration)
    ? sharedAudio.duration
    : Infinity;
  sharedAudio.currentTime = Math.min(
    Math.max(0, sharedAudio.currentTime + delta),
    max,
  );
}

/** 进度写库节流（timeupdate 高频触发，且可能有多个消费者监听） */
const PROGRESS_FLUSH_MS = 5000;

/** ended 每个消费者各收一次（壳层 + 详情页各挂一份监听），只放行一次 */
let lastEndedAt = 0;

/** 播放失败上报去重：加载失败通常同时触发元素 error 事件与 play() 拒绝，只报一次 */
let lastPlaybackErrorAt = 0;

/**
 * 把播放失败的底层错误翻译成用户能懂的原因（事件时间调用，非渲染期）：
 * 元素 MediaError（加载/解码）与 play() 的 DOMException 双路径，附原始细节供排查。
 */
function describePlayFailure(error: unknown, audio: HTMLAudioElement): string {
  const media = audio.error;
  if (media) {
    const detail = media.message ? `(${media.message})` : "";
    switch (media.code) {
      case MediaError.MEDIA_ERR_NETWORK:
        return `${t("podcast.err_network")}${detail}`;
      case MediaError.MEDIA_ERR_DECODE:
        return `${t("podcast.err_decode")}${detail}`;
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        return `${t("podcast.err_not_supported")}${detail}`;
      case MediaError.MEDIA_ERR_ABORTED:
        return `${t("podcast.err_aborted")}${detail}`;
    }
  }
  const name = (error as DOMException | undefined)?.name ?? "";
  switch (name) {
    case "NotAllowedError":
      return t("podcast.err_not_allowed");
    case "NotSupportedError":
      return t("podcast.err_not_supported");
    case "NetworkError":
      return t("podcast.err_network");
  }
  const message = (error as DOMException | undefined)?.message ?? "";
  const tech = [name, message].filter(Boolean).join(": ");
  return tech
    ? `${t("podcast.err_generic")} (${tech})`
    : t("podcast.err_generic");
}

/** 失败 toast：带单集标题（自动连播时用户没点它，必须知道是哪集挂了） */
function reportPlaybackFailure(
  raw: unknown,
  reason: string,
  title?: string,
): void {
  console.error("[podcast] playback failed:", raw);
  const now = Date.now();
  if (now - lastPlaybackErrorAt < 1000) return;
  lastPlaybackErrorAt = now;
  toast.error(
    title
      ? t("podcast.play_failed_with_reason", { title, reason })
      : t("podcast.play_failed_generic", { reason }),
  );
}

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

  const store = useAppStore(
    useShallow((state) => ({
      currentTrack: state.currentTrack,
      podcastPlayingStatus: state.podcastPlayingStatus,
      updatePodcastPlayingStatus: state.updatePodcastPlayingStatus,
      podcastLoading: state.podcastLoading,
      updatePodcastLoading: state.updatePodcastLoading,
      playNext: state.playNext,
      getSavedProgress: state.getSavedProgress,
      persistProgress: state.persistProgress,
      persistDuration: state.persistDuration,
      clearProgress: state.clearProgress,
    })),
  );

  // 接入单例元素；卸载只落盘进度，不销毁元素（其他消费者仍在用）
  useEffect(() => {
    const audio = getAudio();
    audioRef.current = audio;
    audio.playbackRate = playbackRate;

    if (store.currentTrack?.uuid) {
      store.getSavedProgress(store.currentTrack.uuid).then((progress) => {
        if (progress && audioRef.current) {
          audioRef.current.currentTime = progress;
          setProgress(progress);
        }
      });
    }

    return () => {
      if (
        audioRef.current &&
        store.currentTrack?.uuid &&
        audioRef.current.currentTime > 0
      ) {
        store.persistProgress(
          store.currentTrack.uuid,
          audioRef.current.currentTime,
        );
      }
      audioRef.current = null;
    };
  }, [store.currentTrack?.uuid]);

  // Handle track changes and set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!(audio && store.currentTrack)) return;

    // 如果是新的曲目，需要设置新的 src
    if (audio.src !== store.currentTrack.url) {
      audio.src = store.currentTrack.url;
      // 加载保存的进度
      store.getSavedProgress(store.currentTrack.uuid).then((progress) => {
        if (progress) {
          audio.currentTime = progress;
          setProgress(progress);
        }
      });
    }

    // 根据播放状态来控制播放
    if (store.podcastPlayingStatus) {
      // 流还没缓冲到可连贯播放：亮加载态，playing 事件熄灭（缓存命中时本就 ready，不闪）
      if (audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
        store.updatePodcastLoading(true);
      }
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // AbortError = 播放请求被后续操作打断（切曲/暂停竞态），是正常现象
          if (error?.name === "AbortError") return;
          store.updatePodcastLoading(false);
          reportPlaybackFailure(
            error,
            describePlayFailure(error, audio),
            store.currentTrack?.title,
          );
          store.updatePodcastPlayingStatus(false);
        });
      }
    } else {
      audio.pause();
      store.updatePodcastLoading(false);
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
        store.persistProgress(store.currentTrack.uuid, currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      // 回填单集时长：队列行的时长靠它（首播后永久可用）
      if (store.currentTrack?.uuid && Number.isFinite(audio.duration)) {
        store.persistDuration(store.currentTrack.uuid, audio.duration);
      }
    };

    const handleEnded = () => {
      // ponytail: 1s 去重窗口；若将来出现更多消费者或同集连播，改成单引擎持有监听
      const now = Date.now();
      if (now - lastEndedAt < 1000) return;
      lastEndedAt = now;

      // 播放结束时清除进度
      if (store.currentTrack?.uuid) {
        store.clearProgress(store.currentTrack.uuid);
      }
      store.playNext();
    };

    // 加载态以音频元素的真实事件为准：开始出声/缓冲见底/加载失败
    const handlePlaying = () => store.updatePodcastLoading(false);
    const handleWaiting = () => {
      if (store.podcastPlayingStatus) {
        store.updatePodcastLoading(true);
      }
    };
    // 播放中途断流/解码失败只有元素 error 事件知道（play() 早已成功返回）：
    // 之前这里静默，用户只见播放停了不知道为什么
    const handleError = () => {
      store.updatePodcastLoading(false);
      if (store.podcastPlayingStatus) {
        store.updatePodcastPlayingStatus(false);
        reportPlaybackFailure(
          audio.error,
          describePlayFailure(null, audio),
          store.currentTrack?.title,
        );
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("error", handleError);
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
        store.persistProgress(store.currentTrack.uuid, time);
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
    const state = () => useAppStore.getState();

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
  }, [store.currentTrack?.uuid]);

  return {
    currentTrack: store.currentTrack,
    isPlaying: store.podcastPlayingStatus,
    isLoading: store.podcastLoading,
    progress,
    duration,
    playbackRate,
    setPlaybackRate,
    togglePlay,
    seek,
    skip,
  };
};
