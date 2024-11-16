import React, { useEffect, useRef, useState } from 'react';
import { Box, Flex, Slider, IconButton, Text } from '@radix-ui/themes';
import { PlayIcon, PauseIcon, SpeakerLoudIcon, SpeakerOffIcon, ChevronUpIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import { useAudioPlayer } from './useAudioPlayer';
import { MiniPlayer } from './MiniPlayer';
import { PlayList } from './PlayList';
import { formatTime } from './utils';
import clsx from 'clsx';
import { useBearStore } from '@/stores';

export interface AudioTrack {
  id: string;
  title: string;
  url: string;
  duration?: number;
}

interface PodcastPlayerProps {
  mini?: boolean;
}

export const LPodcast: React.FC<PodcastPlayerProps> = ({
  mini = false
}) => {
  const [isMini, setIsMini] = useState(mini);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const bearStore = useBearStore();
  const {
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
    playPrevious,
    playNext,
  } = useAudioPlayer(bearStore.tracks, bearStore.currentTrackId);

  if (isMini) {
    return (
      <MiniPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        togglePlay={togglePlay}
        onExpand={() => setIsMini(false)}
      />
    );
  }

  return (
    <Box
      className="podcast-player"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--color-panel-solid)',
        borderTop: '1px solid var(--gray-5)',
        zIndex: 1000,
      }}
    >
      {showPlaylist && (
        <Box
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            background: 'var(--color-panel-solid)',
            borderTop: '1px solid var(--gray-5)',
            maxHeight: '300px',
            overflow: 'auto',
          }}
        >
          <PlayList
            tracks={bearStore.tracks}
            currentTrack={currentTrack}
            onTrackSelect={playTrack}
          />
        </Box>
      )}

      <Flex direction="column" gap="2" p="3">
        <Flex justify="between" align="center">
          <Flex align="center" gap="4" style={{ flex: 1 }}>
            <Flex align="center" gap="2">
              <IconButton
                size="2"
                variant="soft"
                onClick={playPrevious}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1.94976 2.74989C1.94976 2.44613 2.196 2.19989 2.49976 2.19989C2.80351 2.19989 3.04976 2.44613 3.04976 2.74989V7.2825C3.0954 7.18802 3.17046 7.10851 3.26662 7.05776L12.2666 2.30776C12.4216 2.22596 12.6081 2.23127 12.7582 2.32176C12.9083 2.41225 13 2.57471 13 2.74989V12.2499C13 12.4251 12.9083 12.5875 12.7582 12.678C12.6081 12.7685 12.4216 12.7738 12.2666 12.692L3.26662 7.94202C3.17046 7.89127 3.0954 7.81176 3.04976 7.71728V12.2499C3.04976 12.5537 2.80351 12.7999 2.49976 12.7999C2.196 12.7999 1.94976 12.5537 1.94976 12.2499V2.74989ZM11.9 3.48912L4.19076 7.49989L11.9 11.5107V3.48912Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                </svg>
              </IconButton>
              <IconButton
                size="2"
                variant="soft"
                onClick={togglePlay}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </IconButton>
              <IconButton
                size="2"
                variant="soft"
                onClick={playNext}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.0502 2.74989C13.0502 2.44613 12.804 2.19989 12.5002 2.19989C12.1965 2.19989 11.9502 2.44613 11.9502 2.74989V7.2825C11.9046 7.18802 11.8295 7.10851 11.7334 7.05776L2.73338 2.30776C2.57836 2.22596 2.39187 2.23127 2.24182 2.32176C2.09176 2.41225 2 2.57471 2 2.74989V12.2499C2 12.4251 2.09176 12.5875 2.24182 12.678C2.39187 12.7685 2.57836 12.7738 2.73338 12.692L11.7334 7.94202C11.8295 7.89127 11.9046 7.81176 11.9502 7.71728V12.2499C11.9502 12.5537 12.1965 12.7999 12.5002 12.7999C12.804 12.7999 13.0502 12.5537 13.0502 12.2499V2.74989ZM3.1 3.48912L10.8092 7.49989L3.1 11.5107V3.48912Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                </svg>
              </IconButton>
              <Text size="2" weight="medium" style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentTrack?.title || 'No track selected'}
              </Text>
            </Flex>

            <Flex align="center" gap="2" style={{ flex: 1 }}>
              <Text size="1" color="gray">
                {formatTime(progress)}
              </Text>
              <Slider
                size="1"
                variant="soft"
                value={[progress]}
                max={duration || 100}
                style={{ flex: 1 }}
                onChange={(value: number[]) => seek(value[0])}
              />
              <Text size="1" color="gray">
                {formatTime(duration || 0)}
              </Text>
            </Flex>
          </Flex>

          <Flex align="center" gap="2">
            <IconButton
              size="1"
              variant="ghost"
              onClick={() => setShowPlaylist(!showPlaylist)}
            >
              {showPlaylist ? <ChevronDownIcon /> : <ChevronUpIcon />}
            </IconButton>
            <IconButton
              size="1"
              variant="ghost"
              onClick={() => setVolume(volume > 0 ? 0 : 1)}
            >
              {volume > 0 ? <SpeakerLoudIcon /> : <SpeakerOffIcon />}
            </IconButton>
            <Slider
              size="1"
              variant="soft"
              value={[volume * 100]}
              max={100}
              style={{ width: '80px' }}
              onChange={(value: number[]) => setVolume(value[0] / 100)}
            />
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
};
