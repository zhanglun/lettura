import React from 'react';
import { Box, Flex, Text, Avatar } from '@radix-ui/themes';
import { AudioTrack } from './index';
import { formatTime } from './utils';
import { useBearStore } from '@/stores';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayIcon } from '@radix-ui/react-icons';
import clsx from 'clsx';
import './PlayList.css';

const AudioWaveform = () => {
  const bars = [
    { height: [8, 16, 8], delay: 0 },
    { height: [10, 20, 10], delay: 0.2 },
    { height: [6, 14, 6], delay: 0.4 },
    { height: [12, 18, 12], delay: 0.6 },
  ];

  return (
    <Flex className="h-6 items-center justify-center gap-1">
      {bars.map((bar, index) => (
        <motion.div
          key={index}
          initial={{ height: bar.height[0] }}
          animate={{ height: bar.height }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: bar.delay,
          }}
          className="w-0.5 bg-white rounded-[1px]"
        />
      ))}
    </Flex>
  );
};

interface PlayListProps {
  onClose: () => void;
  onTrackSelect: (track: AudioTrack) => void;
  currentTrack?: AudioTrack | null;
  isPlaying?: boolean;
  onPlay?: (track: AudioTrack) => void;
}

const listAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring", bounce: 0.2, duration: 0.6 },
};

const itemAnimation = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { type: "spring", bounce: 0.2 },
};

const overlayAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

export const PlayList: React.FC<PlayListProps> = ({
  onClose,
  onTrackSelect,
  currentTrack,
  isPlaying = false,
  onPlay,
}) => {
  const tracks = useBearStore((state) => state.tracks);

  if (tracks.length === 0) {
    return (
      <motion.div initial={listAnimation.initial} animate={listAnimation.animate} transition={listAnimation.transition}>
        <Flex className="py-8 items-center justify-center flex-col gap-3">
          <Text className="text-gray-11 text-xl font-medium">暂无播放内容</Text>
          <Text className="text-gray-9 text-sm">添加一些播客开始收听吧</Text>
        </Flex>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={listAnimation.initial}
      animate={listAnimation.animate}
      transition={listAnimation.transition}
      className="bg-background h-[50vh] w-[380px] flex flex-col overflow-hidden"
    >
      <Box className="border-b border-gray-5 bg-background backdrop-blur-sm sticky top-0 z-10">
        <Flex className="px-4 py-3 items-center justify-between">
          <Text className="text-gray-12 font-medium text-sm">播放列表</Text>
          <Text className="text-gray-11 text-sm">{tracks.length} 集</Text>
        </Flex>
      </Box>

      <Box className="flex-1 overflow-y-auto playlist-scroll">
        <Box className="py-2 pl-2">
          {tracks.map((track, index) => (
            <motion.div
              key={track.id}
              custom={index}
              initial={itemAnimation.initial}
              animate={itemAnimation.animate}
              transition={{
                ...itemAnimation.transition,
                delay: index * 0.05,
              }}
              className="w-full"
            >
              <Flex
                align="center"
                gap="3"
                className={clsx(
                  "playlist-item w-full px-2 py-2 cursor-pointer rounded-md",
                  track.id === currentTrack?.id ? "bg-accent-4 hover:bg-accent-5" : "hover:bg-gray-3"
                )}
                onClick={() => onTrackSelect(track)}
              >
                <Box className="playlist-cover-wrapper relative flex-shrink-0">
                  <Avatar
                    size="3"
                    src={track.thumbnail || ""}
                    fallback={track.title[0]}
                    radius="small"
                    className="w-12 h-12"
                  />
                  <AnimatePresence>
                    {track.id === currentTrack?.id && isPlaying ? (
                      <motion.div
                        initial={overlayAnimation.initial}
                        animate={overlayAnimation.animate}
                        exit={overlayAnimation.exit}
                        transition={overlayAnimation.transition}
                      >
                        <Flex className="absolute inset-0 bg-black/30 rounded-sm backdrop-blur-[1px] items-center justify-center">
                          <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 260,
                              damping: 20,
                            }}
                          >
                            <AudioWaveform />
                          </motion.div>
                        </Flex>
                      </motion.div>
                    ) : (
                      <div
                        className="play-button-overlay"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onPlay) {
                            onPlay(track);
                          } else {
                            onTrackSelect(track);
                          }
                        }}
                      >
                        <div className="play-button">
                          <PlayIcon width={24} height={24} />
                        </div>
                      </div>
                    )}
                  </AnimatePresence>
                </Box>

                <Flex direction="column" className="flex-1 min-w-0 max-w-[calc(100%-80px)]">
                  <Text
                    size="2"
                    className={clsx(
                      "playlist-text truncate",
                      track.id === currentTrack?.id ? "text-accent-12 font-medium" : "text-gray-11"
                    )}
                  >
                    {track.title}
                  </Text>
                  {track.author && (
                    <Text
                      size="1"
                      className={clsx(
                        "playlist-subtext truncate",
                        track.id === currentTrack?.id ? "text-accent-11" : "text-gray-10"
                      )}
                    >
                      {track.author}
                    </Text>
                  )}
                </Flex>

                {track.duration && (
                  <Box className="flex-shrink-0 w-20 text-right">
                    <Text
                      size="1"
                      className={clsx(
                        "playlist-subtext",
                        track.id === currentTrack?.id ? "text-accent-11" : "text-gray-10"
                      )}
                    >
                      {formatTime(track.duration)}
                    </Text>
                  </Box>
                )}
              </Flex>
            </motion.div>
          ))}
        </Box>
      </Box>
    </motion.div>
  );
};
