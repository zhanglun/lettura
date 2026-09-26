import { useEffect, useRef, useState } from "react";
import { ArticleDetail } from "@/components/ArticleView/Detail";
import {
  ScrollBox,
  ScrollBoxRefObject,
} from "@/components/ArticleView/ScrollBox";
import { ReaderControls } from "@/components/ReaderControls";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Kbd } from "@astryxdesign/core/Kbd";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { ArticleResItem } from "@/db";
import { Check, ChevronLeft, X } from "lucide-react";
import { Button } from "@astryxdesign/core/Button";
import { useBearStore } from "@/stores";
import { useNavigate, useParams } from "react-router-dom";
import { RowThumb } from "@/components/ArticleItem";

export interface ArticleViewProps {
  article: ArticleResItem | null;
  /** 下一篇（完读区卡片，j/k 直达） */
  nextArticle?: ArticleResItem | null;
  onOpenNext?: () => void;
  /** 已读并返回列表 */
  onMarkBack?: () => void;
  closable?: boolean;
  onClose?: () => void;
  onArticleUpdate?: (updated: ArticleResItem) => void;
}

/** 阅读面：640px 宋体单栏，顶栏下缘进度发丝线是唯一的仪表读数（detail.html 契约） */
export function View({
  article,
  nextArticle,
  onOpenNext,
  onMarkBack,
  closable,
  onClose,
  onArticleUpdate,
}: ArticleViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ uuid?: string }>();
  const setArticle = useBearStore((state) => state.setArticle);
  const [progress, setProgress] = useState(0);
  const scrollBoxRef = useRef<ScrollBoxRefObject>(null);

  // 切换文章回滚顶部，进度线归零
  useEffect(() => {
    scrollBoxRef.current?.scrollToTop();
    setProgress(0);
  }, [article?.uuid]);

  const handleBack = () => {
    if (closable) {
      onClose?.();
      return;
    }
    setArticle(null);
    if (params.uuid) {
      navigate(`/local/feeds/${params.uuid}`);
    }
  };

  const renderPlaceholder = () => {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6">
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--fusion-ter)]"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-medium text-[var(--fusion-ink)] mb-2">
          {t("Ready to Read")}
        </h2>
        <p className="text-[var(--fusion-sub)] text-base">
          {t("Select an article from your subscribe to start reading")}
        </p>
      </div>
    );
  };

  return (
    <div className="relative flex h-full min-h-0 flex-1 min-w-0 flex-col">
      {/* 固定顶栏 */}
      <div className="fusion-dtop">
        <Button
          variant="ghost"
          size="sm"
          icon={<ChevronLeft size={12} />}
          label={t("article.view.back")}
          endContent={<Kbd keys="esc" />}
          onClick={handleBack}
        />
        {article && (
          <span className="d-src">
            {article.feed_title} ·{" "}
            {formatDistanceToNow(
              new Date(article.pub_date || article.create_date),
              { addSuffix: true },
            )}
          </span>
        )}
        <span className="fusion-spring" />
        {article && (
          <ReaderControls
            article={article}
            showBrowser
            onStarChange={onArticleUpdate}
            onReadChange={onArticleUpdate}
          />
        )}
        {closable && (
          <IconButton
            size="md"
            variant="ghost"
            label={t("Close")}
            onClick={onClose}
            icon={<X size={16} />}
          />
        )}
      </div>

      {/* 阅读进度发丝线（scaleX，避免 width 布局动画） */}
      <div
        className="fusion-prog"
        style={{ transform: `scaleX(${progress / 100})` }}
      />

      {/* 正文 */}
      <ScrollBox
        className="fusion-dscroll min-h-0 w-full flex-1"
        ref={scrollBoxRef}
        onProgress={setProgress}
      >
        {/* 外壳（题/meta/完读区）继承 UI sans；宋体只落在 .fusion-article-body 正文上 */}
        <div className="mx-auto w-full max-w-[640px] px-10 py-11">
          {article ? (
            <>
              <ArticleDetail article={article} />

              {/* 完读区：发丝线夹「· 完 ·」，下一篇入卡（j/k 直达） */}
              <div className="fusion-fin">· 完 ·</div>
              {nextArticle ? (
                <div className="fusion-nextcard">
                  <div className="fusion-next-h">
                    {t("article.view.next_up")} · J/K
                  </div>
                  <div
                    className="fusion-row"
                    role="button"
                    tabIndex={0}
                    onClick={onOpenNext}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onOpenNext?.();
                    }}
                  >
                    <span className="fusion-st">
                      <span className="fusion-dot" />
                    </span>
                    <RowThumb article={nextArticle} />
                    <span className="fusion-title">{nextArticle.title}</span>
                    <span className="fusion-src">
                      {nextArticle.feed_logo && (
                        <img
                          className="fusion-ficon"
                          src={nextArticle.feed_logo}
                          alt=""
                          loading="lazy"
                        />
                      )}
                      <span className="fn">{nextArticle.feed_title}</span>
                    </span>
                    <span className="fusion-date">
                      {formatDistanceToNow(
                        new Date(nextArticle.pub_date || nextArticle.create_date),
                        { addSuffix: true },
                      )}
                    </span>
                    <span />
                  </div>
                </div>
              ) : (
                <div className="fusion-next-h">{t("article.view.no_next")}</div>
              )}
              <div className="fusion-endacts">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Check size={12} />}
                  label={t("article.view.mark_back")}
                  endContent={<Kbd keys="m" />}
                  onClick={onMarkBack}
                />
              </div>
            </>
          ) : (
            renderPlaceholder()
          )}
        </div>
      </ScrollBox>
    </div>
  );
}
