import React, { useEffect, useRef, useState } from "react";
import { Box, Flex, Slider, IconButton, Text, Popover, Avatar } from "@radix-ui/themes";
import {
  PlayIcon,
  PauseIcon,
  SpeakerLoudIcon,
  SpeakerOffIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ListBulletIcon,
  HeartIcon,
} from "@radix-ui/react-icons";
import { useAudioPlayer } from "./useAudioPlayer";
import { MiniPlayer } from "./MiniPlayer";
import { PlayList } from "./PlayList";
import { formatTime } from "./utils";
import { useBearStore } from "@/stores";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/helpers/podcastDB";

export interface AudioTrack {
  id: string;
  title: string;
  url: string;
  duration?: number;
  thumbnail?: string;
  author?: string;
}

interface PodcastPlayerProps {
  mini?: boolean;
}

const slideAnimation = {
  initial: { y: "100%" },
  animate: { y: 0 },
  exit: { y: "100%" },
  transition: { type: "spring", bounce: 0.2, duration: 0.6 },
};

export const LPodcast: React.FC<PodcastPlayerProps> = ({ mini = false }) => {
  const [isMini, setIsMini] = useState(mini);
  const bearStore = useBearStore();
  const { setTracks, setCurrentTrack } = bearStore;

  // 从数据库加载播放列表
  const tracks = useLiveQuery(
    () =>
      db.podcasts.toArray().then((podcasts) =>
        podcasts.map((podcast) => ({
          id: podcast.uuid,
          title: podcast.title,
          url: podcast.mediaURL,
          thumbnail: podcast.thumbnail,
          author: podcast.author,
        }))
      ),
    [],
    []
  );

  // 当 tracks 变化时更新 store
  useEffect(() => {
    if (tracks) {
      setTracks(tracks);
      // 如果没有当前播放的曲目，设置第一个曲目为当前曲目
      if (!bearStore.currentTrack && tracks.length > 0) {
        setCurrentTrack(tracks[0]);
      }
    }
  }, [tracks]);

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
  } = useAudioPlayer();

  return (
    <AnimatePresence mode="wait">
      {isMini ? (
        <motion.div
          key="mini"
          initial={slideAnimation.initial}
          animate={slideAnimation.animate}
          exit={slideAnimation.exit}
          transition={slideAnimation.transition}
        >
          <MiniPlayer
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            togglePlay={togglePlay}
            onExpand={() => setIsMini(false)}
          />
        </motion.div>
      ) : (
        <motion.div
          key="full"
          initial={slideAnimation.initial}
          animate={slideAnimation.animate}
          exit={slideAnimation.exit}
          transition={slideAnimation.transition}
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg"
          style={{ zIndex: 1000 }}
        >
          <Box p="3" className="max-w-5xl mx-auto">
            <Flex gap="4" align="center">
              {/* Section A: Cover and Info */}
              <Flex gap="2" align="center" className="w-1/3 min-w-[320px]">
                {/* Cover image */}
                <Avatar
                  size="4"
                  radius="full"
                  src={currentTrack?.thumbnail}
                  fallback={
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
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
                />

                {/* Track info */}
                <Flex direction="column" gap="1" className="min-w-0">
                  <Text size="2" weight="medium" className="truncate">
                    {currentTrack?.title || "No track selected"}
                  </Text>
                  <Text size="1" color="gray" className="truncate">
                    {currentTrack?.author || "Unknown artist"}
                  </Text>
                </Flex>
              </Flex>

              {/* Section B: Controls and Progress */}
              <Flex gap="1" align="center" className="w-1/3">
                {/* Playback controls */}
                <Flex gap="2" align="center">
                  <IconButton size="2" variant="ghost" onClick={playPrevious}>
                    <ChevronUpIcon />
                  </IconButton>
                  <IconButton size="2" variant="ghost" onClick={togglePlay}>
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                  </IconButton>
                  <IconButton size="2" variant="ghost" onClick={playNext}>
                    <ChevronDownIcon />
                  </IconButton>
                  <IconButton size="2" variant="ghost" onClick={() => {}}>
                    <HeartIcon />
                  </IconButton>
                </Flex>

                {/* Progress */}
                <Flex direction="column" gap="1" className="flex-1">
                  <Flex justify="between" align="center">
                    <Text size="1" color="gray">
                      {formatTime(progress)}
                    </Text>
                    <Text size="1" color="gray">
                      {formatTime(duration)}
                    </Text>
                  </Flex>
                  <Slider
                    size="1"
                    value={[progress]}
                    max={duration}
                    step={1}
                    onValueChange={(value) => seek(value[0])}
                  />
                </Flex>
              </Flex>

              {/* Section C: Additional Controls */}
              <Flex gap="3" align="center" justify="end" className="w-1/3">
                {/* Playlist */}
                <Popover.Root>
                  <Popover.Trigger>
                    <IconButton size="2" variant="ghost">
                      <ListBulletIcon />
                    </IconButton>
                  </Popover.Trigger>
                  <Popover.Content>
                    <PlayList
                      onTrackSelect={(track) => {
                        playTrack(track);
                      }}
                      onClose={() => {}}
                      currentTrack={currentTrack}
                    />
                  </Popover.Content>
                </Popover.Root>

                {/* Volume */}
                <Flex gap="2" align="center" style={{ width: 120 }}>
                  <IconButton size="2" variant="ghost" onClick={() => setVolume(volume === 0 ? 1 : 0)}>
                    {volume === 0 ? <SpeakerOffIcon /> : <SpeakerLoudIcon />}
                  </IconButton>
                  <Slider size="1" value={[volume]} max={1} step={0.1} onValueChange={(value) => setVolume(value[0])} />
                </Flex>

                {/* Mini mode toggle */}
                <IconButton size="2" variant="ghost" onClick={() => setIsMini(true)}>
                  <ChevronDownIcon />
                </IconButton>
              </Flex>
            </Flex>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
