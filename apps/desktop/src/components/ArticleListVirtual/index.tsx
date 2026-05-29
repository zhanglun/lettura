import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  useState,
} from "react";
import { ArticleItem } from "../ArticleItem";
import { ArticleInlineReader } from "@/layout/Article/ArticleInlineReader";
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
  expandedArticleUuid?: string | null;
  onExpandArticle?: (article: ArticleResItem) => void;
  onCloseInlineReader?: () => void;
  sectionLabel?: string;
};

export interface ArticleListVirtualRefType {
  getList: () => void;
  markAllRead: () => void;
  articlesRef: any;
  innerRef: React.RefObject<HTMLDivElement>;
}

export const ArticleListVirtual = React.memo(
  React.forwardRef<ArticleListVirtualRefType, ArticleListVirtualProps>(
    (props: ArticleListVirtualProps, ref) => {
      const {
        articles,
        isEmpty,
        isLoading,
        isReachingEnd,
        size,
        setSize,
        onArticleRead,
        onArticleUpdate,
        expandedArticleUuid,
        onExpandArticle,
        onCloseInlineReader,
        sectionLabel,
      } = props;
      const { t } = useTranslation();
      const containerRef = useRef<HTMLDivElement>(null);
      const [isScrolled, setIsScrolled] = useState(false);
      const isLoadingMoreRef = useRef(false);

      useEffect(() => {
        if (!expandedArticleUuid || !containerRef.current) return;
        const container = containerRef.current;
        const itemEl = container.querySelector(
          `[data-item-uuid="${expandedArticleUuid}"]`,
        ) as HTMLElement | null;
        if (!itemEl) return;
        const rowEl = itemEl.firstElementChild as HTMLElement | null;
        const target = rowEl ?? itemEl;
        const delta =
          target.getBoundingClientRect().bottom -
          container.getBoundingClientRect().top;
        container.scrollTo({ top: container.scrollTop + delta, behavior: "smooth" });
      }, [expandedArticleUuid]);

      useImperativeHandle(
        ref,
        () => ({
          getList: () => console.log("getList called"),
          markAllRead: () => console.log("markAllRead called"),
          articlesRef: containerRef,
          innerRef: containerRef,
        }),
        [],
      );

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
              setTimeout(() => { isLoadingMoreRef.current = false; }, 1000);
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
              {articles.map((article, index) => {
                const isExpanded = expandedArticleUuid === article.uuid;
                return (
                  <div key={`${article.uuid}-${index}`} data-item-uuid={article.uuid}>
                    <ArticleItem
                      article={article}
                      onRead={onArticleRead}
                      onExpand={onExpandArticle}
                    />
                    {isExpanded && (
                      <ArticleInlineReader
                        article={article}
                        onClose={onCloseInlineReader!}
                        goPrev={index > 0 ? () => onExpandArticle?.(articles[index - 1]) : undefined}
                        goNext={index < articles.length - 1 ? () => onExpandArticle?.(articles[index + 1]) : undefined}
                        canPrev={index > 0}
                        canNext={index < articles.length - 1}
                        index={index}
                        total={articles.length}
                        onArticleUpdate={onArticleUpdate}
                      />
                    )}
                  </div>
                );
              })}
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
    },
  ),
);

export default ArticleListVirtual;
