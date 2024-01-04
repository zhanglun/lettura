import { TooltipBox } from "@/components/TooltipBox";
import { Icon } from "@/components/Icon";
import { CheckCircle2, Circle, Star } from "lucide-react";
import { ArticleReadStatus, ArticleStarStatus } from "@/typing";
import React, { useEffect, useState } from "react";
import { ArticleResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";

export interface StarAndReadProps {
  article: ArticleResItem,
}

export function StarAndRead(props: StarAndReadProps) {
  const { article } = props;
  const [ readStatus, setReadStatus ] = useState<number>();
  const [ starred, setStarred ] = useState<number>();

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
    setReadStatus(article.read_status)
  }, [ article.read_status ])

  useEffect(() => {
    setStarred(article.starred)
  }, [ article.starred ])

  return <>
    { article.starred === ArticleStarStatus.UNSTAR && (
      <TooltipBox content="Star it">
        <Icon className="w-7 h-7" onClick={ (e: React.MouseEvent<HTMLElement>) => {
          e.stopPropagation();
          toggleStarStatus();
        } }>
          <Star size={ 16 }/>
        </Icon>
      </TooltipBox>
    ) }
    { article.starred === ArticleStarStatus.STARRED && (
      <TooltipBox content="Star it">
        <Icon className="w-7 h-7 text-[#fe9e2b] hover:text-[#fe9e2b]" onClick={ (e: React.MouseEvent<HTMLElement>) => {
          e.stopPropagation();
          toggleStarStatus();
        } }>
          <Star size={ 16 } fill={ "currentColor" }/>
        </Icon>
      </TooltipBox>
    ) }
    { article.read_status === ArticleReadStatus.UNREAD && (
      <TooltipBox content="Mark as read">
        <Icon
          className="w-7 h-7"
          onClick={ (e: React.MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            toggleReadStatus();
          } }
        >
          <Circle size={ 16 }/>
        </Icon>
      </TooltipBox>
    ) }
    { article.read_status === ArticleReadStatus.READ && (
      <TooltipBox content="Mark as unread">
        <Icon
          className="w-7 h-7"
          onClick={ (e: React.MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            toggleReadStatus();
          } }
        >
          <CheckCircle2 size={ 16 }/>
        </Icon>
      </TooltipBox>
    ) }
  </>
}
