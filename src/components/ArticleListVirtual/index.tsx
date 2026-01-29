import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArticleItem } from "../ArticleItem";
import { Skeleton } from "@radix-ui/themes";
import type { ArticleResItem } from "@/db";
import { Snail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useVirtualizer } from "@tanstack/react-virtual";

export type ArticleListVirtualProps = {
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

export interface ArticleListVirtualRefType {
  getList: () => void;
  markAllRead: () => void;
  articlesRef: any;
  innerRef: React.RefObject<HTMLDivElement>;
}

export const ArticleListVirtual = React.memo(
  React.forwardRef<HTMLDivElement, ArticleListVirtualProps>(
    (props: ArticleListVirtualProps, ref) => {
      const { articles, isEmpty, isLoading, isReachingEnd, size, setSize } =
        props;
      const { t } = useTranslation();
      const parentRef = useRef<HTMLDivElement>(null);

      const rowVirtualizer = useVirtualizer({
        count: articles.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 100,
        overscan: 4,
      });

      const virtualItems = rowVirtualizer.getVirtualItems();

      useEffect(() => {
        const lastItem = virtualItems[virtualItems.length - 1];
        if (lastItem && !isReachingEnd && !isLoading) {
          setSize(size + 1);
        }
      }, [virtualItems, isReachingEnd, isLoading, size, setSize]);

      return (
        <div className="w-full h-full flex flex-col" ref={ref}>
          <div ref={parentRef} className="flex-1 overflow-auto">
            <div
              className="relative"
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
              }}
            >
              {isEmpty ? (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center gap-1 text-muted-foreground">
                  <Snail size={34} strokeWidth={1} />
                  <p>{t("Yay, no matching items.")}</p>
                </div>
              ) : (
                <AnimatePresence>
                  {virtualItems.map((virtualRow) => {
                    const article = articles[virtualRow.index];
                    return (
                      <motion.div
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-0 left-0 w-full"
                        style={{
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <ArticleItem article={article} />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>
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
      );
    },
  ),
);

export default ArticleListVirtual;
