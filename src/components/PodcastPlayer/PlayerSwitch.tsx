import { Disc3 } from "lucide-react";
import { Icon } from "../Icon";
import { TooltipBox } from "../TooltipBox";
import { useBearStore } from "@/stores";
import clsx from "clsx";

export const PlayerSwitcher = () => {
  const store = useBearStore((state) => ({
    podcastPanelStatus: state.podcastPanelStatus,
    updatePodcastPanelStatus: state.updatePodcastPanelStatus,
    podcastPlayingStatus: state.podcastPlayingStatus,
    updatePodcastPlayingStatus: state.updatePodcastPlayingStatus,
  }));

  function togglePlayerPanel() {
    store.updatePodcastPanelStatus(!store.podcastPanelStatus);
  }

  return (
    <TooltipBox content="Play podcast">
      <Icon onClick={togglePlayerPanel}>
        <Disc3
          size={16}
          className={clsx({
            "animate-spin-slow": store.podcastPlayingStatus,
          })}
        />
      </Icon>
    </TooltipBox>
  );
};
