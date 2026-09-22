import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAudioPlayer } from "./useAudioPlayer";
import { MiniPlayer, RATES } from "./MiniPlayer";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/helpers/podcastDB";
import { RouteConfig } from "@/config";

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

/** 全局浮动玻璃播放卡（有音频才出现）；单集信息/展开箭头 → 单集详情 */
export const LPodcast: React.FC<LPodcastProps> = ({ visible = true }) => {
  const navigate = useNavigate();
  const { currentTrack, setCurrentTrack, setTracks } = useBearStore(
    useShallow((state) => ({
      currentTrack: state.currentTrack,
      setCurrentTrack: state.setCurrentTrack,
      setTracks: state.setTracks,
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

  const cycleRate = () => {
    const idx = RATES.indexOf(playbackRate);
    setPlaybackRate(RATES[(idx + 1) % RATES.length] ?? 1);
  };

  // 打开单集详情（uuid 即文章 uuid，深链走 detail 端点）
  const openDetail = () => {
    if (!currentTrack) return;
    const base = currentTrack.feed_uuid
      ? RouteConfig.LOCAL_FEED.replace(/:uuid/, currentTrack.feed_uuid)
      : RouteConfig.LOCAL_ALL;
    navigate(`${base}/articles/${currentTrack.uuid}`);
  };

  if (!(visible && (tracks?.length || currentTrack))) {
    return null;
  }

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
        onOpenDetail={openDetail}
      />
    </div>
  );
};
