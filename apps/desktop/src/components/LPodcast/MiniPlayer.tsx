import React from "react";
import { motion } from "framer-motion";
import { AudioTrack } from "./index";
import { formatTime, PLAYER_MOTION } from "./utils";
import { SleepControl } from "./SleepControl";
import { PlayListPopover } from "./PlayListPopover";
import { useTranslation } from "react-i18next";

const RATES = [1, 1.25, 1.5, 2];

interface MiniPlayerProps {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  playbackRate: number;
  togglePlay: () => void;
  seek: (time: number) => void;
  skip: (delta: number) => void;
  cycleRate: () => void;
  onExpand: () => void;
  onCollapse: () => void;
}

/**
 * fusion 播放条（podcast.html 契约）：左传输簇（播放 + ±30s）· 单集信息（点击放大）
 * · 时间轴 · 右簇（倍速 chip + 睡眠定时 + 播放列表 + 放大 + 收起）。
 */
export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  progress,
  duration,
  playbackRate,
  togglePlay,
  seek,
  skip,
  cycleRate,
  onExpand,
  onCollapse,
}) => {
  const { t } = useTranslation();
  const pct = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - rect.left) / rect.width) * duration);
  };

  return (
    <motion.div className="fusion-player-slot" {...PLAYER_MOTION.bar}>
      <div className="fusion-player">
        {/* 传输簇：播放 + ±30s */}
        <div className="fusion-pcluster">
          <button
            type="button"
            className="fusion-pc"
            onClick={togglePlay}
            aria-label={isPlaying ? t("Pause") : t("Play")}
          >
            {isPlaying ? (
              <svg width="11" height="11" viewBox="0 0 12 12" fill="#fff">
                <rect x="1.5" y="1" width="3" height="10" rx="1" />
                <rect x="7.5" y="1" width="3" height="10" rx="1" />
              </svg>
            ) : (
              <svg width="11" height="11" viewBox="0 0 12 12" fill="#fff">
                <path d="M2.5 1.2v9.6l8-4.8z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="fusion-pskip"
            title={t("podcast.ctl.back30")}
            onClick={() => skip(-30)}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="var(--fusion-sub)">
              <path d="M13.5 3.5v9l-7-4.5zM3.2 3.5H5v9H3.2z" />
            </svg>
          </button>
          <button
            type="button"
            className="fusion-pskip"
            title={t("podcast.ctl.fwd30")}
            onClick={() => skip(30)}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="var(--fusion-sub)">
              <path d="M2.5 3.5v9l7-4.5zM11 3.5h1.8v9H11z" />
            </svg>
          </button>
        </div>

        {/* 单集信息：点击放大到沉浸页 */}
        <button
          type="button"
          className="fusion-pmeta"
          onClick={onExpand}
          title={t("podcast.expand")}
        >
          <div className="ep">
            {currentTrack?.feed_title || currentTrack?.author || ""}
          </div>
          <div className="nm">{currentTrack?.title || t("podcast.no_track")}</div>
        </button>

        <div className="fusion-ptrack">
          <span className="pt">{formatTime(progress)}</span>
          <div className="fusion-pbar" onClick={handleBarClick}>
            <b style={{ width: `${pct}%` }} />
            <i style={{ left: `${pct}%` }} />
          </div>
          <span className="pt">{formatTime(duration)}</span>
        </div>

        {/* 右簇：倍速 + 睡眠定时 + 播放列表 + 放大 + 收起 */}
        <div className="fusion-pcluster">
          <button type="button" className="fusion-chip" onClick={cycleRate}>
            {playbackRate}×
          </button>
          <SleepControl />
          <PlayListPopover />
          <button
            type="button"
            className="fusion-pctl"
            onClick={onExpand}
            title={t("podcast.expand")}
            aria-label={t("podcast.expand")}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M3 9.5 8 5l5 4.5" />
            </svg>
          </button>
          <button
            type="button"
            className="fusion-pctl"
            onClick={onCollapse}
            title={t("podcast.collapse_bar")}
            aria-label={t("podcast.collapse_bar")}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M3 6.5 8 11l5-4.5" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export { RATES };
