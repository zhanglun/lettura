import { useEffect, useRef, useState } from 'react';
import { AudioTrack } from './index';
import { STORAGE_KEYS } from './utils';
import { useBearStore } from '@/stores';
import { db } from '@/helpers/podcastDB';

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(() => {
    const savedVolume = localStorage.getItem(STORAGE_KEYS.VOLUME);
    return savedVolume ? parseFloat(savedVolume) : 1;
  });
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const store = useBearStore((state) => ({
    currentTrack: state.currentTrack,
    tracks: state.tracks,
    podcastPlayingStatus: state.podcastPlayingStatus,
    updatePodcastPlayingStatus: state.updatePodcastPlayingStatus,
    setCurrentTrack: state.setCurrentTrack,
    playNext: state.playNext,
    playPrev: state.playPrev,
  }));

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    // Load saved progress from database
    if (store.currentTrack?.uuid) {
      db.podcasts.where('uuid').equals(store.currentTrack.uuid).first().then((podcast) => {
        if (podcast?.progress && audioRef.current) {
          audioRef.current.currentTime = podcast.progress;
          setProgress(podcast.progress);
        }
      });
    }

    return () => {
      if (audioRef.current) {
        // Save progress before unmounting
        const currentTime = audioRef.current.currentTime;
        if (store.currentTrack?.uuid && currentTime > 0) {
          db.podcasts.where('uuid').equals(store.currentTrack.uuid).modify({
            progress: currentTime
          });
        }
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [store.currentTrack?.uuid, volume]);

  // Handle track changes and set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !store.currentTrack) return;

    // 如果是新的曲目，需要设置新的 src
    if (audio.src !== store.currentTrack.url) {
      audio.src = store.currentTrack.url;
      // 加载保存的进度
      db.podcasts.where('uuid').equals(store.currentTrack.uuid).first().then((podcast) => {
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
          console.error("播放出错:", error);
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
      
      // 每当播放进度更新时，保存到数据库
      if (store.currentTrack?.uuid) {
        db.podcasts.where('uuid').equals(store.currentTrack.uuid).modify({
          progress: currentTime
        });
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      // 播放结束时清除进度
      if (store.currentTrack?.uuid) {
        db.podcasts.where('uuid').equals(store.currentTrack.uuid).modify({
          progress: 0
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

  const togglePlay = () => {
    store.updatePodcastPlayingStatus(!store.podcastPlayingStatus);
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
      
      // 保存新的播放进度
      if (store.currentTrack?.uuid) {
        db.podcasts.where('uuid').equals(store.currentTrack.uuid).modify({
          progress: time
        });
      }
    }
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
    togglePlay,
    setVolume,
    seek,
    playTrack,
    setProgress,
    playPrevious: store.playPrev,
    playNext: store.playNext,
  };
};
