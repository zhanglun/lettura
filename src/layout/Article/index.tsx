import { useBearStore } from "@/stores";
import { useHotkeys } from "react-hotkeys-hook";
import { ArticleCol, ArticleColRefObject } from "@/layout/Article/ArticleCol";
import { ArticleDialogView } from "@/components/ArticleView/DialogView";
import { open } from "@tauri-apps/api/shell";
import { View } from "./View";
import { useQuery } from "@/helpers/parseXML";
import { PodcastPlayer } from "@/components/PodcastPlayer";
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
  }));

  const articleColRef = useRef<ArticleColRefObject>(null);
  const { goNext, goPrev } = (articleColRef.current || {}) as ArticleColRefObject;

  const openInBrowser = () => {
    store.article && open(store.article.link);
  };

  useHotkeys("o", () => openInBrowser());

  return (
    <div
      className={clsx("relative grid h-[100vh] flex-1 p-2 pl-0", {
        "gap-2 grid-cols-[1fr_auto]": store.podcastPanelStatus,
        "grid-cols-[auto_0]": !store.podcastPanelStatus,
      })}
    >
      <div className="bg-panel flex h-full flex-1 overflow-hidden rounded-md shadow">
        <ArticleCol feedUuid={feedUuid} type={type} ref={articleColRef} />
        <View goNext={goNext} goPrev={goPrev} />
      </div>

      <div
        className={clsx({
          hidden: !store.podcastPanelStatus,
        })}
      >
        <PodcastPlayer />
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
