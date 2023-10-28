import React, { useEffect, useRef, useState } from "react";
import pLimit from "p-limit";
import { FeedResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { useBearStore } from "@/stores";

export const useRefresh = () => {
  const store = useBearStore((state) => ({
    userConfig: state.userConfig,

    feedList: state.feedList,
    getFeedList: state.getFeedList,
    updateFeed: state.updateFeed,

    collectionMeta: state.collectionMeta,
    updateCollectionMeta: state.updateCollectionMeta,
    syncArticles: state.syncArticles,
  }));
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [done, setDone] = useState<number>(0);

  const timeRef = useRef<any>();

  const getFeedList = () => {
    store.getFeedList();
  };

  const loadAndUpdate = (channel: FeedResItem) => {
    return store.syncArticles(channel)
      .then(() => {
        return Promise.resolve();
      })
      .catch((err: any) => {
        console.log("%c Line:239 🍬 err", "color:#2eafb0", err);
        return Promise.resolve();
      })
      .finally(() => {
        console.log("%c Line:243 🍭 finally", "color:#4fff4B");
        setDone((done) => done + 1);
      });
  };

  const startRefresh = () => {
    if (refreshing) {
      return false;
    }

    setRefreshing(true);

    dataAgent.getUserConfig().then(({ data: config }) => {
      const { threads = 5 } = config;
      const limit = pLimit(threads);
      const fns = (store.feedList || []).map((channel: any) => {
        return limit(() =>
          loadAndUpdate(channel)
        );
      });

      Promise.all(fns)
        .then((res) => {})
        .finally(() => {
          setRefreshing(false);
          setDone(0);
          getFeedList();
          // loop();
        });
    });
  };

  // function loop() {
  //   if (timeRef.current) {
  //     clearTimeout(timeRef.current);
  //   }
  //
  //   if (store.userConfig.update_interval) {
  //     timeRef.current = setTimeout(() => {
  //       startRefresh();
  //       console.log("%c Line:113 🥕 startRefresh", "color:#42b983");
  //       loop();
  //     }, store?.userConfig?.update_interval * 60 * 60 * 1000);
  //   }
  // }

  // useEffect(() => {
  //   loop();
  // }, [store.userConfig.update_interval]);

  return [
    store.feedList,
    store.getFeedList,
    getFeedList,
    refreshing,
    setRefreshing,
    done,
    setDone,
    startRefresh,
  ] as const;
};
