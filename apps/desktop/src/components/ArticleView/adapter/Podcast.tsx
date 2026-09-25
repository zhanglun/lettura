import { ArticleResItem } from "@/db";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { useAudioPlayer } from "@/components/LPodcast/useAudioPlayer";
import { formatTime } from "@/components/LPodcast/utils";
import { renderArticleContent } from "../ContentRender";
import { Podcast } from "@/helpers/podcastDB";
import { useTranslation } from "react-i18next";
import { RATES } from "@/components/LPodcast/MiniPlayer";

export interface PodcastAdapter {
  article: ArticleResItem;
  content: string;
  medias: any;
}

/** 播客单集详情：112px 封面 + 大播放控件 + show notes（fusion 契约；章节 feed 不提供，跳过） */
export function PodcastAdapter(props: PodcastAdapter) {
  const { article, content, medias } = props;
  const { t } = useTranslation();
  const { addToPlayListAndPlay } = useBearStore(
    useShallow((state) => ({
      addToPlayListAndPlay: state.addToPlayListAndPlay,
    })),
  );

  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    playbackRate,
    togglePlay,
    skip,
    setPlaybackRate,
  } = useAudioPlayer();

  const isCurrent = currentTrack?.uuid === article.uuid;
  const playing = isCurrent && isPlaying;
  const pct = isCurrent && duration > 0 ? Math.round((progress / duration) * 100) : 0;

  function handlePlay() {
    if (isCurrent) {
      togglePlay();
      return;
    }
    const media = medias?.[0];
    if (!media) return;
    const { description, content: mediaContent, thumbnails } = media;
    if (!mediaContent || mediaContent.length === 0) return;

    const record = {
      uuid: article.uuid,
      title: article.title,
      link: article.link,
      feed_url: article.feed_url,
      feed_uuid: article.feed_uuid,
      author: article.author,
      feed_title: article.feed_title,
      feed_logo: article.feed_logo,
      pub_date: article.pub_date,
      create_date: article.create_date,
      starred: article.starred,
      mediaURL: mediaContent[0].url,
      mediaType: mediaContent[0].content_type,
      thumbnail: thumbnails[0]?.image?.uri || article.feed_logo,
      description: description?.content || article.description,
      add_date: new Date().getTime(),
    } as Podcast;

    addToPlayListAndPlay(record);
  }

  function cycleRate() {
    const idx = RATES.indexOf(playbackRate);
    setPlaybackRate(RATES[(idx + 1) % RATES.length] ?? 1);
  }

  const thumbnail = medias?.[0]?.thumbnails?.[0]?.image?.uri || article.feed_logo;

  return (
    <div className="mx-auto w-full max-w-[640px] py-2">
      {/* ep-head */}
      <div className="flex gap-5 mb-6">
        <div className="fusion-cover">
          {thumbnail ? (
            <img src={thumbnail} alt="" className="w-full h-full object-cover rounded-[18px]" />
          ) : (
            <svg width="40" height="40" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 7.5v5M7.3 5v10M10.6 8v4M14 6v8M17.3 7.5v5" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="fusion-dkind">{t("podcast.kind")}</div>
          <h1 className="text-[21px] font-bold leading-snug text-[var(--fusion-ink)]">
            {article.title}
          </h1>
          <div className="fusion-dmeta">
            <span>{article.feed_title}</span>
            <span>·</span>
            <span>{isCurrent && duration > 0 ? formatTime(duration) : t("podcast.episode")}</span>
            {isCurrent && duration > 0 && (
              <>
                <span>·</span>
                <span>{t("podcast.played_pct", { pct })}</span>
              </>
            )}
          </div>
          <div className="fusion-epctrl">
            <button type="button" className="fusion-bigplay" onClick={handlePlay}>
              {playing ? (
                <svg width="13" height="13" viewBox="0 0 12 12" fill="#fff">
                  <rect x="1.5" y="1" width="3" height="10" rx="1" />
                  <rect x="7.5" y="1" width="3" height="10" rx="1" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 12 12" fill="#fff">
                  <path d="M2.5 1.2v9.6l8-4.8z" />
                </svg>
              )}
            </button>
            <button type="button" className="fusion-skipbtn" onClick={() => skip(-30)}>
              −30s
            </button>
            <button type="button" className="fusion-skipbtn" onClick={() => skip(30)}>
              +30s
            </button>
            <button type="button" className="fusion-chip" onClick={cycleRate}>
              {playbackRate}×
            </button>
          </div>
        </div>
      </div>

      {/* show notes */}
      <div className="text-[13.5px] leading-[1.85] text-[#4A4D52]">
        {renderArticleContent(content)}
      </div>
    </div>
  );
}
