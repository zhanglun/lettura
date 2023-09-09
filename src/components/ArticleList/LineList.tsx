import React from "react";
import { motion } from "framer-motion";
import { useBearStore } from "@/stores";
import { ArticleListProps } from "@/components/ArticleList/index";
import { ArticleLineItem } from "@/components/ArticleItem/Line";
import { useArticleListHook } from "@/components/ArticleList/hooks";
import { Skeleton } from "../ui/skeleton";
import { useAutoScroll } from "@/hooks/useAutoScroll";

export const ArticleLineList = (props: ArticleListProps): JSX.Element => {
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
      return <motion.div
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        initial={{ opacity: 0, y: 30 }}
      >
        <ArticleLineItem article={article} key={article.id} />
      </motion.div>
    });
  };

  return (
    <div
      className="overflow-y-auto h-[calc(100vh_-_var(--app-toolbar-height))]"
      ref={listRef}
    >
      <ul className="m-0 pb-2 pl-2 py-2">{renderList()}</ul>
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
