import { useRef, useCallback, useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useParams, useMatch, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArticleCol, ArticleColRefObject } from "@/layout/Article/ArticleCol";
import { ArticleDialogView } from "@/components/ArticleView/DialogView";
import { open } from "@tauri-apps/plugin-shell";
import { View } from "./View";
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
  const location = useLocation();
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
  const isListOnlyRoute = !isArticleRoute && !article;

  useEffect(() => {
    if (!isArticleRoute) {
      setArticle(null);
    }
  }, [feedUuid, isArticleRoute, setArticle, type]);

  useEffect(() => {
    if (!article?.uuid || !feedUuid) return;

    const target = `/local/feeds/${feedUuid}/articles/${article.uuid}`;
    if (location.pathname !== target) {
      navigate(target, { replace: Boolean(isArticleRoute) });
    }
  }, [article?.uuid, feedUuid, isArticleRoute, location.pathname, navigate]);

  useEffect(() => {
    if (!isArticleRoute || !params.id) return;
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
    <div className="flex flex-row w-full h-full overflow-hidden">
      <motion.div
        className="h-full min-w-0 shrink-0 overflow-hidden"
        animate={{
          width: isListOnlyRoute ? "100%" : "var(--app-article-width)",
        }}
        transition={{ type: "spring", stiffness: 360, damping: 38 }}
      >
        <ArticleCol
          feedUuid={feedUuid}
          type={type}
          ref={articleColRef}
          wide={isListOnlyRoute}
        />
      </motion.div>
      <AnimatePresence initial={false}>
        {!isListOnlyRoute && (
          <motion.div
            key="article-reading-drawer"
            className="h-full min-h-0 min-w-0 flex-1 overflow-hidden"
            initial={{ x: 56, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 56, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 38 }}
          >
            <View
              article={store.article}
              goNext={handleGoNext}
              goPrev={handleGoPrev}
            />
          </motion.div>
        )}
      </AnimatePresence>
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
    </div>
  );
};
