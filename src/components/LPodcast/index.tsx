import React, { useEffect, useState } from "react";
import { Avatar, Box, Flex, IconButton, Popover, Slider, Text } from "@radix-ui/themes";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListBulletIcon,
  PlayIcon,
  PauseIcon,
  SpeakerLoudIcon,
  SpeakerOffIcon,
  ChevronUpIcon,
  HeartIcon,
} from "@radix-ui/react-icons";
import { useAudioPlayer } from "./useAudioPlayer";
import { PlayList } from "./PlayList";
import { MiniPlayer } from "./MiniPlayer";
import { formatTime } from "./utils";
import { useBearStore } from "@/stores";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/helpers/podcastDB";

export interface AudioTrack {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  author?: string;
}

interface LPodcastProps {
  visible?: boolean;
}

export const LPodcast: React.FC<LPodcastProps> = ({ visible = true }) => {
  const [isMini, setIsMini] = useState(true);
  const bearStore = useBearStore();
  const {
    currentTrack,
    setCurrentTrack,
    setTracks,
    podcastPlayingStatus,
  } = bearStore;

  // 从数据库获取播客列表
  const podcasts = useLiveQuery(() => db.podcasts.toArray());

  // 转换播客数据为音频轨道
  const tracks = React.useMemo(
    () =>
      podcasts ? (
        podcasts.map((podcast) => ({
          id: podcast.uuid,
          title: podcast.title,
          url: podcast.mediaURL,
          thumbnail: podcast.thumbnail,
          author: podcast.feed_title,
        }))
      ) : [],
    [podcasts]
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
    isPlaying,
    progress,
    volume,
    duration,
    togglePlay,
    setVolume,
    seek,
    playTrack,
    setProgress,
    playPrevious,
    playNext,
  } = useAudioPlayer();

  // 如果没有音频或不可见，不渲染组件
  if (!visible || (!tracks?.length && !currentTrack)) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-6 right-6 z-50"
      >
        {isMini ? (
          <MiniPlayer
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            togglePlay={togglePlay}
            onExpand={() => setIsMini(false)}
          />
        ) : (
          <Box
            className="fixed bottom-0 left-0 right-0 bg-[var(--gray-1)] shadow-lg border-t border-[var(--gray-6)]"
          >
            <Box p="3" className="max-w-[1200px] mx-auto">
              <Flex gap="4" align="center">
                {/* Section A: Cover and Info */}
                <Flex gap="2" align="center" className="w-1/3 min-w-[300px]">
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
                <Flex gap="1" align="center" className="w-1/3 min-w-[520px] ">
                  {/* Playback controls */}
                  <Flex gap="4" align="center" justify="center" className="w-full max-w-[200px] mx-auto">
                    <IconButton
                      size="2"
                      variant="ghost"
                      onClick={playPrevious}
                      className="rounded-full text-gray-400 hover:text-gray-900 transition-colors"
                    >
                      <ChevronLeftIcon width={20} height={20} />
                    </IconButton>
                    <IconButton
                      size="3"
                      variant="solid"
                      onClick={togglePlay}
                      className="rounded-full hover:scale-105 transition-transform"
                      style={{
                        width: '45px',
                        height: '45px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isPlaying ? (
                        <PauseIcon style={{ width: '24px', height: '24px' }} />
                      ) : (
                        <PlayIcon style={{ width: '24px', height: '24px' }} />
                      )}
                    </IconButton>
                    <IconButton
                      size="2"
                      variant="ghost"
                      onClick={playNext}
                      className="rounded-full text-gray-400 hover:text-gray-900 transition-colors"
                    >
                      <ChevronRightIcon width={20} height={20} />
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
                    <Popover.Content className="p-2">
                      <PlayList
                        onTrackSelect={(track) => {
                          if (track.id !== currentTrack?.id) {
                            bearStore.setCurrentTrack(track);
                            bearStore.updatePodcastPlayingStatus(false);
                          }
                        }}
                        onPlay={playTrack}
                        onClose={() => {}}
                        currentTrack={currentTrack}
                        isPlaying={isPlaying}
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
          </Box>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
