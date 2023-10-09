import update from "immutability-helper";
import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { SubscribeItem } from "./SubscribeItem";
import { useBearStore } from "@/stores";
import { FeedResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { ItemView } from "./ItemView";
import {
  adjustedTargetIndex,
  findFolderAndIndex,
  findItemDeep,
  getParent,
  removeItem,
} from "./utilities";

export interface ContainerState {
  feeds: FeedResItem[];
}

export interface TreeItem {
  uuid: string;
  data: FeedResItem;
  children: FeedResItem[];
}

export const List = () => {
  const store = useBearStore((state) => ({
    getFeedList: state.getFeedList,
    feedList: state.feedList,
    feed: state.feed,
  }));
  const [feeds, setFeeds] = useState<FeedResItem[]>([]);
  const moveItem = useCallback(
    (
      dragItem: FeedResItem,
      dropResult: FeedResItem,
      position: string | null
    ) => {
      const dragUuid = dragItem.uuid;
      const dropUuid = dropResult.uuid;
      let list = [...feeds];
      let dragIndex = feeds.findIndex((item) => item.uuid === dragUuid);
      let dropIndex = feeds.findIndex((item) => item.uuid === dropUuid);

      const dragItemParent = getParent(list, dragUuid);
      const dropItemParent = getParent(list, dropUuid);

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
          feeds,
          dragItemParent.uuid
        );
        const [dropItemParentIndex] = findFolderAndIndex(
          feeds,
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
          feeds,
          dragItemParent.uuid
        );
        const [dropItemParentIndex] = findFolderAndIndex(
          feeds,
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
          !dropItemParent && dragItem.item_type === "channel" &&
          dropResult.item_type === "folder")
      ) {
        const [dropItemParentIndex] = findFolderAndIndex(
          feeds,
          dropItemParent?.uuid || dropResult.uuid
        );

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

        list[dropItemParentIndex] = dropItemParent || dropResult;
        list = update(list, {
          $splice: [
            [dragIndex, 1],
          ],
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

      setFeeds(() => list);

      return list;
    },
    [feeds]
  );

  const onSubscribeItemDrop = useCallback(
    (
      dragItem: FeedResItem,
      dropResult: FeedResItem,
      position: string | null
    ) => {
      let list = moveItem(dragItem, dropResult, position);
      requestUpdateOrder(list || []);
    },
    [feeds]
  );

  const requestUpdateOrder = (list: FeedResItem[]) => {
    console.log("%c Line:175 🍕 list", "color:#2eafb0", list);
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

    console.log("%c Line:55 🥚 body", "color:#ffdd4d", body);

    dataAgent.updateFeedSort(body).then((res) => {
      console.log("%c Line:47 🥔 res", "color:#b03734", res);
    });
  };

  const toggleFolder = (folderId: string) => {
    const newTreeData = [...feeds];
    const folder = findItemDeep(newTreeData, folderId);

    if (!folder || folder.item_type !== "folder") {
      return;
    }

    folder.is_expanded = !folder.is_expanded;

    setFeeds([...newTreeData]);
  };

  const renderFeed = useCallback(
    (feed: FeedResItem, index: number, level = 1) => {
      const isActive = store?.feed?.uuid === feed.uuid;
      return (
        <SubscribeItem
          key={feed.uuid}
          index={index}
          uuid={feed.uuid}
          text={feed.title}
          feed={{ ...feed }}
          isActive={isActive}
          onDrop={onSubscribeItemDrop}
        >
          <ItemView
            index={index}
            uuid={feed.uuid}
            level={level}
            text={feed.title}
            feed={{ ...feed }}
            isActive={isActive}
            isExpanded={feed.is_expanded || false}
            toggleFolder={toggleFolder}
          />
          {feed.children &&
            feed.children.map((child, idx) => {
              return renderFeed(child, idx, 2);
            })}
        </SubscribeItem>
      );
    },
    [feeds, store.feed]
  );

  useEffect(() => {
    setFeeds([...store.feedList]);
  }, [store.feedList]);

  return (
    <div>
      <div className="">{feeds.map((feed, i) => renderFeed(feed, i))}</div>
    </div>
  );
};
