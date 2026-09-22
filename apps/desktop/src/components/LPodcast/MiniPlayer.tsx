import React from "react";
import { IconButton } from "@radix-ui/themes";
import { PlayIcon, PauseIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { AudioTrack } from "./index";
import { formatTime } from "./utils";
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
  onOpenDetail: () => void;
}

/** fusion 播放卡：播放/暂停 · ±30s · 单集信息(点击展开详情) · 进度条带旋钮 · 倍速 chip · 展开箭头 */
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
  onOpenDetail,
}) => {
  const { t } = useTranslation();
  const pct = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - rect.left) / rect.width) * duration);
  };

  return (
    <div className="fusion-player flex items-center gap-3.5 px-4.5 h-[68px]">
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

      <button
        type="button"
        className="fusion-pmeta"
        onClick={onOpenDetail}
        title={t("podcast.ctl.open_detail")}
      >
        <div className="ep">{currentTrack?.feed_title || currentTrack?.author || ""}</div>
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

      <button type="button" className="fusion-chip" onClick={cycleRate}>
        {playbackRate}×
      </button>

      <PlayListPopover currentTrack={currentTrack} isPlaying={isPlaying} />
      <IconButton size="1" variant="ghost" color="gray" onClick={onOpenDetail}>
        <ChevronUpIcon />
      </IconButton>
    </div>
  );
};

export { RATES };
