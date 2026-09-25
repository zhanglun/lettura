import React from "react";
import type { AudioTrack } from "./index";
import { formatTime } from "./utils";
import { useTranslation } from "react-i18next";

interface QueueRowProps {
  track: AudioTrack;
  active?: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

/**
 * 队列行（沉浸页 UP NEXT 与播放列表共用）：缩略图 · 题 · 源（当前行 = accent-soft 洗色 +
 * 「播放中」）· 时长 · 悬停删除。行本身可键盘选中（⏎/space）。
 */
export const QueueRow: React.FC<QueueRowProps> = ({
  track,
  active = false,
  onSelect,
  onRemove,
}) => {
  const { t } = useTranslation();

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
            <span className="live">{t("podcast.playing")}</span>
          </>
        )}
      </span>
      <span className="q-d">
        {track.duration ? formatTime(track.duration) : ""}
      </span>
      <button
        type="button"
        className="q-x"
        title={t("Delete")}
        aria-label={t("Delete")}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        >
          <path d="M3 3l10 10M13 3 3 13" />
        </svg>
      </button>
    </div>
  );
};
