import update from "immutability-helper";
import { useCallback, useEffect, useState } from "react";

import { SubscribeItem } from "./SubscribeItem";
import { useBearStore } from "@/stores";
import { FeedResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { Folder } from "./Folder";
import { ItemView } from "./ItemView";
import { Simulate } from "react-dom/test-utils";
import drop = Simulate.drop;

export interface ContainerState {
  feeds: FeedResItem[];
}

export const List = () => {
  const store = useBearStore((state) => ({
    getFeedList: state.getFeedList,
    feedList: state.feedList,
    feed: state.feed,
  }));
  const [ feeds, setFeeds ] = useState<FeedResItem[]>([]);

  const moveCard = useCallback(
    ([ dragIndex, dragItem ]: [ dragIndex: number, dragItem: FeedResItem ], [ hoverIndex, dropResult ]: [ hoverIndex: number, dropResult: FeedResItem ]) => {

      console.log('dragItem ===> ', dragItem);
      console.log("====>", dropResult);

      setFeeds((prevCards: FeedResItem[]) =>
        update(prevCards, {
          $splice: [
            [ dragIndex, 1 ],
            [ hoverIndex, 0, prevCards[dragIndex] as FeedResItem ],
          ],
        })
      );
    },
    [ feeds ]
  );

  const confirmDropOver = useCallback(() => {
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
  }, [ feeds ]);

  const handleDropIntoFolder = useCallback(
    (index: number, dragItem: FeedResItem, feed: FeedResItem) => {
      console.log("%c Line:72 🍋 dragItem", "color:#3f7cff", dragItem);

      feed.children.push(dragItem.uuid);

      console.log("%c Line:73 🍋 feed", "color:#3f7cff", feed);

      // setFeeds((prevFeeds: FeedResItem[]) => {
      //   update(prevFeeds, {
      //     $splice: [
      //       [dragItem.index, 1],
      //     ]
      //   })
      // })
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
      // return {
      //   ...item,
      //   feed,
      // }

      setFeeds((prevFeeds: FeedResItem[]) =>
        update(prevFeeds, {
          $splice: [
            [ dragItem.index, 1 ],
          ],
        })
      );

    },
    [feeds]
  );

  const renderCard = useCallback(
    (feed: FeedResItem, index: number) => {
      const isActive = store?.feed?.uuid === feed.uuid;

      if (feed.item_type === "channel") {
        return (
          <SubscribeItem
            key={ feed.uuid }
            index={ index }
            id={ feed.uuid }
            text={ feed.title }
            feed={ { ...feed } }
            isActive={ isActive }
            moveCard={ moveCard }
            confirmDidDrop={ confirmDropOver }
          >
            <ItemView
              index={ index }
              id={ feed.uuid }
              text={ feed.title }
              feed={ { ...feed } }
              isActive={ isActive }
            />
          </SubscribeItem>
        );
      } else {
        return (
          <Folder
            index={ index }
            id={ feed.uuid }
            feed={ { ...feed } }
            onDrop={ (dragItem) => handleDropIntoFolder(index, dragItem, feed) }
            moveCard={ moveCard }
            confirmDidDrop={ confirmDropOver }
            key={ index }
          >
            <ItemView
              index={ index }
              id={ feed.uuid }
              text={ feed.title }
              feed={ { ...feed } }
              isActive={ isActive }
            />
          </Folder>
        );
      }
    },
    [ feeds, store.feed ]
  );

  useEffect(() => {
    setFeeds([ ...store.feedList ]);
  }, [ store.feedList ]);

  return <div className="">{ feeds.map((feed, i) => renderCard(feed, i)) }</div>;
};
