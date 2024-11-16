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
      const track = store.tracks.find(t => t.id === savedTrackId);
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
    if (audioRef.current && store.currentTrack) {
      audioRef.current.src = store.currentTrack.url;
      if (store.podcastPlayingStatus) {
        audioRef.current.play();
      }
    }
  }, [store.currentTrack]);

  // Handle playing status changes
  useEffect(() => {
    if (audioRef.current) {
      if (store.podcastPlayingStatus) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [store.podcastPlayingStatus]);

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
      localStorage.setItem(STORAGE_KEYS.CURRENT_TRACK, store.currentTrack.id);
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

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
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

  return {
    currentTrack: store.currentTrack,
    isPlaying: store.podcastPlayingStatus,
    volume,
    progress,
    duration,
    togglePlay,
    setVolume,
    seek,
    playTrack: store.setCurrentTrack,
    setProgress,
    playPrevious: store.playPrev,
    playNext: store.playNext,
  };
};
