import React from 'react';
import { Box, Flex, IconButton, Text } from '@radix-ui/themes';
import { PlayIcon, PauseIcon, ArrowUpIcon } from '@radix-ui/react-icons';
import { AudioTrack } from './index';

interface MiniPlayerProps {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  togglePlay: () => void;
  onExpand: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  togglePlay,
  onExpand,
}) => {
  return (
    <Box
      className="mini-player"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'var(--color-panel-solid)',
        padding: '8px',
        width: '240px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
      }}
    >
      <Flex align="center" gap="2">
        <IconButton
          size="1"
          variant="soft"
          onClick={togglePlay}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </IconButton>
        <Text size="1" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {currentTrack?.title || 'No track selected'}
        </Text>
        <IconButton
          size="1"
          variant="ghost"
          onClick={onExpand}
        >
          <ArrowUpIcon />
        </IconButton>
      </Flex>
    </Box>
  );
};
