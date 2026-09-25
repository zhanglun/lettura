import React, { ForwardedRef, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useBearStore } from "@/stores";
import { ArticleResItem } from "@/db";
import { ArticleReadStatus, ArticleStarStatus } from "@/typing";
import clsx from "clsx";
import { useShallow } from "zustand/react/shallow";
import { RouteConfig } from "@/config";
import { Star, CheckCheck } from "lucide-react";
import * as dataAgent from "@/helpers/dataAgent";
import { useTranslation } from "react-i18next";
import { getCarrier } from "@/helpers/mediaType";
import { pickThumbUrl } from "@/helpers/articleContent";

/** 行首缩略图：内容首图（feed 自带）> feed 图标 > 安静类型色块（无字符） */
export function RowThumb({ article }: { article: ArticleResItem }) {
  const [imgError, setImgError] = useState(false);
  const thumbUrl = useMemo(() => pickThumbUrl(article), [article]);
  const carrier = getCarrier(article);
  const tint = carrier === "audio" ? "pod" : carrier === "video" ? "bil" : "";

  if (thumbUrl && !imgError) {
    return (
      <span className={clsx("fusion-thumb", tint)}>
        <img
          src={thumbUrl}
          alt=""
          loading="lazy"
          onError={() => setImgError(true)}
        />
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

  return <span className={clsx("fusion-thumb", tint)} />;
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
    const store = useBearStore(
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

    const timeLabel = formatDistanceToNow(
      new Date(article.pub_date || article.create_date),
      { includeSeconds: true, addSuffix: true },
    );

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
            <img className="fusion-ficon" src={article.feed_logo} alt="" loading="lazy" />
          )}
          <span className="fn">{article.feed_title}</span>
        </span>
        <span className="fusion-date">{timeLabel}</span>
        <span className="fusion-acts">
          <button
            type="button"
            className={clsx(
              "fusion-act-btn",
              starred === ArticleStarStatus.STARRED && "is-on",
            )}
            style={
              starred === ArticleStarStatus.STARRED
                ? { color: "var(--fusion-amber)" }
                : undefined
            }
            title={t("Star it")}
            onClick={(e) => {
              e.stopPropagation();
              const next =
                starred === ArticleStarStatus.STARRED
                  ? ArticleStarStatus.UNSTAR
                  : ArticleStarStatus.STARRED;
              dataAgent.updateArticleStarStatus(article.uuid, next).then(() => {
                setStarred(next);
                onUpdate?.({ starred: next });
              });
            }}
          >
            <Star
              size={12}
              fill={starred === ArticleStarStatus.STARRED ? "currentColor" : "none"}
            />
          </button>
          <button
            type="button"
            className="fusion-act-btn"
            title={t("Mark as read")}
            onClick={(e) => {
              e.stopPropagation();
              markAsRead(article);
            }}
          >
            <CheckCheck size={12} />
          </button>
        </span>
      </div>
    );
  },
);
