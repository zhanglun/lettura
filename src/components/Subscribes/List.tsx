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
import { findItemDeep } from "./utilities";

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

  const moveCard = useCallback(
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
      console.log("🚀 ~ file: List.tsx:32 ~ List ~ hoverItem:", hoverItem);

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
          // newFolder = update(folder, {
          //   children: {
          //     $splice: [
          //       [indexInFolder, 1],
          //       [hoverIndex, 0, dragItem as FeedResItem],
          //     ],
          //   },
          // });
        } else {
          console.log("bu存在，直接插入");
          // newFolder = update(folder, {
          //   children: {
          //     $splice: [
          //       // [dragIndex, 1],
          //       [hoverIndex, 0, dragItem as FeedResItem],
          //     ],
          //   },
          // });
        }
      } else if (dragItem.folder_uuid) {

      }

      // TODO:
      // 1. feed to feed
      // 2. feed to folder
      // 3. folder to folder
      // 4. folder to feed

      // setFeeds((prevCards: FeedResItem[]) =>
      //   update(prevCards, {
      //     $splice: [
      //       [dragIndex, 1],
      //       [hoverIndex, 0, prevCards[dragIndex] as FeedResItem],
      //     ],
      //   })
      // );
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

  const moveIntoFolder = useCallback(
    (dragItem: DragItem, dropItem: DropItem) => {
      console.log("%c Line:114 🍷 feeds", "color:#ffdd4d", feeds);

      dropItem.children.push(dragItem);

      if (dropItem.uuid === dragItem.uuid || dragItem.item_type === "folder") {
        return dropItem;
      }

      const newlist = update(feeds, {
        $splice: [[dragItem.index, 1]],
        [dropItem.index]: {
          $set: { ...dropItem },
        },
      });
      console.log("%c Line:128 🍒 newlist", "color:#6ec1c2", newlist);

      setFeeds(newlist);

      requestUpdateOrder(newlist);
    },
    [feeds]
  );

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
        onMove={moveCard}
        onDrop={() => onSubscribeItemDrop()}
        onMoveIntoFolder={moveIntoFolder}
      >
        <ItemView
          index={index}
          uuid={feed.uuid}
          level={level}
          text={feed.title}
          feed={{ ...feed }}
          isActive={isActive}
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
            id={feed.uuid}
            feed={{ ...feed }}
            onDrop={(dragItem: DragItem) =>
              handleDropIntoFolder(index, dragItem, feed)
            }
            onMove={moveCard}
            key={index}
          >
            <ItemView
              index={index}
              uuid={feed.uuid}
              level={1}
              text={feed.title}
              feed={{ ...feed }}
              isActive={isActive}
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
    setFeeds([...store.feedList]);
  }, [store.feedList]);

  return (
    <div ref={drop}>
      <div className="">{feeds.map((feed, i) => renderCard(feed, i))}</div>;
    </div>
  );
};
