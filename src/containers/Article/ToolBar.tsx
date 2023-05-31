import React, { useEffect } from 'react';
import { Icon } from "@/components/Icon";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useBearStore } from "@/hooks/useBearStore";
import { Article } from "@/db";

export interface NavigatorProps {
  listRef?: any,
}

export const ToolbarItemNavigator = (props: NavigatorProps) => {
  const { listRef } = props;
  const store = useBearStore((state) => ({
    article: state.article,
    articleList: state.articleList,
    setArticle: state.setArticle,
    updateArticleAndIdx: state.updateArticleAndIdx,
    channel: state.channel,

    articleDialogViewStatus: state.articleDialogViewStatus,
    setArticleDialogViewStatus: state.setArticleDialogViewStatus,

    filterList: state.filterList,
    currentFilter: state.currentFilter,
    setFilter: state.setFilter,

    currentIdx: state.currentIdx,
    setCurrentIdx: state.setCurrentIdx,
    userConfig: state.userConfig
  }));

  const { currentIdx, setCurrentIdx } = store;


  const handleViewPrevious = () => {
    let cur = -1;

    if (currentIdx <= 0) {
      cur = 0;
    } else {
      cur = currentIdx - 1;
    }

    calculateItemPosition("up", store.articleList[cur] || null);

    store.updateArticleAndIdx(store.articleList[cur] || null, cur);
  };

  const handleViewNext = () => {
    let cur = -1;

    if (currentIdx < store.articleList.length - 1) {
      cur = currentIdx + 1;

      calculateItemPosition("down", store.articleList[cur] || null);

      store.updateArticleAndIdx(store.articleList[cur] || null, cur);
    }
  };

  function calculateItemPosition(
    direction: "up" | "down",
    article: Article | null
  ) {
    if (!article || !article.uuid) {
      return;
    }

    const $li = document.getElementById(article.uuid);
    const bounding = $li?.getBoundingClientRect();
    const winH = window.innerHeight;

    if (
      (direction === "up" || direction === "down") &&
      bounding &&
      bounding.top < 58
    ) {
      const offset = 58 - bounding.top;
      const scrollTop = (listRef?.current?.scrollTop || 0) - offset;

      listRef?.current?.scrollTo(0, scrollTop);
    } else if (
      (direction === "up" || direction === "down") &&
      bounding &&
      bounding.bottom > winH
    ) {
      const offset = bounding.bottom - winH;
      const scrollTop = (listRef?.current?.scrollTop || 0) + offset;

      console.log(
        "🚀 ~ file: index.tsx:324 ~ ArticleContainer ~ scrollTop:",
        scrollTop
      );
      listRef?.current?.scrollTo(0, scrollTop);
    }
  }

  useEffect(() => {
    const unsub2 = useBearStore.subscribe(
      (state) => state.currentIdx,
      (idx, previousIdx) => {
        if (idx <= previousIdx) {
          calculateItemPosition("up", store.articleList[idx]);
        } else {
          console.log("往下", store.articleList[idx]);
          calculateItemPosition("down", store.articleList[idx]);
        }
      }
    );

    return () => {
      console.log("clean!!!!");
      unsub2();
    };
  }, [ store.articleList ]);

  return <>
    <Icon disable={ currentIdx <= 0 } onClick={ handleViewPrevious }>
      <ChevronUp size={ 16 }/>
    </Icon>
    <Icon
      disable={ currentIdx >= store.articleList.length - 1 }
      onClick={ handleViewNext }
    >
      <ChevronDown size={ 16 }/>
    </Icon>
  </>
}
