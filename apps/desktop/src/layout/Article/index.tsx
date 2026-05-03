import { useRef, useCallback, useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useParams, useMatch, useNavigate } from "react-router-dom";
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
import { Text } from "@radix-ui/themes";
import { BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

export const ArticleContainer = () => {
  const { t } = useTranslation();
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
      rightPanelExpanded: state.rightPanelExpanded,
    })),
  );

  const { article, setArticle, rightPanelExpanded } = store;

  // Deep-link: load article from URL params when store is empty
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

  useEffect(() => {
    if (!isArticleRoute) {
      setArticle(null);
    }
  }, [feedUuid, isArticleRoute, setArticle, type]);

  const articleColRef = useRef<ArticleColRefObject>(null);
  const { goNext, goPrev } = (articleColRef.current || {}) as ArticleColRefObject;

  const openInBrowser = useCallback(() => {
    store.article && open(store.article.link);
  }, [store]);

  const handleGoNext = useCallback(() => {
    goNext?.();
  }, [goNext]);

  const handleGoPrev = useCallback(() => {
    goPrev?.();
  }, [goPrev]);

  const handleClose = useCallback(() => {
    setArticle(null);
    if (feedUuid) {
      navigate(`/local/feeds/${feedUuid}`, { replace: true });
    }
  }, [setArticle, feedUuid, navigate]);

  useHotkeys("o", openInBrowser);

  const shouldShowPodcast = store.tracks?.length > 0 || store.podcastPlayingStatus;

  return (
    <div className="flex flex-row w-full h-full overflow-hidden">
      <div className="h-full shrink-0 overflow-hidden" style={{ width: "var(--app-article-width)" }}>
        <ArticleCol
          feedUuid={feedUuid}
          type={type}
          ref={articleColRef}
          wide={false}
        />
      </div>

      <div
        className={`h-full min-w-0 flex-1 border-l border-[var(--gray-4)] overflow-hidden flex flex-col ${
          rightPanelExpanded ? "bg-[var(--color-background)]" : "bg-[var(--gray-1)]"
        }`}
      >
        {rightPanelExpanded && article ? (
          <View
            article={article}
            goNext={handleGoNext}
            goPrev={handleGoPrev}
            closable={true}
            onClose={handleClose}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <BookOpen size={32} className="text-[var(--gray-7)] mb-3" />
            <Text size="2" className="text-[var(--gray-9)]">
              {t("feeds.select_article")}
            </Text>
          </div>
        )}
      </div>

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
