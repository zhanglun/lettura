import React, { useEffect } from "react";
import { Icon } from "@/components/Icon";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useBearStore } from "@/stores";
import { TooltipBox } from "@/components/TooltipBox";

export interface NavigatorProps {
  goNext: () => void;
  goPrev: () => void;
}

export const ToolbarItemNavigator = (props: NavigatorProps) => {
  const store = useBearStore((state) => ({
    hasMoreNext: state.hasMoreNext,
    hasMorePrev: state.hasMorePrev,
  }));

  const handleViewPrevious = () => {
    props.goPrev();
  };

  const handleViewNext = () => {
    props.goNext();
  };

  return (
    <>
      <TooltipBox content="Previous article">
        <Icon disable={!store.hasMorePrev} onClick={handleViewPrevious}>
          <ChevronUp size={16} />
        </Icon>
      </TooltipBox>
      <TooltipBox content="Next article">
        <Icon disable={!store.hasMoreNext} onClick={handleViewNext}>
          <ChevronDown size={16} />
        </Icon>
      </TooltipBox>
    </>
  );
};
