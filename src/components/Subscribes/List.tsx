import update from "immutability-helper";
import {useCallback, useEffect, useState} from "react";
import {SubscribeItem} from "./SubscribeItem";
import {useBearStore} from "@/stores";
import {FeedResItem} from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import {
  adjustedTargetIndex,
  findFolderAndIndex,
  findItemDeep,
  getParent,
  removeItem,
  TreeItem,
} from "./utilities";

export const List = () => {
  const store = useBearStore((state) => ({
    getFeedList: state.getFeedList,
    feedList: state.feedList,
    feed: state.feed,
    openFolder: state.openFolder,
    closeFolder: state.closeFolder,
  }));
  const [treeData, setTreeData] = useState<TreeItem[]>([]);
  const moveItem = useCallback(
    (dragItem: TreeItem, dropResult: TreeItem, position: string | null) => {
      const dragUuid = dragItem.uuid;
      const dropUuid = dropResult.uuid;
      let list = [...treeData];
      let dragIndex = treeData.findIndex((item) => item.uuid === dragUuid);
      let dropIndex = treeData.findIndex((item) => item.uuid === dropUuid);

      const dragItemParent = getParent(list, dragUuid);
      const dropItemParent = getParent(list, dropUuid);

      if (dragUuid == dropUuid || dragUuid === dropItemParent?.uuid) {
        return false;
      }

      if (
        (dragItemParent && dropItemParent) ||
        (dragItemParent &&
          !dropItemParent &&
          dropResult.item_type === "folder" &&
          position === "middle")
      ) {
        // from folder to folder
        console.log("%c Line:58 🍑 from folder to folder", "color:#ffdd4d");
        const [dragItemParentIndex] = findFolderAndIndex(
          treeData,
          dragItemParent.uuid
        );
        const [dropItemParentIndex] = findFolderAndIndex(
          treeData,
          dropItemParent?.uuid || dropResult.uuid
        );

        dragItemParent.children = removeItem(dragItemParent.children, dragUuid);
        const indexInFolder = (dropItemParent || dropResult).children.findIndex(
          (item) => item.uuid === dragUuid
        );
        (dropItemParent || dropResult).children = update(
          (dropItemParent || dropResult).children,
          {
            $splice: [
              [indexInFolder, indexInFolder > -1 ? 1 : 0],
              [
                adjustedTargetIndex(dropIndex, indexInFolder, position),
                0,
                dragItem as FeedResItem,
              ],
            ],
          }
        );

        list[dragItemParentIndex] = dragItemParent;
        list[dropItemParentIndex] = dropItemParent || dropResult;
      } else if (dragItemParent && !dropItemParent) {
        // from folder to global
        const [dragItemParentIndex] = findFolderAndIndex(
          treeData,
          dragItemParent.uuid
        );
        const [dropItemParentIndex] = findFolderAndIndex(
          treeData,
          dropResult.uuid
        );

        dragItemParent.children = removeItem(dragItemParent.children, dragUuid);
        list[dragItemParentIndex] = dragItemParent;
        list = update(list, {
          $splice: [
            [
              adjustedTargetIndex(dropItemParentIndex, -1, position),
              0,
              dragItem,
            ],
          ],
        });
      } else if (
        (!dragItemParent && dropItemParent) ||
        (!dragItemParent &&
          !dropItemParent &&
          dragItem.item_type === "channel" &&
          dropResult.item_type === "folder")
      ) {
        const [dropItemParentIndex] = findFolderAndIndex(
          treeData,
          dropItemParent?.uuid || dropResult.uuid
        );

        const indexInFolder = (dropItemParent || dropResult).children.findIndex(
          (item) => item.uuid === dragUuid
        );

        dragItem.folder_uuid = dropItemParent?.uuid || dropResult.uuid;
        (dropItemParent || dropResult).children = update(
          (dropItemParent || dropResult).children,
          {
            $splice: [
              [indexInFolder, indexInFolder > -1 ? 1 : 0],
              [
                adjustedTargetIndex(dropIndex, indexInFolder, position),
                0,
                dragItem as FeedResItem,
              ],
            ],
          }
        );

        list[dropItemParentIndex] = dropItemParent || dropResult;
        list = update(list, {
          $splice: [[dragIndex, 1]],
        });
        // from global to folder
      } else if (!dragItemParent && !dropItemParent) {
        list = update(list, {
          $splice: [
            [dragIndex, 1],
            [adjustedTargetIndex(dropIndex, dragIndex, position), 0, dragItem],
          ],
        });
      }

      console.log("%c Line:225 🍧 list", "color:#2eafb0", list);

      setTreeData(() => list);

      return list;
    },
    [treeData]
  );

  const onSubscribeItemDrop = useCallback(
    (dragItem: TreeItem, dropResult: TreeItem, position: string | null) => {
      let list = moveItem(dragItem, dropResult, position);
      requestUpdateOrder(list || []);
    },
    [treeData]
  );

  const requestUpdateOrder = (list: FeedResItem[]) => {
    const body = list.reduce(
      (acu, feed, idx) => {
        let item = {
          item_type: feed.item_type,
          uuid: feed.uuid,
          folder_uuid: feed.item_type === "folder" ? feed.uuid : "",
          sort: idx,
        };

        acu.push({
          ...item,
        });

        if ((feed.children || []).length > 0) {
          feed.children.forEach((child, idx) => {
            item.uuid = child.uuid || "";
            item.item_type = child.item_type;
            item.sort = idx;
            (item.folder_uuid = feed.uuid),
              acu.push({
                ...item,
              });
          });
        }

        return acu;
      },
      [] as {
        item_type: string;
        uuid: string;
        folder_uuid: string;
        sort: number;
      }[]
    );

    dataAgent.updateFeedSort(body).then((res) => {
      console.log("%c Line:47 🥔 res", "color:#b03734", res);
    });
  };

  const toggleFolder = (folderId: string) => {
    const newTreeData = [...treeData];
    const folder = findItemDeep(newTreeData, folderId);

    if (!folder || folder.item_type !== "folder") {
      return;
    }

    folder.is_expanded = !folder.is_expanded;

    folder.is_expanded ? store.openFolder(folderId) : store.closeFolder(folderId);

    setTreeData([...newTreeData]);
  };

  const renderFeed = useCallback(
    (feed: TreeItem, index: number, level = 1) => {
      const isActive = store?.feed?.uuid === feed.uuid;
      return (
        <SubscribeItem
          key={feed.uuid}
          index={index}
          uuid={feed.uuid}
          text={feed.title}
          level={level}
          feed={{...feed}}
          isActive={isActive}
          isExpanded={feed.is_expanded}
          toggleFolder={toggleFolder}
          onDrop={onSubscribeItemDrop}
        >
          {feed.children &&
            feed.children.map((child, idx) => {
              return renderFeed(child as TreeItem, idx, 2);
            })}
        </SubscribeItem>
      );
    },
    [treeData, store.feed]
  );

  useEffect(() => {
    setTreeData([...store.feedList] as TreeItem[]);
  }, [store.feedList]);

  return (
    <div>
      <div className="">{treeData.map((feed, i) => renderFeed(feed, i))}</div>
    </div>
  );
};
