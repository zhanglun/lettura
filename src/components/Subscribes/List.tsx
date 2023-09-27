import update from "immutability-helper";
import { useCallback, useEffect, useState } from "react";
import { SubscribeItem } from "./SubscribeItem";
import { useBearStore } from "@/stores";
import { FeedResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { Folder } from "./Folder";
import { ItemView } from "./ItemView";
import { DragItem, DropItem } from "./ItemTypes";

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
      [dragIndex, dragItem]: [dragIndex: number, dragItem: DragItem],
      [hoverIndex, dropResult]: [hoverIndex: number, dropResult: DropItem]
    ) => {
      setFeeds((prevCards: FeedResItem[]) =>
        update(prevCards, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, prevCards[dragIndex] as FeedResItem],
          ],
        })
      );
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

  const renderCard = useCallback(
    (feed: FeedResItem, index: number) => {
      const isActive = store?.feed?.uuid === feed.uuid;

      if (feed.item_type === "channel") {
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
              id={feed.uuid}
              text={feed.title}
              feed={{ ...feed }}
              isActive={isActive}
            />
          </SubscribeItem>
        );
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
              id={feed.uuid}
              text={feed.title}
              feed={{ ...feed }}
              isActive={isActive}
            />
            {feed.children && feed.children.map((child, idx) => {
              return (
                <SubscribeItem
                  key={child.uuid}
                  level={2}
                  index={idx}
                  uuid={child.uuid}
                  text={child.title}
                  feed={{ ...child }}
                  isActive={isActive}
                  onMove={moveCard}
                  onDrop={() => onSubscribeItemDrop()}
                  onMoveIntoFolder={moveIntoFolder}
                >
                  <ItemView
                    index={idx}
                    id={child.uuid}
                    text={child.title}
                    feed={{ ...child }}
                    isActive={isActive}
                  />
                </SubscribeItem>
              );
            })}
          </Folder>
        );
      }
    },
    [feeds, store.feed]
  );

  useEffect(() => {
    setFeeds([...store.feedList]);
  }, [store.feedList]);

  return <div className="">{feeds.map((feed, i) => renderCard(feed, i))}</div>;
};
