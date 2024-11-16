import React from 'react';
import { Box, Flex, Text } from '@radix-ui/themes';
import { AudioTrack } from './index';
import { formatTime } from './utils';
import { useBearStore } from '@/stores';

interface PlayListProps {
  onClose: () => void;
  onTrackSelect: (track: AudioTrack) => void;
  currentTrack: AudioTrack | null;
}

export const PlayList: React.FC<PlayListProps> = ({
  onClose,
  onTrackSelect,
  currentTrack,
}) => {
  const tracks = useBearStore((state) => state.tracks);

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
