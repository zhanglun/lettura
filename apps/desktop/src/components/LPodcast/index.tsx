import React, { useEffect, useMemo, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { useAudioPlayer, stopSharedAudio } from "./useAudioPlayer";
import { MiniPlayer, RATES } from "./MiniPlayer";
import { FullPlayer } from "./FullPlayer";
import { MiniPill } from "./MiniPill";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/helpers/podcastDB";

export interface AudioTrack {
  uuid: string;
  title: string;
  url: string;
  thumbnail?: string;
  author?: string;
  duration?: number;
  feed_title: string;
  feed_logo: string;
  feed_uuid?: string;
}

interface LPodcastProps {
  visible?: boolean;
}

/**
 * 播放器三态（podcast.html 契约）：bar 底部玻璃条 / full 沉浸页 / min 收起圆钮。
 * useAudioPlayer 挂在本体顶层，三态切换不卸载组件——音频永不中断。
 */
export const LPodcast: React.FC<LPodcastProps> = ({ visible = true }) => {
  const {
    currentTrack,
    setCurrentTrack,
    setTracks,
    tracks: storeTracks,
    playerMode,
    setPlayerMode,
  } = useBearStore(
    useShallow((state) => ({
      currentTrack: state.currentTrack,
      setCurrentTrack: state.setCurrentTrack,
      setTracks: state.setTracks,
      tracks: state.tracks,
      playerMode: state.playerMode,
      setPlayerMode: state.setPlayerMode,
    })),
  );

  // 获取所有播客数据
  const podcasts = useLiveQuery(() =>
    db.podcasts.orderBy("add_date").reverse().toArray(),
  );

  // 转换播客数据为音频轨道
  const tracks = useMemo(
    () =>
      podcasts
        ? podcasts.map((podcast) => ({
            uuid: podcast.uuid,
            title: podcast.title,
            url: podcast.mediaURL,
            thumbnail: podcast.thumbnail,
            author: podcast.author,
            duration: podcast.duration,
            feed_title: podcast.feed_title,
            feed_logo: podcast.feed_logo,
            feed_uuid: podcast.feed_uuid,
          }))
        : [],
    [podcasts],
  );

  // 库→store 投影镜像：库是队列的唯一真相（currentTrack 必须是队列成员），
  // 且只在投影真变了时写入——数组身份抖动不该引起 store 写入 → 重渲染 → 再写入
  const projectedRef = useRef("");
  useEffect(() => {
    const key = JSON.stringify(tracks);
    if (key === projectedRef.current) return;
    projectedRef.current = key;

    const { currentTrack: now, setCurrentTrack: setNow, updatePodcastPlayingStatus } =
      useBearStore.getState();
    setTracks(tracks);
    if (!tracks.some((t) => t.uuid === now?.uuid)) {
      setNow(tracks[0] ?? null);
      if (tracks.length === 0) {
        updatePodcastPlayingStatus(false);
      }
    }
  }, [tracks]);

  const {
    isPlaying,
    progress,
    duration,
    playbackRate,
    togglePlay,
    seek,
    skip,
    setPlaybackRate,
  } = useAudioPlayer();

  // 无曲目/不可见时停掉共享音频——单例元素没有消费者执行 pause，会残响
  const hasTracks = !!(tracks?.length || currentTrack);
  useEffect(() => {
    if (!(visible && hasTracks)) {
      stopSharedAudio();
      if (useBearStore.getState().podcastPlayingStatus) {
        useBearStore.getState().updatePodcastPlayingStatus(false);
      }
    }
  }, [visible, hasTracks]);

  const cycleRate = () => {
    const idx = RATES.indexOf(playbackRate);
    setPlaybackRate(RATES[(idx + 1) % RATES.length] ?? 1);
  };

  if (!(visible && (tracks?.length || currentTrack))) {
    return null;
  }

  // 三态互斥；AnimatePresence 保退出帧——放大/收起/缩钮都是 150–200ms 缓出，音频不受影响
  return (
    <AnimatePresence initial={false}>
      {playerMode === "min" ? (
        // min：右下角圆钮（环形进度 + 播放芯）
        <MiniPill
          key="min"
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          progress={progress}
          duration={duration}
          togglePlay={togglePlay}
          onExpand={() => setPlayerMode("bar")}
        />
      ) : playerMode === "full" ? (
        // full：沉浸页浮层（自带全部控制，bar 隐藏）
        <FullPlayer
          key="full"
          currentTrack={currentTrack}
          tracks={storeTracks}
          isPlaying={isPlaying}
          progress={progress}
          duration={duration}
          playbackRate={playbackRate}
          togglePlay={togglePlay}
          seek={seek}
          skip={skip}
          cycleRate={cycleRate}
          onCollapse={() => setPlayerMode("bar")}
        />
      ) : (
        // bar：底部玻璃条
        <MiniPlayer
          key="bar"
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          progress={progress}
          duration={duration}
          playbackRate={playbackRate}
          togglePlay={togglePlay}
          seek={seek}
          skip={skip}
          cycleRate={cycleRate}
          onExpand={() => setPlayerMode("full")}
          onCollapse={() => setPlayerMode("min")}
        />
      )}
    </AnimatePresence>
  );
};
