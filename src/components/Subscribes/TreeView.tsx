import React, { FC, useCallback, useEffect, useState } from "react";
import update from "immutability-helper";
import { TreeViewItem } from "./TreeViewItem";
import { FeedResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { useBearStore } from "@/stores";
import { DragItem, DropItem } from "./ItemTypes";
import { findItemDeep, removeItem } from "./utilities";

interface TreeItem extends FeedResItem {
  isExpanded?: boolean;
}

const TreeView = () => {
  const store = useBearStore((state) => ({
    getFeedList: state.getFeedList,
    feedList: state.feedList,
    feed: state.feed,
  }));
  const [feeds, setFeeds] = useState<FeedResItem[]>([]);

  const requestUpdateOrder = (list: FeedResItem[]) => {
    const body = list.reduce(
      (acu, feed, idx) => {
        let item = {
          item_type: feed.item_type,
          uuid: feed.uuid,
          folder_uuid: feed.item_type === "folder" ? feed.uuid : "",
          sort: idx,
        };

        if (feed.children.length > 0) {
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

  const hoverItem = useCallback(
    (
      [dragIndex, dragUuid, dragItem]: [
        dragIndex: number,
        uuid: string,
        dragItem: DragItem
      ],
      [hoverIndex, hoverUuid, dropResult]: [
        hoverIndex: number,
        uuid: string,
        dropResult: DropItem
      ]
    ) => {
      console.log("%c Line:65 🥪 dragIndex", "color:#ffdd4d", dragIndex);
      console.log("%c Line:65 🍿 dragItem", "color:#ea7e5c", dragItem);
      console.log("%c Line:67 🍔 hoverIndex", "color:#93c0a4", hoverIndex);
      console.log("%c Line:67 🍩 dropResult", "color:#4fff4B", dropResult);

      const hoverItem = findItemDeep(feeds, hoverUuid);

      if (hoverItem?.folder_uuid) {
        const folderIndex = feeds.findIndex(
          (item) => item.uuid === hoverItem.folder_uuid
        );
        const folder = feeds[folderIndex];

        console.log("%c Line:78 🍪 folder", "color:#93c0a4", folder);
        console.log("%c Line:78 🌰 folderIndex", "color:#ed9ec7", folderIndex);

        const indexInFolder = folder.children.findIndex(
          (item) => item.uuid === dragUuid
        );
        let newFolder = { ...folder };

        if (indexInFolder > -1) {
          console.log(
            "%c Line:95 🍅 indexInFolder",
            "color:#7f2b82",
            indexInFolder
          );
          console.log("已经存在，需要重新计算");
          newFolder = update(folder, {
            children: {
              $splice: [
                [indexInFolder, 1],
                [hoverIndex, 0, dragItem as FeedResItem],
              ],
            },
          });
        } else {
          console.log("bu存在，直接插入");
          newFolder = update(folder, {
            children: {
              $splice: [
                // [dragIndex, 1],
                [hoverIndex, 0, dragItem as FeedResItem],
              ],
            },
          });
        }

        // setFeeds((prevCards: FeedResItem[]) =>
        //   update(prevCards, {
        //     $splice: [
        //       [dragIndex, 1],
        //       [folderIndex, 1],
        //       [folderIndex, 1, newFolder],
        //     ],
        //   })
        // );
      } else {
        console.log("hover no folder");

        // setFeeds((prevCards: FeedResItem[]) =>
        //   update(prevCards, {
        //     $splice: [
        //       [dragIndex, 1],
        //       [hoverIndex, 0, prevCards[dragIndex] as FeedResItem],
        //     ],
        //   })
        // );
      }

      console.log("%c Line:75 🥛 hoverItem", "color:#ea7e5c", hoverItem);
    },
    [feeds]
  );

  const moveItem = useCallback(
    (
      [dragIndex, dragUuid, dragItem]: [
        dragIndex: number,
        uuid: string,
        dragItem: DragItem
      ],
      [hoverIndex, hoverUuid, dropResult]: [
        hoverIndex: number,
        uuid: string,
        dropResult: DropItem
      ]
    ) => {
      const hoverItem = findItemDeep(feeds, hoverUuid);
      console.log("🚀 ~ file: List.tsx:39 ~ List ~ dragItem:", dragItem);
      console.log("🚀 ~ file: List.tsx:39 ~ List ~ dragItem.folder_uuid:", dragItem.folder_uuid);
      console.log("🚀 ~ file: List.tsx:32 ~ List ~ hoverItem:", hoverItem);
      console.log("🚀 ~ file: List.tsx:32 ~ List ~ hoverItem.folder_uuid:", hoverItem?.folder_uuid);

      // when drag folder, just change position
      if (dragItem.item_type === 'folder') {
        setFeeds((prevCards: FeedResItem[]) =>
          update(prevCards, {
            $splice: [
              [dragIndex, 1],
              [hoverIndex, 0, prevCards[dragIndex] as FeedResItem],
            ],
          })
        );
      } else {
        // when drag to/in folder
        if (hoverItem?.folder_uuid) {
          const folderIndex = feeds.findIndex(
            (item) => item.uuid === hoverItem.folder_uuid
          );
          const folder = feeds[folderIndex];
          const indexInFolder = folder.children.findIndex(
            (item) => item.uuid === dragUuid
          );

          let newFolder = { ...folder };

          dragItem.folder_uuid = folder.uuid;

          // already in folder, change position
          if (indexInFolder > -1) {
            newFolder = update(folder, {
              children: {
                $splice: [
                  [indexInFolder, 1],
                  [hoverIndex, 0, dragItem as FeedResItem],
                ],
              },
            });

            setFeeds((prev: FeedResItem[]) =>
              update(prev, {
                $splice: [[folderIndex, 1, newFolder as FeedResItem]],
              })
            );
          } else {
            console.log('asdfasdfasdfsadf===>')
            newFolder = update(folder, {
              children: {
                $splice: [[hoverIndex, 0, dragItem as FeedResItem]],
              },
            });

            setFeeds((prev: FeedResItem[]) => {
              let list = removeItem([...prev], dragUuid);
              let folderIdx: number = folderIndex;
              // let removeIdx: number = dragIndex;

              // list.forEach((_, idx) => {
              //   if (_.uuid === dragUuid) {
              //     removeIdx = idx;
              //   }
              // });

              // if (removeIdx > -1) {
              //   list.splice(removeIdx, 1);
              // }

              list.forEach((_, idx) => {
                if (_.uuid === folder.uuid) {
                  folderIdx = idx;
                }
              });

              if (folderIdx > -1) {
                list[folderIdx] = newFolder;
              }

              return list;
            });
          }
        } else if (!hoverItem?.folder_uuid) { // drag out from folder
          if (dragItem.folder_uuid) {
            const folderIndex = feeds.findIndex(
              (item) => item.uuid === dragItem.folder_uuid
            );
            const folder = feeds[folderIndex];
            const indexInFolder = folder.children.findIndex(
              (item) => item.uuid === dragUuid
            );

            dragItem.folder_uuid = "";

            let newFolder = update({ ...folder }, {
              children: {
                $splice: [
                  [indexInFolder, 1],
                ]
              },
            });

            setFeeds((prev: FeedResItem[]) => {
              let list = [...prev];
              let folderIdx: number = folderIndex;

              list.splice(hoverIndex, 0, dragItem);

              list.forEach((_, idx) => {
                if (_.uuid === folder.uuid) {
                  folderIdx = idx;
                }
              });

              if (folderIdx > -1) {
                list[folderIdx] = newFolder;
              }

              return list;
            });
          } else {
            setFeeds((prevCards: FeedResItem[]) =>
              update(prevCards, {
                $splice: [
                  [dragIndex, 1],
                  [hoverIndex, 0, prevCards[dragIndex] as FeedResItem],
                ],
              })
            );
          }
        }
      }
    },
    [feeds]
  );

  const toggleFolder = (folderId: string) => {
    console.log("%c Line:115 🍓 folderId", "color:#ed9ec7", folderId);
    const newTreeData = [...feeds];
    const folder = findItem(newTreeData, folderId);

    if (!folder || folder.item_type !== "folder") {
      return;
    }

    folder.isExpanded = !folder.isExpanded;

    setFeeds([...newTreeData]);
  };

  const findItem = (
    items: TreeItem[],
    itemId: string
  ): TreeItem | undefined => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.uuid === itemId) {
        return item;
      }

      if (item.children) {
        const nestedItem = findItem(item.children, itemId);

        if (nestedItem) {
          return nestedItem;
        }
      }
    }

    return undefined;
  };

  const findParent = (
    items: TreeItem[],
    itemId: string
  ): TreeItem | undefined => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (
        item.children &&
        item.children.some((child) => child.uuid === itemId)
      ) {
        return item;
      }

      if (item.children) {
        const nestedItem = findParent(item.children, itemId);

        if (nestedItem) {
          return nestedItem;
        }
      }
    }

    return undefined;
  };

  const renderTreeItems = (items: TreeItem[], level = 0): JSX.Element[] => {
    return items.map((item, idx) => {
      const isActive = store?.feed?.uuid === item.uuid;
      const parent_uuid = item.uuid;

      return (
        <TreeViewItem
          key={item.uuid}
          uuid={item.uuid}
          title={item.title}
          index={idx}
          level={level + 1}
          feed={item}
          isActive={isActive}
          isExpanded={item.isExpanded || false}
          onMove={moveItem}
          toggleFolder={toggleFolder}
        >
          {item.children && renderTreeItems(item.children, level + 1)}
        </TreeViewItem>
      );
    });
  };

  useEffect(() => {
    setFeeds([...store.feedList]);
  }, [store.feedList]);

  return <div>{renderTreeItems(feeds)}</div>;
};

export default TreeView;
