import { IconButton } from "@astryxdesign/core/IconButton";
import { X } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { formatDuration } from "@/helpers/articleContent";
import { useAppStore } from "@/stores";
import type { AudioTrack } from "./index";

interface QueueRowProps {
  track: AudioTrack;
  active?: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

/**
 * 队列行（沉浸页 UP NEXT 与播放列表共用）：缩略图 · 题 · 源（当前行 = accent-soft 洗色，
 * 行尾状态徽标：缓冲 = spinner「加载中」/ 播放 = EQ「播放中」/ 暂停 =「已暂停」）·
 * 时长 · 悬停删除。行本身可键盘选中（⏎/space）。
 */
export const QueueRow: React.FC<QueueRowProps> = ({
  track,
  active = false,
  onSelect,
  onRemove,
}) => {
  const { t } = useTranslation();
  const { isLoading, isPlaying } = useAppStore(
    useShallow((state) => ({
      isLoading: state.podcastLoading,
      isPlaying: state.podcastPlayingStatus,
    })),
  );

  return (
    <div
      className={active ? "q-row now" : "q-row"}
      role="button"
      tabIndex={0}
      aria-current={active ? "true" : undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <span className="q-thumb">
        {track.thumbnail || track.feed_logo ? (
          <img src={track.thumbnail || track.feed_logo} alt="" />
        ) : (
          <svg
            width="12"
            height="12"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <path d="M4 7.5v5M7.3 5v10M10.6 8v4M14 6v8M17.3 7.5v5" />
          </svg>
        )}
      </span>
      <span className="q-t">{track.title}</span>
      <span className="q-s">
        {track.feed_title || track.author || ""}
        {active && (
          <>
            {" · "}
            {isLoading ? (
              <span className="live">
                <i className="fusion-spin" />
                {t("podcast.loading")}
              </span>
            ) : isPlaying ? (
              <span className="live">
                <span className="q-eq" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                {t("podcast.playing")}
              </span>
            ) : (
              <span className="live paused">{t("podcast.paused")}</span>
            )}
          </>
        )}
      </span>
      <span className="q-d">
        {track.duration ? formatDuration(track.duration) : ""}
      </span>
      <IconButton
        size="sm"
        variant="ghost"
        icon={<X size={11} />}
        label={t("Delete")}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      />
    </div>
  );
};
