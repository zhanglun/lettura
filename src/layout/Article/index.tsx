import { useBearStore } from "@/stores";
import { useHotkeys } from "react-hotkeys-hook";
import { ArticleCol, ArticleColRefObject } from "@/layout/Article/ArticleCol";
import { ArticleDialogView } from "@/components/ArticleView/DialogView";
import { open } from "@tauri-apps/api/shell";
import { View } from "./View";
import { useQuery } from "@/helpers/parseXML";
import { LPodcast } from "@/components/LPodcast";
import clsx from "clsx";
import { useRef } from "react";

export const ArticleContainer = () => {
  const [, type, feedUuid] = useQuery();
  const store = useBearStore((state) => ({
    article: state.article,
    setArticle: state.setArticle,
    articleDialogViewStatus: state.articleDialogViewStatus,
    setArticleDialogViewStatus: state.setArticleDialogViewStatus,
    podcastPanelStatus: state.podcastPanelStatus,
    tracks: state.tracks,
  }));

  const articleColRef = useRef<ArticleColRefObject>(null);
  const { goNext, goPrev } = (articleColRef.current || {}) as ArticleColRefObject;

  const openInBrowser = () => {
    store.article && open(store.article.link);
  };

  useHotkeys("o", () => openInBrowser());

  return (
    <div className="relative flex flex-col w-full h-[100vh]">
      <div className="flex-1 grid grid-cols-1 p-2 pl-0 overflow-hidden">
        <div className="bg-panel flex w-full h-full flex-1 overflow-hidden rounded-md border">
          <ArticleCol feedUuid={feedUuid} type={type} ref={articleColRef} />
          <View goNext={goNext} goPrev={goPrev} />
        </div>
      </div>

      {store.podcastPanelStatus && (
        <LPodcast
          tracks={store.tracks}
          mini={false}
        />
      )}

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
