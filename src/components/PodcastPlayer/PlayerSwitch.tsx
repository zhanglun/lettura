import { Disc3 } from "lucide-react";
import { useBearStore } from "@/stores";
import clsx from "clsx";
import { IconButton, Tooltip } from "@radix-ui/themes";

export const PlayerSwitcher = () => {
  const store = useBearStore((state) => ({
    podcastPanelStatus: state.podcastPanelStatus,
    updatePodcastPanelStatus: state.updatePodcastPanelStatus,
    podcastPlayingStatus: state.podcastPlayingStatus,
  }));

  function togglePlayerPanel() {
    store.updatePodcastPanelStatus(!store.podcastPanelStatus);
  }

  return (
    <Tooltip content="Play podcast">
      <IconButton size="2" variant="ghost" color="gray" className="text-[var(--gray-12)]" onClick={togglePlayerPanel}>
        <Disc3
          size={16}
          className={clsx({
            "animate-spin-slow": store.podcastPlayingStatus,
          })}
        />
      </IconButton>
    </Tooltip>
  );
};
