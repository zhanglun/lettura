import React, { useEffect } from 'react';
import { useBearStore } from "@/hooks/useBearStore";
import { Article } from "@/db";

export interface UseAutoScrollProps {
  listRef?: any,
}

export const useAutoScroll = (props: UseAutoScrollProps) => {
  const { listRef } = props;
  const store = useBearStore(state => ({
    articleList: state.articleList,
  }));

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
    // watch current idx change
    const unsub2 = useBearStore.subscribe(
      (state) => state.currentIdx,
      (idx, previousIdx) => {
        if (idx <= previousIdx) {
          console.log("往上", store.articleList[idx]);
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
}
