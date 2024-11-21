import { useEffect, useRef, useState } from 'react';
import { AudioTrack } from './index';
import { STORAGE_KEYS } from './utils';
import { useBearStore } from '@/stores';

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

    // Load saved progress
    const savedTrackId = localStorage.getItem(STORAGE_KEYS.CURRENT_TRACK);
    const savedProgress = localStorage.getItem(STORAGE_KEYS.PROGRESS);

    if (savedTrackId && store.tracks.length > 0) {
      const track = store.tracks.find((t) => t.uuid === savedTrackId);
      if (track) {
        store.setCurrentTrack(track);
        audioRef.current.src = track.url;
        if (savedProgress) {
          const progress = parseFloat(savedProgress);
          audioRef.current.currentTime = progress;
          setProgress(progress);
        }
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !store.currentTrack) return;

    // 如果是新的曲目，需要设置新的 src
    if (audio.src !== store.currentTrack.url) {
      audio.src = store.currentTrack.url;
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
  }, [store.currentTrack, store.podcastPlayingStatus]);

  // Save volume to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VOLUME, volume.toString());
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Save current track and progress
  useEffect(() => {
    if (store.currentTrack) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_TRACK, store.currentTrack.uuid);
    }
  }, [store.currentTrack]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, progress.toString());
  }, [progress]);

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
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
  }, [store.playNext]);

  const togglePlay = () => {
    store.updatePodcastPlayingStatus(!store.podcastPlayingStatus);
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
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
