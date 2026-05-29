import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { FeedResItem } from "@/db";
import { FeedRow } from "./FeedRow";

interface FolderGroupProps {
  folder: FeedResItem;
  isCollapsed: boolean;
  onToggle: (uuid: string) => void;
  onFeedClick: (feed: FeedResItem) => void;
  onFeedContextMenu: (e: React.MouseEvent, feed: FeedResItem) => void;
  onFeedSync: (feed: FeedResItem) => void;
  onFeedDelete: (feed: FeedResItem) => void;
}

export const FolderGroup = React.memo(function FolderGroup({
  folder,
  isCollapsed,
  onToggle,
  onFeedClick,
  onFeedContextMenu,
  onFeedSync,
  onFeedDelete,
}: FolderGroupProps) {
  return (
    <div>
      <div
        className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-[var(--gray-a3)] text-sm font-medium"
        onClick={() => onToggle(folder.uuid)}
      >
        {isCollapsed ? (
          <ChevronRight size={14} className="text-[var(--gray-9)]" />
        ) : (
          <ChevronDown size={14} className="text-[var(--gray-9)]" />
        )}
        <span className="text-[var(--gray-12)]">{folder.title}</span>
        <span className="text-[var(--gray-9)] text-xs">
          · {folder.children?.length ?? 0} 源
        </span>
      </div>
      {!isCollapsed &&
        folder.children?.map((child) => (
          <FeedRow
            key={child.uuid}
            feed={child}
            onClick={onFeedClick}
            onContextMenu={onFeedContextMenu}
            onSync={onFeedSync}
            onDelete={onFeedDelete}
          />
        ))}
    </div>
  );
});
