import update from "immutability-helper";
import { useCallback, useEffect, useState } from "react";

import { SubscribeItem } from "./SubscribeItem";
import { useBearStore } from "@/stores";
import { FeedResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { Folder } from "./Folder";
import { ItemView } from "./ItemView";

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
    (dragIndex: number, hoverIndex: number) => {
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

  const confirmDropOver = useCallback(() => {
    console.log("%c Line:33 🍏 feeds", "color:#ffdd4d", feeds);
    const body = feeds.reduce((acu, feed, idx) => {
      let item = {
        item_type: feed.item_type,
        parent_uuid: feed.parent_uuid,
        child_uuid: feed.uuid,
        sort: idx,
      };

      feed.children.length > 0 &&
        feed.children.forEach((child) => {
          item.child_uuid = child.uuid;
          acu.push({
            ...item,
          });
        });

      acu.push({
        ...item,
      });

      return acu;
    }, [] as any[]);

    console.log("%c Line:55 🥚 body", "color:#ffdd4d", body);

    dataAgent.updateFeedSort(body).then((res) => {
      console.log("%c Line:47 🥔 res", "color:#b03734", res);
    });
  }, [feeds]);

  const handleDropIntoFolder = useCallback(
    (index: number, item: { name: string }) => {
      const { name } = item;
      console.log("%c Line:72 🍋 item", "color:#3f7cff", item);
      // setDroppedBoxNames(
      //   update(droppedBoxNames, name ? { $push: [name] } : { $push: [] }),
      // )
      // setDustbins(
      //   update(dustbins, {
      //     [index]: {
      //       lastDroppedItem: {
      //         $set: item,
      //       },
      //     },
      //   }),
      // )
    },
    []
  );

  const renderCard = useCallback(
    (feed: FeedResItem, index: number) => {
      const isActive = store?.feed?.uuid === feed.uuid;

      if (feed.item_type === "channel") {
        return (
          <SubscribeItem
            key={feed.uuid}
            index={index}
            id={feed.uuid}
            text={feed.title}
            feed={{ ...feed }}
            isActive={isActive}
            moveCard={moveCard}
            confirmDidDrop={confirmDropOver}
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
            onDrop={(item) => handleDropIntoFolder(index, item)}
            moveCard={moveCard}
            confirmDidDrop={confirmDropOver}
            key={index}
          >
            <ItemView
              index={index}
              id={feed.uuid}
              text={feed.title}
              feed={{ ...feed }}
              isActive={isActive}
            />
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
