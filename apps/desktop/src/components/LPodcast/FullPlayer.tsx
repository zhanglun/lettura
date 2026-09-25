import React from "react";
import { motion } from "framer-motion";
import { AudioTrack } from "./index";
import { formatTime, PLAYER_MOTION } from "./utils";
import { SleepControl } from "./SleepControl";
import { QueueRow } from "./QueueRow";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";

interface FullPlayerProps {
  currentTrack: AudioTrack | null;
  tracks: AudioTrack[];
  isPlaying: boolean;
  progress: number;
  duration: number;
  playbackRate: number;
  togglePlay: () => void;
  seek: (time: number) => void;
  skip: (delta: number) => void;
  cycleRate: () => void;
  onCollapse: () => void;
}

/** 沉浸页：盖满面板的玻璃浮层——大封面 + 大时间轴 + 传输 + UP NEXT（podcast.html 契约） */
export const FullPlayer: React.FC<FullPlayerProps> = ({
  currentTrack,
  tracks,
  isPlaying,
  progress,
  duration,
  playbackRate,
  togglePlay,
  seek,
  skip,
  cycleRate,
  onCollapse,
}) => {
  const { t } = useTranslation();
  const { playTrack, removeTrack, playNext, playPrev } = useBearStore(
    useShallow((state) => ({
      playTrack: state.playTrack,
      removeTrack: state.removeTrack,
      playNext: state.playNext,
      playPrev: state.playPrev,
    })),
  );

  const pct = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - rect.left) / rect.width) * duration);
  };

  const cover = currentTrack?.thumbnail || currentTrack?.feed_logo;
  const upNext = tracks.filter((tr) => tr.uuid !== currentTrack?.uuid);

  return (
    <motion.section className="fusion-fullplayer" {...PLAYER_MOTION.full}>
      <div className="f-top">
        <button type="button" className="fusion-back" onClick={onCollapse}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M10 3 5 8l5 5" />
          </svg>
          {t("podcast.collapse")}
          <kbd className="fusion-kbd">esc</kbd>
        </button>
        <span className="f-src">
          {currentTrack?.feed_title || currentTrack?.author || ""}
          {currentTrack?.feed_title ? " · " : ""}
          {currentTrack?.title || ""}
        </span>
        <span className="fusion-spring" />
        <button
          type="button"
          className="fusion-qa"
          onClick={onCollapse}
          title={t("podcast.collapse")}
          aria-label={t("podcast.collapse")}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" stroke-linecap="round">
            <path d="M3 10l5 5 5-5M3 6l5-5 5 5" />
          </svg>
        </button>
      </div>

      <div className="f-body">
        <div className="f-inner">
          <span className="fusion-bigcover">
            {cover ? (
              <img src={cover} alt="" />
            ) : (
              <svg width="56" height="56" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                <path d="M4 7.5v5M7.3 5v10M10.6 8v4M14 6v8M17.3 7.5v5" />
              </svg>
            )}
          </span>
          <div className="f-kind">{t("podcast.now_playing")}</div>
          <h1>{currentTrack?.title || t("podcast.no_track")}</h1>
          <div className="f-meta">
            <span>{currentTrack?.feed_title || currentTrack?.author || ""}</span>
            {duration > 0 && (
              <>
                <span>·</span>
                <span>{formatTime(duration)}</span>
                <span>·</span>
                <span>{t("podcast.played_pct", { pct: Math.round(pct) })}</span>
              </>
            )}
          </div>

          <div className="f-track">
            <span className="pt">{formatTime(progress)}</span>
            <div className="fusion-fbar" onClick={handleBarClick}>
              <b style={{ width: `${pct}%` }} />
              <i style={{ left: `${pct}%` }} />
            </div>
            <span className="pt">{formatTime(duration)}</span>
          </div>

          <div className="f-ctrl">
            <button type="button" className="fusion-skipbtn" onClick={() => skip(-30)}>
              −30s
            </button>
            <button
              type="button"
              className="fusion-pnav"
              onClick={playPrev}
              title={t("podcast.ctl.prev")}
              aria-label={t("podcast.ctl.prev")}
              disabled={tracks.length < 2}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M12.5 3.5v9l-7-4.5zM3.2 3.5H5v9H3.2z" />
              </svg>
            </button>
            <button
              type="button"
              className="fusion-bigplay"
              onClick={togglePlay}
              aria-label={isPlaying ? t("Pause") : t("Play")}
            >
              {isPlaying ? (
                <svg width="15" height="15" viewBox="0 0 12 12" fill="#fff">
                  <rect x="1.5" y="1" width="3" height="10" rx="1" />
                  <rect x="7.5" y="1" width="3" height="10" rx="1" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 12 12" fill="#fff">
                  <path d="M2.5 1.2v9.6l8-4.8z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              className="fusion-pnav"
              onClick={playNext}
              title={t("podcast.ctl.next")}
              aria-label={t("podcast.ctl.next")}
              disabled={tracks.length < 2}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.5 3.5v9l7-4.5zM11 3.5h1.8v9H11z" />
              </svg>
            </button>
            <button type="button" className="fusion-skipbtn" onClick={() => skip(30)}>
              +30s
            </button>
            <button type="button" className="fusion-chip" onClick={cycleRate}>
              {playbackRate}×
            </button>
            <SleepControl />
          </div>

          {upNext.length > 0 && (
            <div className="fusion-queue">
              <div className="q-h">{t("podcast.up_next")}</div>
              {upNext.map((track) => (
                <QueueRow
                  key={track.uuid}
                  track={track}
                  onSelect={() => playTrack(track)}
                  onRemove={() => removeTrack(track)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="f-foot">
        <span>
          <b>space</b> {t("podcast.ctl.toggle")}
        </span>
        <span>·</span>
        <span>esc {t("podcast.collapse")}</span>
      </div>
    </motion.section>
  );
};
