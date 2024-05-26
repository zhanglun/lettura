import React, { useEffect } from "react";
import { Icon } from "@/components/Icon";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useBearStore } from "@/stores";
import { IconButton, Tooltip } from "@radix-ui/themes";

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
      <Tooltip content="Previous article">
        <IconButton
          size="2"
          variant="ghost"
          color="gray"
          className="text-[var(--gray-12)]"
          disabled={!store.hasMorePrev}
          onClick={handleViewPrevious}
        >
          <ChevronUp size={16} />
        </IconButton>
      </Tooltip>
      <Tooltip content="Next article">
        <IconButton
          size="2"
          variant="ghost"
          color="gray"
          className="text-[var(--gray-12)]"
          disabled={!store.hasMoreNext}
          onClick={handleViewNext}
        >
          <ChevronDown size={16} />
        </IconButton>
      </Tooltip>
    </>
  );
};
