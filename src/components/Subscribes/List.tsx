import update from "immutability-helper";
import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { SubscribeItem } from "./SubscribeItem";
import { useBearStore } from "@/stores";
import { FeedResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { Folder } from "./Folder";
import { ItemView } from "./ItemView";
import { DragItem, DropItem, ItemTypes } from "./ItemTypes";
import { findItemDeep, removeItem } from "./utilities";
import { motion } from "framer-motion";

export interface ContainerState {
  feeds: FeedResItem[];
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

      let dragIndex = feeds.findIndex((item) => item.uuid === dragItem.uuid);
      let dropIndex = feeds.findIndex((item) => item.uuid === dropResult.uuid);

      // when drag folder, just change position
      if (dragItem.item_type === "folder") {
        if (position === "middle") {
          return;
        }

        list = update(list, {
          $splice: [
            [dragIndex, 1],
            [dropIndex + (position === "top" ? 0 : 1), 0, dragItem],
          ],
        });
      } else {
        // when drag to/in folder
        if (dropResult?.folder_uuid) {
          const folderIndex = feeds.findIndex(
            (item) => item.uuid === dropResult.folder_uuid
          );
          const folder = feeds[folderIndex];
          const indexInFolder = folder.children.findIndex(
            (item) => item.uuid === dragUuid
          );

          let newFolder = { ...folder };

          dragItem.folder_uuid = folder.uuid;

          dropIndex = folder.children.findIndex(
            (item) => item.uuid === dropUuid
          );

          // already in folder, change position
          if (indexInFolder > -1) {
            newFolder = update(folder, {
              children: {
                $splice: [
                  [indexInFolder, 1],
                  [dropIndex, 0, dragItem as FeedResItem],
                ],
              },
            });

            list = update(list, {
              $splice: [[folderIndex, 1, newFolder as FeedResItem]],
            });
          } else {
            newFolder = update(folder, {
              children: {
                $splice: [[dropIndex, 0, dragItem as FeedResItem]],
              },
            });

            list = removeItem(list, dragUuid);
            let folderIdx: number = folderIndex;

            list.forEach((_, idx) => {
              if (_.uuid === folder.uuid) {
                folderIdx = idx;
              }
            });

            if (folderIdx > -1) {
              list[folderIdx] = newFolder;
            }
          }
        } else if (!dropResult?.folder_uuid) {
          // drag out from folder
          if (dragItem.folder_uuid) {
            const folderIndex = feeds.findIndex(
              (item) => item.uuid === dragItem.folder_uuid
            );
            const folder = feeds[folderIndex];
            const indexInFolder = folder.children.findIndex(
              (item) => item.uuid === dragUuid
            );
            dropIndex = feeds.findIndex((item) => item.uuid === dropUuid);
            console.log("%c Line:142 🍇 dropIndex", "color:#ed9ec7", dropIndex);

            dragItem.folder_uuid = "";

            let newFolder = update(
              { ...folder },
              {
                children: {
                  $splice: [[indexInFolder, 1]],
                },
              }
            );

            list = update(list, {
              $splice: [
                [dropIndex + (position === "top" ? 0 : 1), 0, dragItem],
              ],
            });
            let folderIdx: number = folderIndex;

            list.forEach((_, idx) => {
              if (_.uuid === folder.uuid) {
                folderIdx = idx;
              }
            });

            if (folderIdx > -1) {
              list[folderIdx] = newFolder;
            }
          } else {
            list = update(list, {
              $splice: [
                [dragIndex, 1],
                [dropIndex + (position === "top" ? 0 : 1), 0, dragItem],
              ],
            });
          }
        }
      }

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

        if ((feed.children || []).length > 0) {
          feed.children.forEach((child) => {
            item.uuid = child.uuid || "";
            (item.folder_uuid = feed.uuid),
              acu.push({
                ...item,
              });
          });
        } else {
          acu.push({
            ...item,
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

  const renderCard = useCallback(
    (feed: FeedResItem, index: number) => {
      const isActive = store?.feed?.uuid === feed.uuid;

      if (feed.item_type === "channel") {
        return renderFeed(feed, index, isActive, 1);
      } else {
        return (
          <Folder
            index={index}
            uuid={feed.uuid}
            feed={{ ...feed }}
            isExpanded={feed.is_expanded || false}
            onDrop={() => onSubscribeItemDrop()}
            // onDrop={(dragItem: DragItem) =>
            //   handleDropIntoFolder(index, dragItem, feed)
            // }
            onMove={moveItem}
            key={index}
          >
            <ItemView
              index={index}
              uuid={feed.uuid}
              level={1}
              text={feed.title}
              feed={{ ...feed }}
              isActive={isActive}
              isExpanded={feed.is_expanded || false}
              toggleFolder={toggleFolder}
            />
            {feed.children &&
              feed.children.map((child, idx) => {
                const isActive = store?.feed?.uuid === child.uuid;

                return renderFeed(child, idx, isActive, 2);
              })}
          </Folder>
        );
      }
    },
    [feeds, store.feed]
  );

  function getStyle(backgroundColor: string): CSSProperties {
    return {
      backgroundColor,
    };
  }

  useEffect(() => {
    setFeeds([...store.feedList]);
  }, [store.feedList]);

  return (
    <div>
      <div className="">{feeds.map((feed, i) => renderFeed(feed, i))}</div>
    </div>
  );
};
