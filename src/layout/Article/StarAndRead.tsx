import { IconButton, Tooltip } from "@radix-ui/themes";
import { CheckCircle2, Circle, Star } from "lucide-react";
import { ArticleReadStatus, ArticleStarStatus } from "@/typing";
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

  useEffect(() => {
    setReadStatus(article.read_status);
  }, [article.read_status]);

  useEffect(() => {
    setStarred(article.starred);
  }, [article.starred]);

  return (
    <div className="flex items-center gap-4">
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
            <Circle size={16} />
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
            <CheckCircle2 size={16} />
          </IconButton>
        </Tooltip>
      )}
    </div>
  );
}
