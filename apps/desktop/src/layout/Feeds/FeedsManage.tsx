import React, { useMemo, useState } from "react";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import type { FeedResItem } from "@/db";
import { FeedsToolbar } from "./FeedsToolbar";
import { FolderGroup } from "./FolderGroup";
import { FeedRow } from "./FeedRow";

interface FeedsManageProps {
  onFeedClick: (feed: FeedResItem) => void;
  onAddFeed: () => void;
  onAddFolder: () => void;
  onFeedContextMenu: (e: React.MouseEvent, feed: FeedResItem) => void;
  onFeedSync: (feed: FeedResItem) => void;
  onFeedDelete: (feed: FeedResItem) => void;
  onSyncAll: () => void;
  onMarkAllRead: () => void;
}

export const FeedsManage = React.memo(function FeedsManage({
  onFeedClick,
  onAddFeed,
  onAddFolder,
  onFeedContextMenu,
  onFeedSync,
  onFeedDelete,
  onSyncAll,
  onMarkAllRead,
}: FeedsManageProps) {
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(
    new Set(),
  );

  const store = useBearStore(
    useShallow((state) => ({
      subscribes: state.subscribes,
      feedsSearchQuery: state.feedsSearchQuery,
      setFeedsSearchQuery: state.setFeedsSearchQuery,
      folderFilter: state.folderFilter,
      globalSyncStatus: state.globalSyncStatus,
    })),
  );

  const filteredItems = useMemo(() => {
    const query = store.feedsSearchQuery.toLowerCase();
    const { subscribes, folderFilter } = store;

    return subscribes.filter((item) => {
      if (folderFilter && item.uuid !== folderFilter) return false;

      if (item.item_type === "folder") {
        if (!query) return true;
        const matchFolder = item.title.toLowerCase().includes(query);
        const matchChildren = item.children?.some(
          (child) =>
            child.title.toLowerCase().includes(query) ||
            child.link.toLowerCase().includes(query),
        );
        return matchFolder || matchChildren;
      }

      if (!query) return true;
      return (
        item.title.toLowerCase().includes(query) ||
        item.link.toLowerCase().includes(query)
      );
    });
  }, [store.feedsSearchQuery, store.subscribes, store.folderFilter]);

  const ungroupedFeeds = useMemo(() => {
    return filteredItems.filter((item) => item.item_type !== "folder");
  }, [filteredItems]);

  const folderItems = useMemo(() => {
    return filteredItems.filter((item) => item.item_type === "folder");
  }, [filteredItems]);

  const handleToggleFolder = (uuid: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FeedsToolbar
        searchQuery={store.feedsSearchQuery}
        onSearchChange={store.setFeedsSearchQuery}
        onAddFeed={onAddFeed}
        onAddFolder={onAddFolder}
        onSyncAll={onSyncAll}
        onMarkAllRead={onMarkAllRead}
        syncing={store.globalSyncStatus}
      />
      <div className="flex-1 overflow-y-auto">
        {folderItems.map((folder) => (
          <FolderGroup
            key={folder.uuid}
            folder={folder}
            isCollapsed={collapsedFolders.has(folder.uuid)}
            onToggle={handleToggleFolder}
            onFeedClick={onFeedClick}
            onFeedContextMenu={onFeedContextMenu}
            onFeedSync={onFeedSync}
            onFeedDelete={onFeedDelete}
          />
        ))}
        {ungroupedFeeds.map((feed) => (
          <FeedRow
            key={feed.uuid}
            feed={feed}
            onClick={onFeedClick}
            onContextMenu={onFeedContextMenu}
            onSync={onFeedSync}
            onDelete={onFeedDelete}
          />
        ))}
      </div>
    </div>
  );
});
