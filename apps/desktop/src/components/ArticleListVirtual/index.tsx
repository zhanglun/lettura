import React, { useEffect, useRef, useState } from "react";
import { ArticleItem } from "../ArticleItem";
import { Skeleton } from "@radix-ui/themes";
import type { ArticleResItem } from "@/db";
import { Snail } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  onArticleRead?: (article: ArticleResItem) => void;
  onArticleUpdate?: (updated: ArticleResItem) => void;
  onExpandArticle?: (article: ArticleResItem) => void;
  focusedUuid?: string;
  sectionLabel?: string;
};

export const ArticleListVirtual = React.memo(function ArticleListVirtual(
  props: ArticleListVirtualProps,
) {
  const {
    articles,
    isEmpty,
    isLoading,
    isReachingEnd,
    size,
    setSize,
    onArticleRead,
    onArticleUpdate,
    onExpandArticle,
    focusedUuid,
    sectionLabel,
  } = props;
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const isLoadingMoreRef = useRef(false);

  // 键盘焦点行滚动到可视区
  useEffect(() => {
    if (!focusedUuid || !containerRef.current) return;
    const el = containerRef.current.querySelector(
      `[data-item-uuid="${focusedUuid}"]`,
    ) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [focusedUuid]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const atBottom = (scrollTop + clientHeight) / scrollHeight > 0.9;

      if (atBottom && !isScrolled) {
        setIsScrolled(true);
        if (!(isReachingEnd || isLoading || isLoadingMoreRef.current)) {
          isLoadingMoreRef.current = true;
          setSize(size + 1);
          setTimeout(() => {
            isLoadingMoreRef.current = false;
          }, 1000);
        }
      } else if (!atBottom && isScrolled) {
        setIsScrolled(false);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isScrolled, isReachingEnd, isLoading, size, setSize]);

  return (
    <div
      ref={containerRef}
      className="w-full flex-1 min-h-0 overflow-y-auto scrollbar-gutter"
    >
      {isEmpty ? (
        <div className="flex flex-col justify-center items-center gap-1 text-muted-foreground min-h-full py-20">
          <Snail size={34} strokeWidth={1} />
          <p>{t("Yay, no matching items.")}</p>
        </div>
      ) : (
        <div>
          {sectionLabel && (
            <div className="art-section-label">{sectionLabel}</div>
          )}
          {articles.map((article, index) => (
            <div key={`${article.uuid}-${index}`} data-item-uuid={article.uuid}>
              <ArticleItem
                article={article}
                focused={focusedUuid === article.uuid}
                onRead={onArticleRead}
                onExpand={onExpandArticle}
                onUpdate={(patch) =>
                  onArticleUpdate?.({ ...article, ...patch })
                }
              />
            </div>
          ))}
        </div>
      )}
      {isLoading && (
        <div className="p-2 pl-6 grid gap-1 relative shrink-0">
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
});

export default ArticleListVirtual;
