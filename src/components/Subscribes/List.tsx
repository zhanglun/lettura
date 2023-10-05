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
import { useDrop } from "react-dnd";
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
      console.log(
        "🚀 ~ file: List.tsx:39 ~ List ~ dragItem.folder_uuid:",
        dragItem.folder_uuid
      );
      console.log("🚀 ~ file: List.tsx:32 ~ List ~ hoverItem:", hoverItem);
      console.log(
        "🚀 ~ file: List.tsx:32 ~ List ~ hoverItem.folder_uuid:",
        hoverItem?.folder_uuid
      );

      // when drag folder, just change position
      if (dragItem.item_type === "folder") {
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

          newFolder.is_expanded = true;

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
        } else if (!hoverItem?.folder_uuid) {
          // drag out from folder
          if (dragItem.folder_uuid) {
            const folderIndex = feeds.findIndex(
              (item) => item.uuid === dragItem.folder_uuid
            );
            const folder = feeds[folderIndex];
            const indexInFolder = folder.children.findIndex(
              (item) => item.uuid === dragUuid
            );

            dragItem.folder_uuid = "";

            let newFolder = update(
              { ...folder },
              {
                children: {
                  $splice: [[indexInFolder, 1]],
                },
              }
            );

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

  const onSubscribeItemDrop = useCallback(() => {
    requestUpdateOrder(feeds);
  }, [feeds]);

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

  const handleDropIntoFolder = useCallback(
    (index: number, dragItem: DragItem, dropItem: FeedResItem) => {
      return {
        index,
        ...dropItem,
      };
    },
    [feeds]
  );

  const toggleFolder = (folderId: string) => {
    const newTreeData = [...feeds];
    const folder = findItemDeep(newTreeData, folderId);

    if (!folder || folder.item_type !== "folder") {
      return;
    }

    folder.is_expanded = !folder.is_expanded;

    setFeeds([...newTreeData]);
  };

  const renderFeed = (
    feed: FeedResItem,
    index: number,
    isActive: boolean,
    level: number
  ) => {
    return (
      <SubscribeItem
        key={feed.uuid}
        index={index}
        uuid={feed.uuid}
        text={feed.title}
        feed={{ ...feed }}
        isActive={isActive}
        onMove={moveItem}
        onDrop={() => onSubscribeItemDrop()}
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
      </SubscribeItem>
    );
  };

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
            {feed.children && (
              <motion.div
                initial={{
                  height: feed.is_expanded ? 0 : "auto",
                  opacity: 0,
                }}
                animate={{
                  height: feed.is_expanded ? "auto" : 0,
                  opacity: 1,
                }}
                exit={{
                  height: "auto",
                  opacity: 0,
                }}
              >
                {feed.children.map((child, idx) => {
                  const isActive = store?.feed?.uuid === child.uuid;

                  return renderFeed(child, idx, isActive, 2);
                })}
              </motion.div>
            )}
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

  const [{ isOver, isOverCurrent }, drop] = useDrop(
    () => ({
      accept: [ItemTypes.BOX, ItemTypes.CARD],
      drop(_item: unknown, monitor) {
        const didDrop = monitor.didDrop();
        if (didDrop) {
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        isOverCurrent: monitor.isOver({ shallow: true }),
      }),
    }),
    []
  );

  let backgroundColor = "rgba(0, 0, 0, .5)";

  if (isOverCurrent || isOver) {
    backgroundColor = "darkgreen";
  }

  useEffect(() => {
    setFeeds(
      [...store.feedList].map((_) => {
        _.is_expanded = false;
        return _;
      })
    );
  }, [store.feedList]);

  return (
    <div ref={drop}>
      <div className="">{feeds.map((feed, i) => renderCard(feed, i))}</div>;
    </div>
  );
};
