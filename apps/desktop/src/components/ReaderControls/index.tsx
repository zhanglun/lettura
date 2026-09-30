import { Button } from "@astryxdesign/core/Button";
import { Kbd } from "@astryxdesign/core/Kbd";
import { ToggleButton } from "@astryxdesign/core/ToggleButton";
import { open } from "@tauri-apps/plugin-shell";
import { Bookmark, ExternalLink, Eye, EyeOff, Star } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ArticleResItem } from "@/db";
import { apiPost } from "@/helpers/http";
import {
  ArticleReadLaterStatus,
  ArticleReadStatus,
  ArticleStarStatus,
} from "@/typing";

export interface ReaderControlsProps {
  article: ArticleResItem;
  showBrowser?: boolean;
  showReadLater?: boolean;
  onStarChange?: (updated: ArticleResItem) => void;
  onReadChange?: (updated: ArticleResItem) => void;
}

/** 操作后的本地乐观态（服务端确认前的按钮即显） */
type LocalState = {
  readStatus: ArticleReadStatus;
  starred: ArticleStarStatus;
  readLater: ArticleReadLaterStatus;
};

const localStateOf = (article: ArticleResItem): LocalState => ({
  readStatus: article.read_status,
  starred: article.starred,
  readLater: article.is_read_later ?? ArticleReadLaterStatus.UNSAVED,
});

export function ReaderControls({
  article,
  showBrowser = true,
  showReadLater = false,
  onStarChange,
  onReadChange,
}: ReaderControlsProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<LocalState>(() => localStateOf(article));
  const [lastArticle, setLastArticle] = useState(article);

  // 外部文章变化（切换文章或同对象字段被父级更新）时同步乐观态——
  // 渲染期调整（React 推荐写法），取代之前三个镜像 useEffect
  if (
    lastArticle !== article ||
    lastArticle.read_status !== article.read_status ||
    lastArticle.starred !== article.starred ||
    lastArticle.is_read_later !== article.is_read_later
  ) {
    setLastArticle(article);
    setState(localStateOf(article));
  }

  const { readStatus, starred, readLater } = state;

  const toggleStar = () => {
    const next =
      starred === ArticleStarStatus.STARRED
        ? ArticleStarStatus.UNSTAR
        : ArticleStarStatus.STARRED;
    setState((prev) => ({ ...prev, starred: next }));
    apiPost(`/articles/${article.uuid}/star`, { starred: next }).then(() => {
      onStarChange?.({ ...article, starred: next });
    });
  };

  const toggleRead = () => {
    const next =
      readStatus === ArticleReadStatus.UNREAD
        ? ArticleReadStatus.READ
        : ArticleReadStatus.UNREAD;
    setState((prev) => ({ ...prev, readStatus: next }));
    apiPost(`/articles/${article.uuid}/read`, { read_status: next }).then(
      () => {
        onReadChange?.({ ...article, read_status: next });
      },
    );
  };

  const toggleReadLater = () => {
    const next =
      readLater === ArticleReadLaterStatus.SAVED
        ? ArticleReadLaterStatus.UNSAVED
        : ArticleReadLaterStatus.SAVED;
    setState((prev) => ({ ...prev, readLater: next }));
    apiPost(`/articles/${article.uuid}/read-later`, {
      is_read_later: next,
    });
  };

  const handleOpenBrowser = () => {
    if (article.link) open(article.link);
  };

  return (
    <>
      {/* 阅读面顶栏动作：文案 + 快捷键（f 星标 / m 已读 / v 原文，键盘模型见 DESIGN） */}
      <ToggleButton
        size="sm"
        icon={<Star size={14} />}
        pressedIcon={
          <Star
            size={14}
            fill="currentColor"
            style={{ color: "var(--fusion-amber)" }}
          />
        }
        label={t(
          starred === ArticleStarStatus.STARRED ? "Unstar it" : "Star it",
        )}
        isPressed={starred === ArticleStarStatus.STARRED}
        onPressedChange={toggleStar}
      >
        <span className="fusion-act">
          {t(starred === ArticleStarStatus.STARRED ? "Unstar it" : "Star it")}
          <Kbd keys="f" />
        </span>
      </ToggleButton>
      <ToggleButton
        size="sm"
        icon={
          readStatus === ArticleReadStatus.READ ? (
            <EyeOff size={14} />
          ) : (
            <Eye size={14} />
          )
        }
        label={t(
          readStatus === ArticleReadStatus.READ
            ? "Mark as unread"
            : "Mark as read",
        )}
        isPressed={readStatus === ArticleReadStatus.READ}
        onPressedChange={toggleRead}
      >
        <span className="fusion-act">
          {t(
            readStatus === ArticleReadStatus.READ
              ? "Mark as unread"
              : "Mark as read",
          )}
          <Kbd keys="m" />
        </span>
      </ToggleButton>
      {showReadLater && (
        <ToggleButton
          size="sm"
          icon={<Bookmark size={14} />}
          label={t(
            readLater === ArticleReadLaterStatus.SAVED
              ? "article.actions.remove_read_later"
              : "article.actions.read_later",
          )}
          isPressed={readLater === ArticleReadLaterStatus.SAVED}
          onPressedChange={toggleReadLater}
        >
          <span className="fusion-act">
            {t(
              readLater === ArticleReadLaterStatus.SAVED
                ? "article.actions.remove_read_later"
                : "article.actions.read_later",
            )}
          </span>
        </ToggleButton>
      )}
      {showBrowser && (
        <Button
          variant="ghost"
          size="sm"
          icon={<ExternalLink size={14} />}
          label={t("Open in browser")}
          endContent={<Kbd keys="v" />}
          isDisabled={!article.link}
          onClick={handleOpenBrowser}
        />
      )}
    </>
  );
}
