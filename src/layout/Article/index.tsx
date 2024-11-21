import { useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { ArticleCol, ArticleColRefObject } from "@/layout/Article/ArticleCol";
import { ArticleDialogView } from "@/components/ArticleView/DialogView";
import { open } from "@tauri-apps/api/shell";
import { View } from "./View";
import { useQuery } from "@/helpers/parseXML";
import { LPodcast } from "@/components/LPodcast";
import { useBearStore } from "@/stores";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="relative flex flex-col w-full h-[100vh]">
      <div className="flex-1 grid grid-cols-1 p-2 pl-0 overflow-hidden">
        <div className="bg-panel flex w-full h-full flex-1 overflow-hidden rounded-md border">
          <ArticleCol feedUuid={feedUuid} type={type} ref={articleColRef} />
          <View goNext={goNext} goPrev={goPrev} />
          <LPodcast visible={shouldShowPodcast} />
        </div>
      </div>

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
    </div>
  );
};
