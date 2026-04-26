import { useRef, useCallback, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import {
  TodayArticleList,
  TodayArticleListRefObject,
} from "./TodayArticleList";
import { TodayEmptyState } from "./TodayEmptyState";
import { View } from "@/layout/Article/View";
import { MainPanel } from "@/components/MainPanel";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { open } from "@tauri-apps/plugin-shell";
import { useArticle } from "@/layout/Article/useArticle";

export function TodayPage() {
  const articleListRef = useRef<TodayArticleListRefObject>(null);
  const [goNext, setGoNext] = useState<(() => void) | undefined>();
  const [goPrev, setGoPrev] = useState<(() => void) | undefined>();

  const store = useBearStore(
    useShallow((state) => ({
      article: state.article,
      subscribes: state.subscribes,
    })),
  );

  const { error: articleError, isEmpty: articleListEmpty, mutate } = useArticle({});

  const hasSubscriptions = store.subscribes.length > 0;
  const hasError = articleError !== null;
  const showEmptyState = !hasSubscriptions || hasError || (hasSubscriptions && articleListEmpty);

  const handleRefReady = useCallback(
    (ref: TodayArticleListRefObject | null) => {
      if (ref) {
        setGoNext(() => ref.goNext);
        setGoPrev(() => ref.goPrev);
      }
    },
    [],
  );

  const openInBrowser = useCallback(() => {
    store.article && open(store.article.link);
  }, [store.article]);

  const handleGoNext = useCallback(() => {
    goNext?.();
  }, [goNext]);

  const handleGoPrev = useCallback(() => {
    goPrev?.();
  }, [goPrev]);

  useHotkeys("o", openInBrowser);

  const renderEmptyState = () => {
    if (hasError) {
      return <TodayEmptyState type="load_error" onRetry={() => mutate()} />;
    }
    if (!hasSubscriptions) {
      return <TodayEmptyState type="no_subscriptions" />;
    }
    return <TodayEmptyState type="no_new_articles" />;
  };

  return (
    <MainPanel>
      <>
        {showEmptyState ? (
          renderEmptyState()
        ) : (
          <>
            <TodayArticleList ref={handleRefReady} />
            <View
              article={store.article}
              goNext={handleGoNext}
              goPrev={handleGoPrev}
            />
          </>
        )}
      </>
    </MainPanel>
  );
}
