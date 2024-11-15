import React from 'react';
import { Box, Flex, Text } from '@radix-ui/themes';
import { AudioTrack } from './index';
import { formatTime } from './utils';

interface PlayListProps {
  tracks: AudioTrack[];
  currentTrack: AudioTrack | null;
  onTrackSelect: (track: AudioTrack) => void;
}

export const PlayList: React.FC<PlayListProps> = ({
  tracks,
  currentTrack,
  onTrackSelect,
}) => {
  return (
    <Box style={{ maxHeight: '200px', overflowY: 'auto' }}>
      {tracks.map((track) => (
        <Flex
          key={track.id}
          align="center"
          gap="2"
          style={{
            padding: '8px',
            cursor: 'pointer',
            borderRadius: '4px',
            background: track.id === currentTrack?.id ? 'var(--color-surface-accent)' : 'transparent',
          }}
          onClick={() => onTrackSelect(track)}
        >
          <Text
            size="1"
            weight={track.id === currentTrack?.id ? 'medium' : 'regular'}
            style={{
              flex: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {track.title}
          </Text>
          {track.duration && (
            <Text size="1" color="gray">
              {formatTime(track.duration)}
            </Text>
          )}
        </Flex>
      ))}
    </Box>
  );
};
