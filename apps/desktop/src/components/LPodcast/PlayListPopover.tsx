import React from "react";
import { Popover } from "@radix-ui/themes";
import { PlayList } from "./PlayList";
import { useTranslation } from "react-i18next";

/** 底条上的播放列表入口：列表钮拉出队列面板（Radix 管外点关闭 / esc / 焦点归还） */
export const PlayListPopover: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Popover.Root>
      <Popover.Trigger>
        <button
          type="button"
          className="fusion-pctl"
          title={t("podcast.playlist")}
          aria-label={t("podcast.playlist")}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <path d="M3 4h10M3 8h7M3 12h10" />
          </svg>
        </button>
      </Popover.Trigger>
      <Popover.Content
        className="fusion-playlist-pop"
        side="top"
        align="end"
        sideOffset={12}
      >
        <PlayList />
      </Popover.Content>
    </Popover.Root>
  );
};
