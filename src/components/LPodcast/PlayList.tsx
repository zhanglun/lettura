import React from 'react';
import { Box, Flex, Text, ScrollArea } from '@radix-ui/themes';
import { AudioTrack } from './index';
import { formatTime } from './utils';
import { useBearStore } from '@/stores';
import { motion } from 'framer-motion';

interface PlayListProps {
  onClose: () => void;
  onTrackSelect: (track: AudioTrack) => void;
  currentTrack: AudioTrack | null;
}

const listAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring", bounce: 0.2, duration: 0.6 }
};

const itemAnimation = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { type: "spring", bounce: 0.2 }
};

export const PlayList: React.FC<PlayListProps> = ({
  onClose,
  onTrackSelect,
  currentTrack,
}) => {
  const tracks = useBearStore((state) => state.tracks);

  if (tracks.length === 0) {
    return (
      <motion.div
        initial={listAnimation.initial}
        animate={listAnimation.animate}
        transition={listAnimation.transition}
      >
        <Box p="4">
          <Text size="2" color="gray">No tracks available</Text>
        </Box>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={listAnimation.initial}
      animate={listAnimation.animate}
      transition={listAnimation.transition}
    >
      <ScrollArea type="hover" scrollbars="vertical" style={{ height: 300 }}>
        <Box style={{ width: 300 }}>
          <Text size="2" weight="medium" mb="2" px="3">
            Playlist ({tracks.length})
          </Text>
          {tracks.map((track, index) => (
            <motion.div
              key={track.id}
              custom={index}
              initial={itemAnimation.initial}
              animate={itemAnimation.animate}
              transition={{
                ...itemAnimation.transition,
                delay: index * 0.05
              }}
            >
              <Flex
                align="center"
                gap="2"
                px="3"
                py="2"
                style={{
                  cursor: 'pointer',
                  background: track.id === currentTrack?.id ? 'var(--accent-3)' : 'transparent',
                }}
                onClick={() => onTrackSelect(track)}
              >
                <Text
                  size="2"
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
            </motion.div>
          ))}
        </Box>
      </ScrollArea>
    </motion.div>
  );
};
