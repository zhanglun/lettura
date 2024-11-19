import React from "react";
import { IconButton, Popover } from "@radix-ui/themes";
import { ListBulletIcon } from "@radix-ui/react-icons";
import { AudioTrack } from "./index";
import { PlayList } from "./PlayList";
import { useBearStore } from "@/stores";

interface PlayListPopoverProps {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  onPlay?: (track: AudioTrack) => void;
}

export const PlayListPopover: React.FC<PlayListPopoverProps> = ({ currentTrack, isPlaying, onPlay }) => {
  const bearStore = useBearStore();

  const handleTrackSelect = (track: AudioTrack) => {
    if (track.id !== currentTrack?.id) {
      bearStore.setCurrentTrack(track);
      bearStore.updatePodcastPlayingStatus(false);
    }
  };

  return (
    <Popover.Root>
      <Popover.Trigger>
        <IconButton size="2" variant="ghost">
          <ListBulletIcon />
        </IconButton>
      </Popover.Trigger>
      <Popover.Content className="p-0 slide-popover" align="end" alignOffset={-30} sideOffset={20}>
        <PlayList
          onTrackSelect={handleTrackSelect}
          onPlay={onPlay}
          onClose={() => {}}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
        />
      </Popover.Content>
    </Popover.Root>
  );
};
