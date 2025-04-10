import { useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { ArticleCol, ArticleColRefObject } from "@/layout/Article/ArticleCol";
import { ArticleDialogView } from "@/components/ArticleView/DialogView";
import { open } from "@tauri-apps/api/shell";
import { View } from "./View";
import { useQuery } from "@/helpers/parseXML";
import { LPodcast } from "@/components/LPodcast";
import { useBearStore } from "@/stores";
import { MainPanel } from "@/components/MainPanel";

export const ArticleContainer = () => {
  const [, type, feedUuid] = useQuery();
  const store = useBearStore((state) => ({
    article: state.article,
    setArticle: state.setArticle,
    articleDialogViewStatus: state.articleDialogViewStatus,
    setArticleDialogViewStatus: state.setArticleDialogViewStatus,
    podcastPanelStatus: state.podcastPanelStatus,
    tracks: state.tracks,
    podcastPlayingStatus: state.podcastPlayingStatus,
  }));

  const articleColRef = useRef<ArticleColRefObject>(null);
  const { goNext, goPrev } = (articleColRef.current || {}) as ArticleColRefObject;

  const openInBrowser = () => {
    store.article && open(store.article.link);
  };

  useHotkeys("o", () => openInBrowser());

  // 根据条件决定是否显示 LPodcast
  const shouldShowPodcast = store.tracks?.length > 0 || store.podcastPlayingStatus;

  return (
    <MainPanel>
      <>
        <ArticleCol feedUuid={feedUuid} type={type} ref={articleColRef} />
        <View goNext={goNext} goPrev={goPrev} />
        <LPodcast visible={shouldShowPodcast} />
        <ArticleDialogView
          article={store.article}
          dialogStatus={store.articleDialogViewStatus}
          setDialogStatus={store.setArticleDialogViewStatus}
          afterConfirm={() => {}}
          afterCancel={() => {
            store.setArticle(null);
            console.log("store.article", store.article);
          }}
        />
      </>
    </MainPanel>
  );
};
