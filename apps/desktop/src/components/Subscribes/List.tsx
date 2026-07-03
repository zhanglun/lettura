import { useEffect, useState } from "react";
import { SubscribeItem } from "./SubscribeItem";
import { useBearStore } from "@/stores";
import { findItemDeep, TreeItem } from "./utilities";
import { useShallow } from "zustand/react/shallow";

export const List = () => {
  const store = useBearStore(
    useShallow((state) => ({
      getSubscribes: state.getSubscribes,
      setSubscribes: state.setSubscribes,
      subscribes: state.subscribes,
      feed: state.feed,
      openFolder: state.openFolder,
      closeFolder: state.closeFolder,
    })),
  );
  const [treeData, setTreeData] = useState<TreeItem[]>([]);

  const toggleFolder = (folderId: string) => {
    const newTreeData = [...treeData];
    const folder = findItemDeep(newTreeData, folderId);

    if (!folder || folder.item_type !== "folder") {
      return;
    }

    folder.is_expanded = !folder.is_expanded;

    // setTreeData([...newTreeData]);

    folder.is_expanded
      ? store.openFolder(folderId)
      : store.closeFolder(folderId);
  };

  const renderList = () => {
    const renderFeed = (feed: TreeItem, index: number, level = 1) => {
      const isActive = store?.feed?.uuid === feed.uuid;

      return (
        <SubscribeItem
          key={feed.uuid}
          index={index}
          uuid={feed.uuid}
          text={feed.title}
          level={level}
          feed={{ ...feed }}
          isActive={isActive}
          isExpanded={feed.item_type === "folder" ? feed.is_expanded !== false : feed.is_expanded}
          toggleFolder={toggleFolder}
        >
          {feed.children?.map((child, idx) => {
            return renderFeed(child as TreeItem, idx, 2);
          })}
        </SubscribeItem>
      );
    };

    return treeData.map((feed, i) => renderFeed(feed, i));
  };

  useEffect(() => {
    setTreeData([...store.subscribes] as TreeItem[]);
  }, [store.subscribes]);

  return (
    <div>
      <div className="">{renderList()}</div>
    </div>
  );
};
