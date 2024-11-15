export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const STORAGE_KEYS = {
  VOLUME: 'lpodcast_volume',
  PROGRESS: 'lpodcast_progress',
  CURRENT_TRACK: 'lpodcast_current_track',
} as const;
