import { FeedResItem } from "@/db";
import { useBearStore } from "@/stores";
import React, { useCallback, useEffect, useState } from "react";
import { SortableTree } from "../Tree/SortableTree";

export const TreeContainer = () => {
  const store = useBearStore((state) => ({
    getFeedList: state.getFeedList,
    feedList: state.feedList,
    feed: state.feed,
  }));
  const [feeds, setFeeds] = useState<FeedResItem[]>([]);

  useEffect(() => {
    setFeeds([...store.feedList].map(_ => {
      _.id = _.uuid
      _.parentId = _.folder_uuid;
      return _
    }));
    console.log("%c Line:16 🍅 store.feedList", "color:#7f2b82", store.feedList);
  }, [store.feedList]);

  return (
      <SortableTree />
  );
};
