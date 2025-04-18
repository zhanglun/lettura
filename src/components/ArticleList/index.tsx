import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArticleItem } from "../ArticleItem";
import { Skeleton } from "@radix-ui/themes";
import { useIntersectionObserver } from "./useIntersectionObserver";
import { ArticleResItem } from "@/db";
import { Snail } from "lucide-react";
import { useTranslation } from "react-i18next";

export type ArticleListProps = {
  feedUuid?: string;
  type?: string;
  title: string | null;
  articles: ArticleResItem[];
  size: any;
  setSize: any;
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

export const ArticleList = React.memo(
  React.forwardRef<HTMLDivElement, ArticleListProps>((props: ArticleListProps, ref) => {
    const { articles, isEmpty, isLoading, isReachingEnd, size, setSize } = props;
    const { t } = useTranslation();
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
            className="w-full"
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
      <div className="w-full" ref={ref}>
        {isEmpty ? (
          <div className="absolute top-1/2 -translate-y-1/2 w-full flex flex-col justify-center items-center gap-1 text-muted-foreground">
            <Snail size={34} strokeWidth={1} />
            <p>{t("Yay, no matching items.")}</p>
          </div>
        ) : null}
        <ul className="m-0 flex flex-col gap-[2px] pt-1 pr-0 pb-1 pl-1">{renderList()}</ul>
        <div ref={loadRef} className="pt-1">
          {isLoading && (
            <div className="p-2 pl-6 grid gap-1 relative">
              <Skeleton className="h-5 w-full" />
              <div>
                <Skeleton className="h-3 w-full" />
              </div>
              <div>
                <Skeleton className="h-3 w-full" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  })
);
