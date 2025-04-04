import React from "react";
import { Box, Flex, IconButton, Text, Avatar } from "@radix-ui/themes";
import { PlayIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { AudioTrack } from "./index";
import { motion } from "framer-motion";
import "./shared.css";
import { PlayListPopover } from "./PlayListPopover";

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

interface MiniPlayerProps {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  togglePlay: () => void;
  onExpand: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ currentTrack, isPlaying, togglePlay, onExpand }) => {
  return (
    <Box className="bg-[var(--gray-1)] rounded-lg shadow-sm overflow-hidden w-[380px] border">
      <Flex align="center" className="p-2 gap-3">
        {/* Cover with play/pause overlay */}
        <div className="mini-player-cover">
          <Avatar
            size="3"
            radius="medium"
            src={currentTrack?.thumbnail}
            fallback={
              <div className="w-full h-full flex items-center justify-center bg-[var(--gray-3)]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 8v8" />
                  <path d="M8 12h8" />
                </svg>
              </div>
            }
            className="cursor-pointer"
          />

          {/* Always visible overlay */}
          <div className="play-button-overlay !opacity-100" onClick={togglePlay}>
            {isPlaying ? (
              <AudioWaveform />
            ) : (
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <PlayIcon className="text-white w-5 h-5" />
              </motion.div>
            )}
          </div>
        </div>

        <Flex direction="column" className="flex-1 min-w-0 max-w-[calc(100%-80px)]">
          <div className="text-sm font-medium flex-1 truncate">{currentTrack?.title || "No track selected"}</div>
          <div className="text-xs flex-1 truncate">
            {currentTrack?.author || currentTrack?.feed_title || "Unknown artist"}
          </div>
        </Flex>

        <PlayListPopover currentTrack={currentTrack} isPlaying={isPlaying} />
        {/* Expand Button */}
        <IconButton size="1" variant="ghost" onClick={onExpand}>
          <ChevronUpIcon />
        </IconButton>
      </Flex>
    </Box>
  );
};
