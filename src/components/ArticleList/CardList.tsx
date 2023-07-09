import React from "react";
import { useBearStore } from "@/hooks/useBearStore";
import { ArticleListProps } from "@/components/ArticleList/index";
import { useArticleListHook } from "@/components/ArticleList/hooks";
import { ArticleCardItem } from "@/components/ArticleItem/Card";
import { Skeleton } from "../ui/skeleton";
import { useAutoScroll } from "@/hooks/useAutoScroll";

export const ArticleCardList = (props: ArticleListProps): JSX.Element => {
  const { feedUuid } = props;
  const store = useBearStore((state) => ({
    currentFilter: state.currentFilter,
    setArticleList: state.setArticleList,
    articleList: state.articleList,
  }));
  const { listRef, loadRef, loading, hasMore } = useArticleListHook({
    feedUuid,
  });

  useAutoScroll({ listRef });

  const renderList = (): JSX.Element[] => {
    return (store.articleList || []).map((article: any, idx: number) => {
      return <ArticleCardItem article={article} key={article.id} />;
    });
  };

  return (
    <div
      className="overflow-y-auto h-[calc(100vh_-_var(--app-toolbar-height))]"
      ref={listRef}
    >
      <ul className="m-[0_auto] py-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:max-w-3xl lg:max-w-5xl">
        {renderList()}
      </ul>
      <div ref={loadRef}>
        {hasMore && (
          <div className="m-[0_auto] py-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:max-w-3xl lg:max-w-5xl">
            {Object.keys(Array.from({ length: 4 })).map((_) => (
              <div
                key={_}
                className="rounded-md border border-border overflow-hidden"
              >
                <div className="relative h-0 before:content-[''] before:inline-block pt-[60%] overflow-hidden bg-muted"></div>
                <div className="p-4 space-y-2">
                  <Skeleton className="h-[20px]" />
                  <Skeleton className="h-[14px] w-2/5" />
                  <div className="space-y-1">
                    <Skeleton className="h-[14px]" />
                    <Skeleton className="h-[14px]" />
                    <Skeleton className="h-[14px]" />
                    <Skeleton className="h-[14px] w-2/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
