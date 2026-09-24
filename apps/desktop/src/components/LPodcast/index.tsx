import React, { useEffect, useMemo } from "react";
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
            feed_title: podcast.feed_title,
            feed_logo: podcast.feed_logo,
            feed_uuid: podcast.feed_uuid,
          }))
        : [],
    [podcasts],
  );

  // 当 tracks 变化时更新 store
  useEffect(() => {
    if (tracks) {
      setTracks(tracks);
      if (!currentTrack && tracks.length > 0) {
        setCurrentTrack(tracks[0]);
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

  // min：右下角圆钮（环形进度 + 播放芯）
  if (playerMode === "min") {
    return (
      <MiniPill
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        progress={progress}
        duration={duration}
        togglePlay={togglePlay}
        onExpand={() => setPlayerMode("bar")}
      />
    );
  }

  // full：沉浸页浮层（自带全部控制，bar 隐藏）
  if (playerMode === "full") {
    return (
      <FullPlayer
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
    );
  }

  // bar：底部玻璃条
  return (
    <div className="fusion-player-slot">
      <MiniPlayer
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
    </div>
  );
};
