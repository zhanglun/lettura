import { useCallback, useEffect, useState } from "react";
import { Star, Eye, EyeOff, ExternalLink, Bookmark } from "lucide-react";
import type { ArticleResItem } from "@/db";
import { ArticleReadLaterStatus, ArticleReadStatus, ArticleStarStatus } from "@/typing";
import * as dataAgent from "@/helpers/dataAgent";
import { open } from "@tauri-apps/plugin-shell";
import { useTranslation } from "react-i18next";
import { ToggleButton } from "@astryxdesign/core/ToggleButton";
import { IconButton } from "@astryxdesign/core/IconButton";

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
      {/* 阅读面顶栏动作 = 安静图标钮（detail.html .qa 语法）：isIconOnly + pressedIcon 换 outline/实心 */}
      <ToggleButton
        size="sm"
        isIconOnly
        icon={<Star size={14} />}
        pressedIcon={
          <Star size={14} fill="currentColor" style={{ color: "var(--fusion-amber)" }} />
        }
        label={t(starred === ArticleStarStatus.STARRED ? "Unstar it" : "Star it")}
        isPressed={starred === ArticleStarStatus.STARRED}
        onPressedChange={toggleStar}
      />
      <ToggleButton
        size="sm"
        isIconOnly
        icon={readStatus === ArticleReadStatus.READ ? <EyeOff size={14} /> : <Eye size={14} />}
        label={t(
          readStatus === ArticleReadStatus.READ ? "Mark as unread" : "Mark as read",
        )}
        isPressed={readStatus === ArticleReadStatus.READ}
        onPressedChange={toggleRead}
      />
      {showReadLater && (
        <ToggleButton
          size="sm"
          isIconOnly
          icon={<Bookmark size={14} />}
          label={t(
            readLater === ArticleReadLaterStatus.SAVED
              ? "article.actions.remove_read_later"
              : "article.actions.read_later",
          )}
          isPressed={readLater === ArticleReadLaterStatus.SAVED}
          onPressedChange={toggleReadLater}
        />
      )}
      {showBrowser && (
        <IconButton
          size="sm"
          variant="ghost"
          icon={<ExternalLink size={14} />}
          label={t("Open in browser")}
          isDisabled={!article.link}
          onClick={handleOpenBrowser}
        />
      )}
    </>
  );
}
