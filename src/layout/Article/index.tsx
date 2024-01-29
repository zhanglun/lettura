import classNames from "classnames";
import { useBearStore } from "@/stores";
import { useHotkeys } from "react-hotkeys-hook";
import { Layout1 } from "@/layout/Article/Layout1";
import { ArticleDialogView } from "@/components/ArticleView/DialogView";
import { open } from "@tauri-apps/api/shell";
import { View } from "./View";
import styles from "./index.module.scss";
import { useQuery } from "@/helpers/parseXML";
import { PodcastPlayer } from "@/components/PodcastPlayer";
import clsx from "clsx";

export const ArticleContainer = (): JSX.Element => {
  const [, type, feedUuid] = useQuery();
  const store = useBearStore((state) => ({
    article: state.article,
    setArticle: state.setArticle,

    articleDialogViewStatus: state.articleDialogViewStatus,
    setArticleDialogViewStatus: state.setArticleDialogViewStatus,

    podcastPanelStatus: state.podcastPanelStatus,
  }));

  const openInBrowser = () => {
    store.article && open(store.article.link);
  };

  useHotkeys("o", () => openInBrowser());

  return (
    <div className={clsx("flex-1 h-[100vh] flex flex-row relative p-2 pl-0", {
      "gap-2 pr-1": store.podcastPanelStatus
    })}>
      <div className="rounded-md flex flex-1 bg-panel h-full overflow-hidden">
        <Layout1 feedUuid={feedUuid} type={type} />
        <View />
      </div>

      <div
        className={clsx("overflow-hidden shrink-0", {
          "w-0": !store.podcastPanelStatus,
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
