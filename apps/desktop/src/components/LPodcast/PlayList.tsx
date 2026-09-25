import React from "react";
import { QueueRow } from "./QueueRow";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";

/**
 * 播放列表：整条队列（含当前集）——与沉浸页 UP NEXT 同一行语法，
 * 从底条列表钮拉出（浮层语法同 ⌘K），点行即切、悬停删。
 */
export const PlayList: React.FC = () => {
  const { t } = useTranslation();
  const { tracks, currentTrack, playTrack, removeTrack } = useBearStore(
    useShallow((state) => ({
      tracks: state.tracks,
      currentTrack: state.currentTrack,
      playTrack: state.playTrack,
      removeTrack: state.removeTrack,
    })),
  );

  return (
    <div className="fusion-playlist">
      <div className="pl-head">
        <span className="pl-title">{t("podcast.playlist")}</span>
        <span className="pl-count">
          {t("podcast.playlist_count", { count: tracks.length })}
        </span>
      </div>

      {tracks.length === 0 ? (
        <div className="pl-empty">
          <span className="t">{t("podcast.empty")}</span>
          <span className="s">{t("podcast.empty_hint")}</span>
        </div>
      ) : (
        <div className="pl-body fusion-queue">
          {tracks.map((track) => (
            <QueueRow
              key={track.uuid}
              track={track}
              active={track.uuid === currentTrack?.uuid}
              onSelect={() => playTrack(track)}
              onRemove={() => removeTrack(track)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
