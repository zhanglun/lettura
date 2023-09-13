import React from "react";
import { ArticleItem } from "../ArticleItem";
import { useBearStore } from "@/stores";
import { useArticleListHook } from "./hooks";
import { Skeleton } from "../ui/skeleton";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { motion } from "framer-motion";

export type ArticleListProps = {
  feedUuid: string | null;
  type: string | null;
  feedUrl: string | null;
  title: string | null;
};

export interface ArticleListRefType {
  getList: () => void;
  markAllRead: () => void;
  articlesRef: any;
  innerRef: React.RefObject<HTMLDivElement>;
}

export const ArticleList = (props: ArticleListProps): JSX.Element => {
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
      return (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          initial={{ opacity: 0, y: 30 }}
        >
          <ArticleItem article={article} key={article.title + idx} />
        </motion.div>
      );
    });
  };

  return (
    <div
      className="overflow-y-auto h-[calc(100vh_-_var(--app-toolbar-height))]"
      ref={listRef}
    >
      <ul className="m-0 grid gap-2 py-2 px-2">{renderList()}</ul>
      <div ref={loadRef}>
        {hasMore && (
          <div className="p-3 pl-6 grid gap-1 relative">
            <Skeleton className="h-5 w-full" />
            <div>
              <Skeleton className="h-3 w-full" />
            </div>
            <div>
              <Skeleton className="h-3 w-full m-[-2px]" />
            </div>
            <div>
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
