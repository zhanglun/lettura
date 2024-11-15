import React, { useEffect, useRef, useState } from 'react';
import { Box, Flex, Slider, IconButton, Text } from '@radix-ui/themes';
import { PlayIcon, PauseIcon, SpeakerLoudIcon, SpeakerOffIcon, ChevronUpIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import { useAudioPlayer } from './useAudioPlayer';
import { MiniPlayer } from './MiniPlayer';
import { PlayList } from './PlayList';
import { formatTime } from './utils';
import clsx from 'clsx';

export interface AudioTrack {
  id: string;
  title: string;
  url: string;
  duration?: number;
}

interface PodcastPlayerProps {
  tracks: AudioTrack[];
  initialTrackId?: string;
  mini?: boolean;
}

export const LPodcast: React.FC<PodcastPlayerProps> = ({ 
  tracks, 
  initialTrackId,
  mini = false 
}) => {
  const [isMini, setIsMini] = useState(mini);
  const [showPlaylist, setShowPlaylist] = useState(false);
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
  } = useAudioPlayer(tracks, initialTrackId);

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
            tracks={tracks}
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
                onClick={togglePlay}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
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
                onChange={(value) => seek(value[0])}
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
              onChange={(value) => setVolume(value[0] / 100)}
            />
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
};
