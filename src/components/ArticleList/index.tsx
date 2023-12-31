import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArticleItem } from "../ArticleItem";
import { Skeleton } from "../ui/skeleton";
import { useIntersectionObserver } from "./useIntersectionObserver";
import { ArticleResItem } from "@/db";
import { Snail } from "lucide-react";

export type ArticleListProps = {
  feedUuid?: string;
  type?: string;
  title: string | null;
  articles: ArticleResItem[];
  size: any;
  setSize: any;
  isRefreshing?: boolean;
  isReachingEnd?: boolean;
  isEmpty: boolean;
  isLoading: boolean;
};

export interface ArticleListRefType {
  getList: () => void;
  markAllRead: () => void;
  articlesRef: any;
  innerRef: React.RefObject<HTMLDivElement>;
}

export const ArticleList = React.memo((props: ArticleListProps) => {
  const { articles, isEmpty, isLoading, isReachingEnd, size, setSize } = props;
  const loadRef = useRef<HTMLDivElement | null>(null);
  const entry = useIntersectionObserver(loadRef, {});
  const loadRefVisible = !!entry?.isIntersecting;

  const renderList = (): JSX.Element[] => {
    return (articles || []).map((article: any, idx: number) => {
      return (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          initial={{ opacity: 0, y: 30 }}
          key={article.title + idx}
        >
          <ArticleItem article={article} />
        </motion.div>
      );
    });
  };

  useEffect(() => {
    if (loadRefVisible && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [loadRefVisible, isReachingEnd]);

  return (
    <div className="overflow-y-auto h-[calc(100vh_-_var(--app-toolbar-height))]">
      {isEmpty ? (
        <div className="absolute top-1/2 -translate-y-1/2 w-full flex flex-col justify-center items-center gap-1 text-muted-foreground">
          <Snail size={34} strokeWidth={1} />
          <p>Yay, no matching items.</p>
        </div>
      ) : null}
      <ul className="m-0 grid gap-2 py-2 px-2">{renderList()}</ul>
      <div ref={loadRef} className="pt-1">
        {isLoading && (
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
});
