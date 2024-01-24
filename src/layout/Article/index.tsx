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
    <div className={classNames(styles.article)}>
      <Layout1 feedUuid={feedUuid} type={type} />
      <View />

        <div className={clsx("overflow-hidden", {
          "w-0": store.podcastPanelStatus,
        })}>
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
