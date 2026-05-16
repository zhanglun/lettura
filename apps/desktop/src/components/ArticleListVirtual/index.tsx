import React, {
  Fragment,
  useEffect,
  useRef,
  useImperativeHandle,
  useCallback,
  useState,
} from "react";
import { AnimatePresence } from "framer-motion";
import { ArticleItem, ArticleItemDensity } from "../ArticleItem";
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
  itemDensity?: ArticleItemDensity;
  onArticleRead?: (article: ArticleResItem) => void;
  expandedArticleUuid?: string | null;
  onExpandArticle?: (article: ArticleResItem) => void;
  onCloseInlineReader?: () => void;
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
        itemDensity = "regular",
        onArticleRead,
        expandedArticleUuid,
        onExpandArticle,
        onCloseInlineReader,
      } = props;
      const { t } = useTranslation();
      const internalParentRef = useRef<HTMLDivElement>(null);
      const [isScrolled, setIsScrolled] = useState(false);

      useEffect(() => {
        if (!expandedArticleUuid || !internalParentRef.current) return;
        const target = internalParentRef.current.querySelector(
          `[data-expand-uuid="${expandedArticleUuid}"]`,
        );
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, [expandedArticleUuid]);

      useImperativeHandle(
        ref,
        () => ({
          getList: () => console.log("getList called"),
          markAllRead: () => console.log("markAllRead called"),
          articlesRef: internalParentRef,
          innerRef: internalParentRef,
        }),
        [],
      );

      const isLoadingMoreRef = useRef(false);

      const loadMore = useCallback(() => {
        if (!(isReachingEnd || isLoading || isLoadingMoreRef.current)) {
          isLoadingMoreRef.current = true;
          setSize(size + 1);
          setTimeout(() => {
            isLoadingMoreRef.current = false;
          }, 1000);
        }
      }, [isReachingEnd, isLoading, size, setSize]);

      const handleScroll = useCallback(() => {
        if (!internalParentRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } =
          internalParentRef.current;
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
        const isAtBottom = scrollPercentage > 0.9;

        if (isAtBottom && !isScrolled) {
          setIsScrolled(true);
          loadMore();
        } else if (!isAtBottom && isScrolled) {
          setIsScrolled(false);
        }
      }, [isScrolled, loadMore]);

      useEffect(() => {
        if (!internalParentRef.current) return;

        const scrollElement = internalParentRef.current;
        scrollElement.addEventListener("scroll", handleScroll, {
          passive: true,
        });
        return () => {
          scrollElement.removeEventListener("scroll", handleScroll);
        };
      }, [handleScroll]);

      return (
        <div
          ref={internalParentRef}
          className="w-full flex-1 overflow-y-auto scrollbar-gutter"
        >
          {isEmpty ? (
            <div className="flex flex-col justify-center items-center gap-1 text-muted-foreground min-h-full py-20">
              <Snail size={34} strokeWidth={1} />
              <p>{t("Yay, no matching items.")}</p>
            </div>
          ) : (
            <ul className="list-none m-0 p-0">
              {articles.map((article, index) => {
                const isExpanded = expandedArticleUuid != null && article.uuid === expandedArticleUuid;
                const isDimmed = expandedArticleUuid != null && !isExpanded;

                return (
                  <Fragment key={`${article.uuid}-${index}`}>
                    <li
                      data-expand-uuid={article.uuid}
                      className={isDimmed ? "opacity-50 transition-opacity duration-200" : ""}
                    >
                      <ArticleItem
                        article={article}
                        density={itemDensity}
                        onRead={onArticleRead}
                        onExpand={onExpandArticle}
                      />
                    </li>
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <li key={`reader-${article.uuid}`}>
                          <ArticleInlineReader
                            article={article}
                            onClose={onCloseInlineReader!}
                            goPrev={index > 0 ? () => onExpandArticle?.(articles[index - 1]) : undefined}
                            goNext={index < articles.length - 1 ? () => onExpandArticle?.(articles[index + 1]) : undefined}
                            canPrev={index > 0}
                            canNext={index < articles.length - 1}
                            index={index}
                            total={articles.length}
                          />
                        </li>
                      )}
                    </AnimatePresence>
                  </Fragment>
                );
              })}
            </ul>
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
