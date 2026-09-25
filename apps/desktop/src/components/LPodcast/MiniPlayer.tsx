import React from "react";
import { ChevronDown, ChevronUp, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
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
          <IconButton
            size="sm"
            icon={isPlaying ? <Pause size={11} /> : <Play size={11} />}
            label={isPlaying ? t("Pause") : t("Play")}
            onClick={togglePlay}
          />
          <IconButton
            size="sm"
            variant="ghost"
            icon={<SkipBack size={13} />}
            label={t("podcast.ctl.back30")}
            onClick={() => skip(-30)}
          />
          <IconButton
            size="sm"
            variant="ghost"
            icon={<SkipForward size={13} />}
            label={t("podcast.ctl.fwd30")}
            onClick={() => skip(30)}
          />
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
          <Button variant="ghost" size="sm" label={`${playbackRate}×`} onClick={cycleRate} />
          <SleepControl />
          <PlayListPopover />
          <IconButton
            size="sm"
            variant="ghost"
            icon={<ChevronUp size={13} />}
            label={t("podcast.expand")}
            onClick={onExpand}
          />
          <IconButton
            size="sm"
            variant="ghost"
            icon={<ChevronDown size={13} />}
            label={t("podcast.collapse_bar")}
            onClick={onCollapse}
          />
        </div>
      </div>
    </motion.div>
  );
};

export { RATES };
