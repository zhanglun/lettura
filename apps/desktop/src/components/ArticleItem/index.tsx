import { IconButton } from "@astryxdesign/core/IconButton";
import clsx from "clsx";
import { CheckCheck, Star } from "lucide-react";
import React, { type ForwardedRef, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { RouteConfig } from "@/config";
import type { ArticleResItem } from "@/db";
import {
  formatDuration,
  pickDuration,
  pickThumbUrl,
} from "@/helpers/articleContent";
import { formatRelative } from "@/helpers/feedMeta";
import { apiPost } from "@/helpers/http";
import { getCarrier } from "@/helpers/mediaType";
import { useAppStore } from "@/stores";
import { ArticleReadStatus, ArticleStarStatus } from "@/typing";

/** 行首缩略图：内容首图（feed 自带）> feed 图标 > 安静类型色块 + 源题首字符。
 *  视频行走加宽 16:9 变体并叠时长角标（.fusion-thumb.vid）。 */
export function RowThumb({ article }: { article: ArticleResItem }) {
  const [imgError, setImgError] = useState(false);
  const thumbUrl = useMemo(() => pickThumbUrl(article), [article]);
  const carrier = getCarrier(article);
  const duration = useMemo(() => pickDuration(article), [article]);
  const tint = carrier === "audio" ? "pod" : carrier === "video" ? "vid" : "";
  const isVideoRow = carrier === "video" && !!thumbUrl && !imgError;

  if (thumbUrl && !imgError) {
    return (
      <span className={clsx("fusion-thumb", isVideoRow && "vid", tint)}>
        <img
          src={thumbUrl}
          alt=""
          loading="lazy"
          onError={() => setImgError(true)}
        />
        {isVideoRow && duration != null && (
          <span className="fusion-thumb-dur">{formatDuration(duration)}</span>
        )}
      </span>
    );
  }

  if (article.feed_logo) {
    return (
      <span className="fusion-thumb">
        <img
          className="fl"
          src={article.feed_logo}
          alt=""
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </span>
    );
  }

  // 无图无图标的安静占位：类型色块 + 源题首字符（空灰块读作坏图）。
  // 首字符取字母/汉字等可见字形，跳过 emoji/零宽字符一类的不可见开头
  const pool = article.feed_title || article.title || "";
  const initial = pool.match(
    /[0-9A-Za-z\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/,
  );
  return (
    <span className={clsx("fusion-thumb", tint)}>
      <span className="tch">{initial ? initial[0].toUpperCase() : "·"}</span>
    </span>
  );
}

export const ArticleItem = React.forwardRef(
  (
    props: {
      article: ArticleResItem;
      focused?: boolean;
      onRead?: (article: ArticleResItem) => void;
      onExpand?: (article: ArticleResItem) => void;
      onUpdate?: (patch: Partial<ArticleResItem>) => void;
    },
    ref: ForwardedRef<HTMLDivElement>,
  ) => {
    const store = useAppStore(
      useShallow((state) => ({
        updateArticleStatus: state.updateArticleStatus,
        article: state.article,
        setArticle: state.setArticle,
        expandedArticleUuid: state.expandedArticleUuid,
      })),
    );
    const { article, focused, onRead, onExpand, onUpdate } = props;
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [readStatus, setReadStatus] = useState(article.read_status);
    const [starred, setStarred] = useState(article.starred);

    const markAsRead = (article: ArticleResItem) => {
      if (article.read_status === ArticleReadStatus.UNREAD) {
        setReadStatus(ArticleReadStatus.READ);
        onRead?.({ ...article, read_status: ArticleReadStatus.READ });
      }
      store.updateArticleStatus({ ...article }, ArticleReadStatus.READ);
    };

    const updateCurrentArticle = (article: ArticleResItem) => {
      markAsRead(article);
      store.setArticle({ ...article, read_status: ArticleReadStatus.READ });

      if (article.feed_uuid && article.id) {
        navigate(
          RouteConfig.LOCAL_ARTICLE.replace(":uuid", article.feed_uuid).replace(
            ":id",
            String(article.id),
          ),
        );
      }
    };

    const handleClick = () => {
      if (onExpand) {
        markAsRead(article);
        onExpand(article);
      } else {
        updateCurrentArticle(article);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    };

    const timeLabel = formatRelative(
      new Date(article.pub_date || article.create_date),
      { includeSeconds: true },
    );
    // 视频行元信息第二行：时长（媒体附件给出时），替代纯文字行的空缺
    const duration = pickDuration(article);

    useEffect(() => {
      setReadStatus(article.read_status);
    }, [article.read_status]);

    useEffect(() => {
      setStarred(article.starred);
    }, [article.starred]);

    return (
      <div
        className={clsx(
          "fusion-row",
          readStatus === ArticleReadStatus.READ && "is-read",
          focused && "is-focused",
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        ref={ref}
        id={article.uuid}
      >
        <span className="fusion-st">
          <span className="fusion-dot" />
        </span>
        <RowThumb article={article} />
        <span className="fusion-title">{article.title}</span>
        <span className="fusion-src">
          {article.feed_logo && (
            <img
              className="fusion-ficon"
              src={article.feed_logo}
              alt=""
              loading="lazy"
            />
          )}
          <span className="fn">{article.feed_title}</span>
          {getCarrier(article) === "video" && duration != null && (
            <span className="fusion-src-dur">{formatDuration(duration)}</span>
          )}
        </span>
        <span className="fusion-date">{timeLabel}</span>
        <span className="fusion-acts">
          <IconButton
            size="sm"
            variant="ghost"
            icon={
              <Star
                size={12}
                fill={
                  starred === ArticleStarStatus.STARRED
                    ? "currentColor"
                    : "none"
                }
              />
            }
            label={t("Star it")}
            className={clsx(starred === ArticleStarStatus.STARRED && "is-on")}
            style={
              starred === ArticleStarStatus.STARRED
                ? { color: "var(--fusion-amber)" }
                : undefined
            }
            onClick={(e) => {
              e.stopPropagation();
              const next =
                starred === ArticleStarStatus.STARRED
                  ? ArticleStarStatus.UNSTAR
                  : ArticleStarStatus.STARRED;
              apiPost(`/articles/${article.uuid}/star`, { starred: next }).then(
                () => {
                  setStarred(next);
                  onUpdate?.({ starred: next });
                },
              );
            }}
          />
          {readStatus === ArticleReadStatus.UNREAD && (
            <IconButton
              size="sm"
              variant="ghost"
              icon={<CheckCheck size={12} />}
              label={t("Mark as read")}
              onClick={(e) => {
                e.stopPropagation();
                markAsRead(article);
              }}
            />
          )}
        </span>
      </div>
    );
  },
);
