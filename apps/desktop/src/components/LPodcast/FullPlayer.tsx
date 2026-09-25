import React from "react";
import { Kbd } from "@astryxdesign/core/Kbd";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { ChevronLeft, ChevronsUpDown, Pause, Play, SkipBack, SkipForward } from "lucide-react";
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
        <Button
          variant="ghost"
          size="sm"
          icon={<ChevronLeft size={12} />}
          label={t("podcast.collapse")}
          endContent={<Kbd keys="esc" />}
          onClick={onCollapse}
        />
        <span className="f-src">
          {currentTrack?.feed_title || currentTrack?.author || ""}
          {currentTrack?.feed_title ? " · " : ""}
          {currentTrack?.title || ""}
        </span>
        <span className="fusion-spring" />
        <IconButton
          size="sm"
          variant="ghost"
          icon={<ChevronsUpDown size={14} />}
          label={t("podcast.collapse")}
          onClick={onCollapse}
        />
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
            <Button variant="ghost" size="sm" label="−30s" onClick={() => skip(-30)} />
            <IconButton
              size="sm"
              variant="ghost"
              icon={<SkipBack size={14} />}
              label={t("podcast.ctl.prev")}
              isDisabled={tracks.length < 2}
              onClick={playPrev}
            />
            <IconButton
              icon={isPlaying ? <Pause size={15} /> : <Play size={15} />}
              label={isPlaying ? t("Pause") : t("Play")}
              onClick={togglePlay}
            />
            <IconButton
              size="sm"
              variant="ghost"
              icon={<SkipForward size={14} />}
              label={t("podcast.ctl.next")}
              isDisabled={tracks.length < 2}
              onClick={playNext}
            />
            <Button variant="ghost" size="sm" label="+30s" onClick={() => skip(30)} />
            <Button variant="ghost" size="sm" label={`${playbackRate}×`} onClick={cycleRate} />
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
