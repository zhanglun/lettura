import { motion, AnimatePresence } from "framer-motion";
import { ArticleDetail } from "@/components/ArticleView/Detail";
import {
  ScrollBox,
  ScrollBoxRefObject,
} from "@/components/ArticleView/ScrollBox";
import { useRef } from "react";
import { StarAndRead } from "@/layout/Article/StarAndRead";
import { IconButton } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { ArticleResItem } from "@/db";
import { ChevronLeft, X } from "lucide-react";
import { useBearStore } from "@/stores";
import { useNavigate, useParams } from "react-router-dom";

export interface ArticleViewProps {
  article: ArticleResItem | null;
  goNext?: () => void;
  goPrev?: () => void;
  closable?: boolean;
  onClose?: () => void;
}

export function View(props: ArticleViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ uuid?: string }>();
  const setArticle = useBearStore((state) => state.setArticle);

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

  const scrollBoxRef = useRef<ScrollBoxRefObject>(null);

  const handleBack = () => {
    if (props.closable) {
      props.onClose?.();
      return;
    }
    setArticle(null);
    if (params.uuid) {
      navigate(`/local/feeds/${params.uuid}`);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 min-w-0 bg-[var(--color-panel-solid)]">
      <AnimatePresence>
        <motion.article
          key={props.article?.uuid || "view"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="flex h-full min-h-0 w-full overflow-hidden"
        >
          <ScrollBox
            className="h-full min-h-0 w-full"
            ref={scrollBoxRef}
          >
            <div className="mx-auto flex min-h-full w-full max-w-[680px] flex-col px-8 py-10 font-[var(--reading-font-body)]">
              <div className="mb-6 flex items-center gap-2 border-b border-[var(--gray-5)] pb-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-[11px] text-[var(--gray-10)] transition hover:bg-[var(--gray-a3)] hover:text-[var(--gray-12)]"
                >
                  <ChevronLeft size={14} />
                  {t("article.view.back")}
                </button>
                <div className="flex-1" />
                {props.article && <StarAndRead article={props.article} />}
                {props.closable && (
                  <IconButton
                    size="2"
                    variant="ghost"
                    color="gray"
                    className="text-[var(--gray-11)]"
                    onClick={props.onClose}
                  >
                    <X size={16} />
                  </IconButton>
                )}
              </div>
              {props.article ? (
                <ArticleDetail article={props.article} />
              ) : (
                <div className="flex flex-1 items-center justify-center">
                  {renderPlaceholder()}
                </div>
              )}
            </div>
          </ScrollBox>
        </motion.article>
      </AnimatePresence>
    </div>
  );
}
