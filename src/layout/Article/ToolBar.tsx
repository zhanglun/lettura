import React, { useEffect } from "react";
import { Icon } from "@/components/Icon";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useBearStore } from "@/stores";
import { TooltipBox } from "@/components/TooltipBox";

export interface NavigatorProps {
  listRef?: any;
}

export const ToolbarItemNavigator = (props: NavigatorProps) => {
  const store = useBearStore((state) => ({
    articleList: state.articleList,
    goPreviousArticle: state.goPreviousArticle,
    goNextArticle: state.goNextArticle,
    currentIdx: state.currentIdx,
  }));

  const { currentIdx } = store;

  const handleViewPrevious = () => {
    store.goPreviousArticle();
  };

  const handleViewNext = () => {
    store.goNextArticle();
  };

  return (
    <>
      <TooltipBox content="Previous article">
        <Icon disable={currentIdx <= 0} onClick={handleViewPrevious}>
          <ChevronUp size={16} />
        </Icon>
      </TooltipBox>
      <TooltipBox content="Next article">
        <Icon
          disable={currentIdx >= store.articleList.length - 1}
          onClick={handleViewNext}
        >
          <ChevronDown size={16} />
        </Icon>
      </TooltipBox>
    </>
  );
};
