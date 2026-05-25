import React, { useRef, useCallback, useImperativeHandle } from "react";
import { ArticleListVirtual, ArticleListVirtualRefType } from "@/components/ArticleListVirtual";
import { useArticle } from "@/hooks/useArticle";
import { retainArticleAfterRead } from "@/helpers/articleHelpers";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { ArticleResItem } from "@/db";

interface FeedArticleListProps {
  feedUuid: string;
}

export interface FeedArticleListRefObject {
  markAllRead: () => Promise<void>;
}

export const FeedArticleList = React.memo(
  React.forwardRef<FeedArticleListRefObject, FeedArticleListProps>((props, ref) => {
    const { feedUuid } = props;
    const listRef = useRef<ArticleListVirtualRefType | null>(null);

    const { articles, isLoading, size, setSize, isEmpty, isReachingEnd, mutate } = useArticle({ feedUuid });

    const store = useBearStore(
      useShallow((state) => ({
        expandedArticleUuid: state.expandedArticleUuid,
        setExpandedArticleUuid: state.setExpandedArticleUuid,
        markArticleListAsRead: state.markArticleListAsRead,
      })),
    );

    const handleArticleRead = useCallback(
      (nextArticle: ArticleResItem) => {
        mutate((pages: { list: ArticleResItem[] }[] | undefined) => retainArticleAfterRead(pages, nextArticle), false);
      },
      [mutate],
    );

    const handleExpandArticle = useCallback(
      (article: ArticleResItem) => {
        if (store.expandedArticleUuid === article.uuid) {
          store.setExpandedArticleUuid(null);
        } else {
          store.setExpandedArticleUuid(article.uuid);
        }
      },
      [store.expandedArticleUuid, store.setExpandedArticleUuid],
    );

    const handleCloseInlineReader = useCallback(() => {
      store.setExpandedArticleUuid(null);
    }, [store.setExpandedArticleUuid]);

    const markAllRead = useCallback(async () => {
      await store.markArticleListAsRead(false, false);
      await mutate();
    }, [store.markArticleListAsRead, mutate]);

    useImperativeHandle(ref, () => ({ markAllRead }));

    return (
      <ArticleListVirtual
        ref={listRef}
        articles={articles}
        title={null}
        feedUuid={feedUuid}
        itemDensity="feeds"
        isLoading={isLoading}
        isEmpty={isEmpty}
        isReachingEnd={isReachingEnd}
        size={size}
        setSize={setSize}
        onArticleRead={handleArticleRead}
        expandedArticleUuid={store.expandedArticleUuid}
        onExpandArticle={handleExpandArticle}
        onCloseInlineReader={handleCloseInlineReader}
      />
    );
  }),
);
