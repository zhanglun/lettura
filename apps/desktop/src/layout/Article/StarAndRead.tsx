import { IconButton, Tooltip } from "@radix-ui/themes";
import { Bookmark, Eye, EyeOff, Star } from "lucide-react";
import {
  ArticleReadLaterStatus,
  ArticleReadStatus,
  ArticleStarStatus,
} from "@/typing";
import React, { useEffect, useState } from "react";
import { ArticleResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { useTranslation } from "react-i18next";

export interface StarAndReadProps {
  article: ArticleResItem;
}

export function StarAndRead(props: StarAndReadProps) {
  const { article } = props;
  const { t } = useTranslation();
  const [readStatus, setReadStatus] = useState<number>();
  const [starred, setStarred] = useState<number>();
  const [readLater, setReadLater] = useState<number>();

  function toggleReadStatus() {
    let newStatus: number = 1;

    if (readStatus === ArticleReadStatus.UNREAD) {
      newStatus = ArticleReadStatus.READ;
    } else {
      newStatus = ArticleReadStatus.UNREAD;
    }

    dataAgent.updateArticleReadStatus(article.uuid, newStatus).then(() => {
      article.read_status = newStatus;
      setReadStatus(newStatus);
    });
  }

  function toggleStarStatus() {
    let newStarrStatus: number = 1;

    if (starred === ArticleStarStatus.UNSTAR) {
      newStarrStatus = ArticleStarStatus.STARRED;
    } else {
      newStarrStatus = ArticleStarStatus.UNSTAR;
    }

    dataAgent.updateArticleStarStatus(article.uuid, newStarrStatus).then(() => {
      article.starred = newStarrStatus;
      setStarred(newStarrStatus);
    });
  }

  function toggleReadLaterStatus() {
    const nextStatus =
      readLater === ArticleReadLaterStatus.SAVED
        ? ArticleReadLaterStatus.UNSAVED
        : ArticleReadLaterStatus.SAVED;

    dataAgent.updateArticleReadLaterStatus(article.uuid, nextStatus).then(() => {
      article.is_read_later = nextStatus;
      setReadLater(nextStatus);
    });
  }

  useEffect(() => {
    setReadStatus(article.read_status);
  }, [article.read_status]);

  useEffect(() => {
    setStarred(article.starred);
  }, [article.starred]);

  useEffect(() => {
    setReadLater(article.is_read_later ?? ArticleReadLaterStatus.UNSAVED);
  }, [article.is_read_later]);

  return (
    <div className="flex items-center gap-1">
      {article.starred === ArticleStarStatus.UNSTAR && (
        <Tooltip content={t("Star it")}>
          <IconButton
            variant="ghost"
            size="2"
            color="gray"
            className="text-[var(--gray-12)]"
            onClick={(e: React.MouseEvent<HTMLElement>) => {
              e.stopPropagation();
              toggleStarStatus();
            }}
          >
            <Star size={16} />
          </IconButton>
        </Tooltip>
      )}
      {article.starred === ArticleStarStatus.STARRED && (
        <Tooltip content={t("Unstar it")}>
          <IconButton
            variant="ghost"
            size="2"
            className="!text-[#fe9e2b] !hover:text-[#fe9e2b]"
            color="gray"
            onClick={(e: React.MouseEvent<HTMLElement>) => {
              e.stopPropagation();
              toggleStarStatus();
            }}
          >
            <Star size={16} fill={"currentColor"} />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip
        content={
          readLater === ArticleReadLaterStatus.SAVED
            ? t("article.actions.remove_read_later")
            : t("article.actions.read_later")
        }
      >
        <IconButton
          variant="ghost"
          size="2"
          color="gray"
          className={
            readLater === ArticleReadLaterStatus.SAVED
              ? "!text-[var(--accent-9)]"
              : "text-[var(--gray-12)]"
          }
          onClick={(e: React.MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            toggleReadLaterStatus();
          }}
        >
          <Bookmark
            size={16}
            fill={
              readLater === ArticleReadLaterStatus.SAVED
                ? "currentColor"
                : "none"
            }
          />
        </IconButton>
      </Tooltip>
      {article.read_status === ArticleReadStatus.UNREAD && (
        <Tooltip content={t("Mark as read")}>
          <IconButton
            variant="ghost"
            size="2"
            color="gray"
            className="text-[var(--gray-12)]"
            onClick={(e: React.MouseEvent<HTMLElement>) => {
              e.stopPropagation();
              toggleReadStatus();
            }}
          >
            <Eye size={16} />
          </IconButton>
        </Tooltip>
      )}
      {article.read_status === ArticleReadStatus.READ && (
        <Tooltip content={t("Mark as unread")}>
          <IconButton
            variant="ghost"
            size="2"
            onClick={(e: React.MouseEvent<HTMLElement>) => {
              e.stopPropagation();
              toggleReadStatus();
            }}
          >
            <EyeOff size={16} />
          </IconButton>
        </Tooltip>
      )}
    </div>
  );
}
