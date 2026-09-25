import React from "react";
import { Popover } from "@astryxdesign/core/Popover";
import { PlayList } from "./PlayList";
import { useTranslation } from "react-i18next";

/** 底条上的播放列表入口：列表钮拉出队列面板（Radix 管外点关闭 / esc / 焦点归还） */
export const PlayListPopover: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Popover
      placement="above"
      alignment="end"
      width="auto"
      label={t("podcast.playlist")}
      content={<PlayList />}
    >
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
    </Popover>
  );
};
