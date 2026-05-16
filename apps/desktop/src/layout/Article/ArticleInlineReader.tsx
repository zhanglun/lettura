import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArticleDetail } from "@/components/ArticleView/Detail";
import { ArticleNavFooter } from "@/components/ArticleNavFooter";
import { Star, Bookmark, Eye, EyeOff, ExternalLink, X } from "lucide-react";
import { ArticleResItem } from "@/db";
import { ArticleReadStatus, ArticleStarStatus, ArticleReadLaterStatus } from "@/typing";
import * as dataAgent from "@/helpers/dataAgent";
import { open } from "@tauri-apps/plugin-shell";
import { useTranslation } from "react-i18next";

interface ArticleInlineReaderProps {
  article: ArticleResItem;
  onClose: () => void;
  goNext?: () => void;
  goPrev?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  index: number;
  total: number;
}

function ToolbarButton({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-all ${
        active
          ? "text-[var(--accent-9)]"
          : "text-[var(--gray-9)] hover:bg-[var(--gray-3)] hover:text-[var(--gray-12)]"
      }`}
    >
      <Icon size={13} />
      <span>{label}</span>
    </button>
  );
}

export function ArticleInlineReader({
  article,
  onClose,
  goNext,
  goPrev,
  canPrev = false,
  canNext = false,
  index,
  total,
}: ArticleInlineReaderProps) {
  const { t } = useTranslation();
  const [readStatus, setReadStatus] = useState(article.read_status);
  const [starred, setStarred] = useState(article.starred);
  const [readLater, setReadLater] = useState(article.is_read_later ?? ArticleReadLaterStatus.UNSAVED);

  useEffect(() => { setReadStatus(article.read_status); }, [article.read_status]);
  useEffect(() => { setStarred(article.starred); }, [article.starred]);
  useEffect(() => { setReadLater(article.is_read_later ?? ArticleReadLaterStatus.UNSAVED); }, [article.is_read_later]);

  const toggleStar = useCallback(() => {
    const next = starred === ArticleStarStatus.UNSTAR ? ArticleStarStatus.STARRED : ArticleStarStatus.UNSTAR;
    dataAgent.updateArticleStarStatus(article.uuid, next).then(() => { article.starred = next; setStarred(next); });
  }, [starred, article]);

  const toggleReadLater = useCallback(() => {
    const next = readLater === ArticleReadLaterStatus.SAVED ? ArticleReadLaterStatus.UNSAVED : ArticleReadLaterStatus.SAVED;
    dataAgent.updateArticleReadLaterStatus(article.uuid, next).then(() => { article.is_read_later = next; setReadLater(next); });
  }, [readLater, article]);

  const toggleRead = useCallback(() => {
    const next = readStatus === ArticleReadStatus.UNREAD ? ArticleReadStatus.READ : ArticleReadStatus.UNREAD;
    dataAgent.updateArticleReadStatus(article.uuid, next).then(() => { article.read_status = next; setReadStatus(next); });
  }, [readStatus, article]);

  const handleOpenOriginal = useCallback(() => {
    if (article.link) open(article.link);
  }, [article.link]);

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={`inline-reader-${article.uuid}`}
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="overflow-hidden border-b border-[var(--gray-4)] bg-[var(--color-panel-solid)]"
      >
        <div className="mx-auto max-w-[680px] px-6 pt-5 pb-6">
          <div className="mb-4 flex items-center gap-2 border-b border-[var(--gray-4)] pb-3">
            <ToolbarButton
              icon={Star}
              label={t(starred === ArticleStarStatus.STARRED ? "Unstar it" : "Star it")}
              active={starred === ArticleStarStatus.STARRED}
              onClick={toggleStar}
            />
            <ToolbarButton
              icon={Bookmark}
              label={t(readLater === ArticleReadLaterStatus.SAVED ? "article.actions.remove_read_later" : "article.actions.read_later")}
              active={readLater === ArticleReadLaterStatus.SAVED}
              onClick={toggleReadLater}
            />
            <div className="h-4 w-px bg-[var(--gray-4)]" />
            <ToolbarButton
              icon={readStatus === ArticleReadStatus.READ ? EyeOff : Eye}
              label={t(readStatus === ArticleReadStatus.READ ? "Mark as unread" : "Mark as read")}
              onClick={toggleRead}
            />
            <ToolbarButton
              icon={ExternalLink}
              label={t("Open in browser")}
              onClick={handleOpenOriginal}
            />
            <button
              type="button"
              onClick={onClose}
              className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--gray-9)] transition-all hover:bg-[rgba(220,38,38,0.08)] hover:text-[#dc2626]"
            >
              <X size={14} />
            </button>
          </div>

          <ArticleDetail article={article} />

          <div className="mt-4">
            <ArticleNavFooter
              canPrev={canPrev}
              canNext={canNext}
              onPrev={goPrev}
              onNext={goNext}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
