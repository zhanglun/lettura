import { ListMusic } from "lucide-react";
import { IconButton } from "@astryxdesign/core/IconButton";
import React from "react";
import { Popover } from "@astryxdesign/core/Popover";
import { PlayList } from "./PlayList";
import { useTranslation } from "react-i18next";

/** 底条上的播放列表入口：列表钮拉出队列面板（浮层管外点关闭 / esc / 焦点归还） */
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
      <IconButton
        size="sm"
        variant="ghost"
        icon={<ListMusic size={13} />}
        label={t("podcast.playlist")}
      />
    </Popover>
  );
};
