import { useRef, useCallback, useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useParams, useMatch, useNavigate } from "react-router-dom";
import { ArticleCol, ArticleColRefObject } from "@/layout/Article/ArticleCol";
import { ArticleDialogView } from "@/components/ArticleView/DialogView";
import { open } from "@tauri-apps/plugin-shell";
import { useQuery } from "@/helpers/parseXML";
import { LPodcast } from "@/components/LPodcast";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { RouteConfig } from "@/config";
import { request } from "@/helpers/request";

export const ArticleContainer = () => {
  const [, type, queryFeedUuid] = useQuery();
  const params = useParams<{ uuid?: string; id?: string }>();
  const isArticleRoute = useMatch(RouteConfig.LOCAL_ARTICLE);
  const navigate = useNavigate();
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
    if (!(isArticleRoute && params.id)) return;
    if (article) return;

    let cancelled = false;
    request
      .get(`/articles/${params.id}`)
      .then((res) => {
        if (!cancelled && res.data) {
          setArticle(res.data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load article from URL params:", err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isArticleRoute, params.id, article, setArticle]);

  useEffect(() => {
    if (!isArticleRoute) {
      setArticle(null);
    }
  }, [feedUuid, isArticleRoute, setArticle, type]);

  const articleColRef = useRef<ArticleColRefObject>(null);

  const openInBrowser = useCallback(() => {
    store.article && open(store.article.link);
  }, [store]);

  const handleGoNext = useCallback(() => {
    articleColRef.current?.goNext();
  }, []);

  const handleGoPrev = useCallback(() => {
    articleColRef.current?.goPrev();
  }, []);

  const handleClose = useCallback(() => {
    setArticle(null);
  }, [setArticle]);

  useHotkeys("o", openInBrowser);

  const shouldShowPodcast = store.tracks?.length > 0 || store.podcastPlayingStatus;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--color-background)]">
      <ArticleCol
        feedUuid={feedUuid}
        type={type}
        ref={articleColRef}
        wide={true}
        showFilters={true}
        showManagementActions={true}
      />

      <LPodcast visible={shouldShowPodcast} />
      <ArticleDialogView
        article={store.article}
        dialogStatus={store.articleDialogViewStatus}
        setDialogStatus={store.setArticleDialogViewStatus}
        afterConfirm={() => {}}
        afterCancel={() => {
          store.setArticle(null);
        }}
      />
    </div>
  );
};
