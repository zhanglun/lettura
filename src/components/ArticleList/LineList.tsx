import React from "react";
import { useBearStore } from "@/hooks/useBearStore";
import { ArticleListProps } from "@/components/ArticleList/index";
import { ArticleLineItem } from "@/components/ArticleItem/Line";
import { useArticleListHook } from "@/components/ArticleList/hooks";
import { Skeleton } from "../ui/skeleton";

export const ArticleLineList = (props: ArticleListProps): JSX.Element => {
  const { feedUuid } = props;
  const store = useBearStore((state) => ({
    currentFilter: state.currentFilter,
    setArticleList: state.setArticleList,
    articleList: state.articleList,
    getArticleList: state.getArticleList,
  }));
  const { listRef, loadRef, loading, hasMore } = useArticleListHook({
    feedUuid,
  });

  const renderList = (): JSX.Element[] => {
    return (store.articleList || []).map((article: any, idx: number) => {
      return <ArticleLineItem article={article} key={article.id} />;
    });
  };

  return (
    <div
      className="overflow-y-auto h-[100vh] pt-[var(--app-toolbar-height)]"
      ref={listRef}
    >
      <ul className="m-0 pb-2">{renderList()}</ul>
      <div ref={loadRef}>
        {hasMore && (
          <div className="grid grid-cols-[30px_1fr_120px] items-center p-2 pl-6">
            <div>
              <Skeleton className="rounded w-4 h-4 mr-1" />
            </div>
            <div>
              <Skeleton className="h-4" />
            </div>
            <div className="flex justify-end items-center">
              <Skeleton className="h-4 flex-1 ml-2" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
