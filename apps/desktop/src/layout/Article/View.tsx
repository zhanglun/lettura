import { useEffect, useRef, useState } from "react";
import { ArticleDetail } from "@/components/ArticleView/Detail";
import {
  ScrollBox,
  ScrollBoxRefObject,
} from "@/components/ArticleView/ScrollBox";
import { ReaderControls } from "@/components/ReaderControls";
import { IconButton } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { ArticleResItem } from "@/db";
import { ChevronLeft, X } from "lucide-react";
import { useBearStore } from "@/stores";
import { useNavigate, useParams } from "react-router-dom";
import { KindBadge } from "@/components/KindBadge";

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
            className="text-[var(--gray-6)]"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-medium text-[var(--gray-12)] mb-2">
          {t("Ready to Read")}
        </h2>
        <p className="text-[var(--gray-11)] text-base">
          {t("Select an article from your subscribe to start reading")}
        </p>
      </div>
    );
  };

  return (
    <div className="relative flex h-full min-h-0 flex-1 min-w-0 flex-col">
      {/* 固定顶栏 */}
      <div className="fusion-dtop">
        <button type="button" className="fusion-back" onClick={handleBack}>
          <ChevronLeft size={12} />
          {t("article.view.back")}
          <kbd className="fusion-kbd">esc</kbd>
        </button>
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
            size="2"
            variant="ghost"
            color="gray"
            className="text-[var(--gray-11)]"
            onClick={onClose}
          >
            <X size={16} />
          </IconButton>
        )}
      </div>

      {/* 阅读进度发丝线 */}
      <div className="fusion-prog" style={{ width: `${progress}%` }} />

      {/* 正文 */}
      <ScrollBox
        className="min-h-0 w-full flex-1"
        ref={scrollBoxRef}
        onProgress={setProgress}
      >
        <div className="mx-auto w-full max-w-[640px] px-10 py-11 font-[var(--reading-font-body)]">
          {article ? (
            <>
              <ArticleDetail article={article} />

              {/* 完读区 */}
              <div className="fusion-fin">· 完 ·</div>
              {nextArticle ? (
                <div>
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
                    <KindBadge
                      link={nextArticle.link}
                      feed_url={nextArticle.feed_url}
                      media_object={nextArticle.media_object}
                    />
                    <span className="fusion-title">{nextArticle.title}</span>
                    <span className="fusion-src">{nextArticle.feed_title}</span>
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
                <button
                  type="button"
                  className="fusion-btn-gh"
                  onClick={onMarkBack}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  >
                    <path d="m3 8.5 3.2 3L13 5" />
                  </svg>
                  {t("article.view.mark_back")}
                  <kbd className="fusion-kbd">m</kbd>
                </button>
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
