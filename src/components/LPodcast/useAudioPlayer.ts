import { useEffect, useRef, useState } from 'react';
import { AudioTrack } from './index';
import { STORAGE_KEYS } from './utils';

export const useAudioPlayer = (tracks: AudioTrack[], initialTrackId?: string) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => {
    const savedVolume = localStorage.getItem(STORAGE_KEYS.VOLUME);
    return savedVolume ? parseFloat(savedVolume) : 1;
  });
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    // Load saved progress
    const savedTrackId = localStorage.getItem(STORAGE_KEYS.CURRENT_TRACK);
    const savedProgress = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    
    if (savedTrackId) {
      const track = tracks.find(t => t.id === savedTrackId);
      if (track) {
        setCurrentTrack(track);
        audioRef.current.src = track.url;
        if (savedProgress) {
          const progress = parseFloat(savedProgress);
          audioRef.current.currentTime = progress;
          setProgress(progress);
        }
      }
    } else if (initialTrackId) {
      const track = tracks.find(t => t.id === initialTrackId);
      if (track) {
        setCurrentTrack(track);
        audioRef.current.src = track.url;
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      localStorage.setItem(STORAGE_KEYS.VOLUME, volume.toString());
    }
  }, [volume]);

  // Save progress periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (audioRef.current && currentTrack) {
        localStorage.setItem(STORAGE_KEYS.PROGRESS, audioRef.current.currentTime.toString());
        localStorage.setItem(STORAGE_KEYS.CURRENT_TRACK, currentTrack.id);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTrack]);

  // Update progress and duration
  useEffect(() => {
    if (!audioRef.current) return;

    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setProgress(audioRef.current.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      // Optionally play next track
      const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id);
      if (currentIndex < tracks.length - 1) {
        playTrack(tracks[currentIndex + 1]);
      }
    };

    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioRef.current.addEventListener('ended', handleEnded);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, [currentTrack, tracks]);

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const playTrack = (track: AudioTrack) => {
    if (!audioRef.current || track.id === currentTrack?.id) return;

    audioRef.current.src = track.url;
    audioRef.current.play();
    setCurrentTrack(track);
    setIsPlaying(true);
    setProgress(0);
  };

  return {
    currentTrack,
    isPlaying,
    volume,
    progress,
    duration,
    togglePlay,
    setVolume,
    seek,
    playTrack,
    setProgress,
  };
};
