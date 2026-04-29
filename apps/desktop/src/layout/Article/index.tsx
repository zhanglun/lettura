import { useRef, useCallback, useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useParams, useMatch } from "react-router-dom";
import { ArticleCol, ArticleColRefObject } from "@/layout/Article/ArticleCol";
import { ArticleDialogView } from "@/components/ArticleView/DialogView";
import { open } from "@tauri-apps/plugin-shell";
import { View } from "./View";
import { useQuery } from "@/helpers/parseXML";
import { LPodcast } from "@/components/LPodcast";
import { useBearStore } from "@/stores";
import { MainPanel } from "@/components/MainPanel";
import { useShallow } from "zustand/react/shallow";
import { RouteConfig } from "@/config";
import { request } from "@/helpers/request";

export const ArticleContainer = () => {
  const [, type, queryFeedUuid] = useQuery();
  const params = useParams<{ uuid?: string; id?: string }>();
  const isArticleRoute = useMatch(RouteConfig.LOCAL_ARTICLE);
  const feedUuid = params.uuid || queryFeedUuid;

  const store = useBearStore(
    useShallow((state) => ({
      article: state.article,
      setArticle: state.setArticle,
      articleDialogViewStatus: state.articleDialogViewStatus,
      setArticleDialogViewStatus: state.setArticleDialogViewStatus,
      podcastPanelStatus: state.podcastPanelStatus,
      tracks: state.tracks,
      podcastPlayingStatus: state.podcastPlayingStatus,
    })),
  );

  const { article, setArticle } = store;

  useEffect(() => {
    if (!isArticleRoute || !params.id) return;
    if (article?.uuid === params.id) return;

    request
      .get(`/articles/${params.id}`)
      .then((res) => {
        if (res.data) {
          setArticle(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load article from URL params:", err);
      });
  }, [isArticleRoute, params.id, article?.uuid, setArticle]);

  const articleColRef = useRef<ArticleColRefObject>(null);
  const { goNext, goPrev } = (articleColRef.current ||
    {}) as ArticleColRefObject;

  const openInBrowser = useCallback(() => {
    store.article && open(store.article.link);
  }, [store]);

  const handleGoNext = useCallback(() => {
    goNext?.();
  }, [goNext]);

  const handleGoPrev = useCallback(() => {
    goPrev?.();
  }, [goPrev]);

  useHotkeys("o", openInBrowser);

  // 根据条件决定是否显示 LPodcast
  const shouldShowPodcast =
    store.tracks?.length > 0 || store.podcastPlayingStatus;

  return (
    <MainPanel>
      <>
        <ArticleCol feedUuid={feedUuid} type={type} ref={articleColRef} />
        <View
          article={store.article}
          goNext={handleGoNext}
          goPrev={handleGoPrev}
        />
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
