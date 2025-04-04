import React from "react";
import { IconButton, Popover } from "@radix-ui/themes";
import { ListBulletIcon } from "@radix-ui/react-icons";
import { AudioTrack } from "./index";
import { PlayList } from "./PlayList";
import { useBearStore } from "@/stores";

interface PlayListPopoverProps {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
}

export const PlayListPopover: React.FC<PlayListPopoverProps> = ({ currentTrack, isPlaying }) => {
  const bearStore = useBearStore();

  const handleTrackSelect = (track: AudioTrack) => {
    if (track.uuid !== currentTrack?.uuid) {
      // 只更新 store 中的状态，让 useAudioPlayer 的 effect 来处理播放
      bearStore.setCurrentTrack(track);
      bearStore.updatePodcastPlayingStatus(true);
    } else {
      bearStore.updatePodcastPlayingStatus(!isPlaying);
    }
  };

  return (
    <Popover.Root>
      <Popover.Trigger>
        <IconButton size="2" variant="ghost">
          <ListBulletIcon />
        </IconButton>
      </Popover.Trigger>
      <Popover.Content className="p-0 slide-popover shadow-sm border" align="end" alignOffset={-30} sideOffset={20}>
        <PlayList
          onTrackSelect={handleTrackSelect}
          onClose={() => {}}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
        />
      </Popover.Content>
    </Popover.Root>
  );
};
