import React from "react";
import { motion } from "framer-motion";
import { AudioTrack } from "./index";
import { PLAYER_MOTION } from "./utils";
import { useTranslation } from "react-i18next";

interface MiniPillProps {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  togglePlay: () => void;
  onExpand: () => void;
}

const R = 18.5;
const CIRC = 2 * Math.PI * R;

/** 收起态：右下角 40px 玻璃圆钮——环形进度 + 播放芯，hover 显影单集（podcast.html 契约） */
export const MiniPill: React.FC<MiniPillProps> = ({
  currentTrack,
  isPlaying,
  progress,
  duration,
  togglePlay,
  onExpand,
}) => {
  const { t } = useTranslation();
  const pct = duration > 0 ? Math.min(1, progress / duration) : 0;

  return (
    <motion.div className="fusion-minipill" {...PLAYER_MOTION.min}>
      <span className="bubble">
        <span>
          {currentTrack?.feed_title || currentTrack?.author || ""}
          {currentTrack?.feed_title ? " · " : ""}
        </span>
        <b>{currentTrack?.title || t("podcast.no_track")}</b>
      </span>
      <button
        type="button"
        className="ring"
        onClick={onExpand}
        title={t("podcast.expand_bar")}
      >
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r={R} fill="none" stroke="rgba(29,30,32,.1)" strokeWidth="2" />
          <circle
            cx="20"
            cy="20"
            r={R}
            fill="none"
            stroke="var(--fusion-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - pct)}
          />
        </svg>
        <span
          className="core"
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.stopPropagation();
              togglePlay();
            }
          }}
          aria-label={isPlaying ? t("Pause") : t("Play")}
        >
          {isPlaying ? (
            <svg width="9" height="9" viewBox="0 0 12 12" fill="#fff">
              <rect x="1.5" y="1" width="3" height="10" rx="1" />
              <rect x="7.5" y="1" width="3" height="10" rx="1" />
            </svg>
          ) : (
            <svg width="9" height="9" viewBox="0 0 12 12" fill="#fff">
              <path d="M2.5 1.2v9.6l8-4.8z" />
            </svg>
          )}
        </span>
      </button>
    </motion.div>
  );
};
