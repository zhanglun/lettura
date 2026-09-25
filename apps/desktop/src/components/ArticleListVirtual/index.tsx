import React, { useEffect, useRef } from "react";
import { ArticleItem } from "../ArticleItem";
import { Skeleton } from "@astryxdesign/core/Skeleton";
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
  /** 已据此 size 请求过下一页：代替 1s 时间冷却（时间冷却会把“停住不动”的续加载卡成必须再动一下） */
  const requestedSizeRef = useRef(-1);

  // 键盘焦点行滚动到可视区
  useEffect(() => {
    if (!(focusedUuid && containerRef.current)) return;
    const el = containerRef.current.querySelector(
      `[data-item-uuid="${focusedUuid}"]`,
    ) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [focusedUuid]);

  // 触底加载：判定基于**内容**高度（扣掉给悬浮条留的 `--fusion-player-inset` 让位空白），
  // 否则空白会被算进 scrollHeight，阈值就落到空白里——看到最后一行时还不加载。
  // 防抖用 size 门闩（不用时间冷却）：时间冷却会把“滚到底停住”的续加载卡成必须再动一下。
  // 不做 isScrolled 状态机——拖滚动条一次跳到底时没有「途经非底区」的 scroll 事件可用。
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const inset =
      parseFloat(
        getComputedStyle(container).getPropertyValue("--fusion-player-inset"),
      ) || 0;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const contentHeight = Math.max(1, scrollHeight - inset);
      const atBottom = (scrollTop + clientHeight) / contentHeight > 0.9;

      if (
        atBottom &&
        !(isReachingEnd || isLoading || requestedSizeRef.current === size)
      ) {
        requestedSizeRef.current = size;
        setSize(size + 1);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isReachingEnd, isLoading, size, setSize]);

  return (
    <div
      ref={containerRef}
      className={`w-full flex-1 min-h-0 overflow-y-auto scrollbar-gutter${
        isEmpty ? "" : " fusion-inset-tail"
      }`}
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
          <Skeleton height={20} />
          <div>
            <Skeleton height={12} />
          </div>
          <div>
            <Skeleton height={12} />
          </div>
          <div className="flex justify-between">
            <Skeleton height={12} width={128} />
            <Skeleton height={12} width={64} />
          </div>
        </div>
      )}
    </div>
  );
});

export default ArticleListVirtual;
