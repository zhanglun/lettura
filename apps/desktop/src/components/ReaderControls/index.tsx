import { useCallback, useEffect, useState } from "react";
import { Star, Eye, EyeOff, ExternalLink, Bookmark } from "lucide-react";
import type { ArticleResItem } from "@/db";
import { ArticleReadLaterStatus, ArticleReadStatus, ArticleStarStatus } from "@/typing";
import * as dataAgent from "@/helpers/dataAgent";
import { open } from "@tauri-apps/plugin-shell";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

export interface ReaderControlBtnProps {
  icon: React.ElementType;
  label?: string;
  active?: boolean;
  activeClass?: string;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}

export function ReaderControlBtn({
  icon: Icon,
  label,
  active = false,
  activeClass,
  disabled = false,
  onClick,
  className,
}: ReaderControlBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-all",
        "disabled:opacity-40 disabled:cursor-default",
        active
          ? (activeClass ?? "text-[var(--accent-9)] bg-[var(--accent-a3)]")
          : "text-[var(--gray-9)] hover:bg-[var(--gray-3)] hover:text-[var(--gray-12)]",
        className,
      )}
    >
      <Icon size={14} />
      {label && <span>{label}</span>}
    </button>
  );
}

export interface ReaderControlsProps {
  article: ArticleResItem;
  showBrowser?: boolean;
  showReadLater?: boolean;
  onStarChange?: (updated: ArticleResItem) => void;
  onReadChange?: (updated: ArticleResItem) => void;
}

export function ReaderControls({
  article,
  showBrowser = true,
  showReadLater = false,
  onStarChange,
  onReadChange,
}: ReaderControlsProps) {
  const { t } = useTranslation();
  const [readStatus, setReadStatus] = useState(article.read_status);
  const [starred, setStarred] = useState(article.starred);
  const [readLater, setReadLater] = useState(
    article.is_read_later ?? ArticleReadLaterStatus.UNSAVED,
  );

  useEffect(() => { setReadStatus(article.read_status); }, [article.read_status]);
  useEffect(() => { setStarred(article.starred); }, [article.starred]);
  useEffect(() => {
    setReadLater(article.is_read_later ?? ArticleReadLaterStatus.UNSAVED);
  }, [article.is_read_later]);

  const toggleStar = useCallback(() => {
    const next =
      starred === ArticleStarStatus.STARRED
        ? ArticleStarStatus.UNSTAR
        : ArticleStarStatus.STARRED;
    dataAgent.updateArticleStarStatus(article.uuid, next).then(() => {
      article.starred = next;
      setStarred(next);
      onStarChange?.({ ...article });
    });
  }, [starred, article, onStarChange]);

  const toggleRead = useCallback(() => {
    const next =
      readStatus === ArticleReadStatus.UNREAD
        ? ArticleReadStatus.READ
        : ArticleReadStatus.UNREAD;
    dataAgent.updateArticleReadStatus(article.uuid, next).then(() => {
      article.read_status = next;
      setReadStatus(next);
      onReadChange?.({ ...article });
    });
  }, [readStatus, article, onReadChange]);

  const toggleReadLater = useCallback(() => {
    const next =
      readLater === ArticleReadLaterStatus.SAVED
        ? ArticleReadLaterStatus.UNSAVED
        : ArticleReadLaterStatus.SAVED;
    dataAgent.updateArticleReadLaterStatus(article.uuid, next).then(() => {
      article.is_read_later = next;
      setReadLater(next);
    });
  }, [readLater, article]);

  const handleOpenBrowser = useCallback(() => {
    if (article.link) open(article.link);
  }, [article.link]);

  return (
    <>
      <ReaderControlBtn
        icon={Star}
        label={t(starred === ArticleStarStatus.STARRED ? "Unstar it" : "Star it")}
        active={starred === ArticleStarStatus.STARRED}
        activeClass="text-amber-500"
        onClick={toggleStar}
      />
      <ReaderControlBtn
        icon={readStatus === ArticleReadStatus.READ ? EyeOff : Eye}
        label={t(
          readStatus === ArticleReadStatus.READ ? "Mark as unread" : "Mark as read",
        )}
        onClick={toggleRead}
      />
      {showReadLater && (
        <ReaderControlBtn
          icon={Bookmark}
          label={t(
            readLater === ArticleReadLaterStatus.SAVED
              ? "article.actions.remove_read_later"
              : "article.actions.read_later",
          )}
          active={readLater === ArticleReadLaterStatus.SAVED}
          onClick={toggleReadLater}
        />
      )}
      {showBrowser && (
        <ReaderControlBtn
          icon={ExternalLink}
          label={t("Open in browser")}
          disabled={!article.link}
          onClick={handleOpenBrowser}
        />
      )}
    </>
  );
}
