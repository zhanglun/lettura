import { ChevronDown, ChevronUp } from "lucide-react";
import { useBearStore } from "@/stores";
import { IconButton, Tooltip } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";

export interface NavigatorProps {
  goNext: () => void;
  goPrev: () => void;
}

export const ToolbarItemNavigator = (props: NavigatorProps) => {
  const { t } = useTranslation();
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
      <Tooltip content={t("Previous article")}>
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
      <Tooltip content={t("Next article")}>
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
