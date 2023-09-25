import update from "immutability-helper";
import { useCallback, useEffect, useState } from "react";

import { SubscribeItem } from "./SubscribeItem";
import { useBearStore } from "@/stores";
import { FeedResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";

const style = {
  width: 400,
};

export interface ContainerState {
  feeds: FeedResItem[];
}

export const List = () => {
  const store = useBearStore((state) => ({
    getFeedList: state.getFeedList,
    feedList: state.feedList,
  }))
  const [feeds, setFeeds] = useState<FeedResItem[]>([]);

  const moveCard = useCallback((dragIndex: number, hoverIndex: number) => {
    setFeeds((prevCards: FeedResItem[]) =>
    update(prevCards, {
      $splice: [
        [dragIndex, 1],
        [hoverIndex, 0, prevCards[dragIndex] as FeedResItem],
      ],
    }),
  )
  }, [feeds]);

  const confirmDropOver = useCallback(() => {
    console.log("%c Line:33 🍏 feeds", "color:#ffdd4d", feeds);
    const body = feeds.reduce((acu, feed, idx) => {
      let item = {
        item_type: feed.item_type,
        parent_uuid: feed.parent_uuid,
        child_uuid: feed.uuid,
        sort: idx,
      }

      feed.children.length > 0 && feed.children.forEach((child) => {
        item.child_uuid = child.uuid;
        acu.push({
          ...item,
        })
      })

      acu.push({
        ...item,
      })

      return acu;
    }, [] as any[])

    console.log("%c Line:55 🥚 body", "color:#ffdd4d", body);

    dataAgent.updateFeedSort(body).then((res) => {
      console.log("%c Line:47 🥔 res", "color:#b03734", res);
    });
  }, [feeds]);

  const renderCard = useCallback(
    (feed: FeedResItem, index: number) => {
      return (
        <SubscribeItem
          key={feed.uuid}
          index={index}
          id={feed.uuid}
          text={feed.title }
          data={{...feed}}
          moveCard={moveCard}
          confirmDidDrop={confirmDropOver}
        />
      );
    },
    [feeds]
  );

  useEffect(() => {
    setFeeds([...store.feedList]);
  }, [store.feedList]);

  return (
    <>
      <div style={style}>{feeds.map((feed, i) => renderCard(feed, i))}</div>
    </>
  );
};
