import update from "immutability-helper";
import { useCallback, useEffect, useState } from "react";

import { SubscribeItem } from "./SubscribeItem";
import { useBearStore } from "@/stores";
import { FeedResItem } from "@/db";

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
    const newOrder = update(feeds, {
      $splice: [
        [dragIndex, 1],
        [hoverIndex, 0, feeds[dragIndex] as FeedResItem],
      ],
    })

    console.log("%c Line:31 🍩 newOrder", "color:#42b983", newOrder);

    newOrder && setFeeds(newOrder);
  }, [feeds]);

  const confirmDropOver = () => {
    console.log("%c Line:36 🍰 confirmDropOver", "color:#ffdd4d");
    console.log("%c Line:33 🍏 feeds", "color:#ffdd4d", feeds);
    // TODO: update sort
  }

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
    []
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
