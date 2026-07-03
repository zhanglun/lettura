import { ReaderControls, type ReaderControlsProps } from "@/components/ReaderControls";
import type { ArticleResItem } from "@/db";

export interface StarAndReadProps {
  article: ArticleResItem;
  onStarChange?: ReaderControlsProps["onStarChange"];
  onReadChange?: ReaderControlsProps["onReadChange"];
}

/** @deprecated Use ReaderControls directly. */
export function StarAndRead({ article, onStarChange, onReadChange }: StarAndReadProps) {
  return (
    <ReaderControls
      article={article}
      showBrowser={false}
      showReadLater
      onStarChange={onStarChange}
      onReadChange={onReadChange}
    />
  );
}
