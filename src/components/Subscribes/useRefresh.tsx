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
  }));
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [done, setDone] = useState<number>(0);

  const timeRef = useRef<any>();

  const getFeedList = () => {
    store.getFeedList();
  };

  const loadAndUpdate = (type: string, uuid: string, unread: number) => {
    return dataAgent
      .syncFeed(type, uuid)
      .then((res) => {
        const { data } = res;
        console.log("%c Line:29 🍌 data", "color:#ffdd4d", data);

        data.forEach((item) => {
          const [count, uuid, _msg] = item;

          if (count) {
            store.updateCollectionMeta(count, count);
            store.updateFeed(uuid, { unread: unread + count });
          }
        });

        return data;
      })
      .catch((err) => {
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
          loadAndUpdate(channel.item_type, channel.uuid, channel.unread)
        );
      });

      Promise.all(fns)
        .then((res) => {})
        .finally(() => {
          setRefreshing(false);
          setDone(0);
          getFeedList();
          loop();
        });
    });
  };

  function loop() {
    if (timeRef.current) {
      clearTimeout(timeRef.current);
    }

    if (store.userConfig.update_interval) {
      timeRef.current = setTimeout(() => {
        startRefresh();
        console.log("%c Line:113 🥕 startRefresh", "color:#42b983");
        loop();
      }, store?.userConfig?.update_interval * 60 * 60 * 1000);
    }
  }

  useEffect(() => {
    loop();
  }, [store.userConfig.update_interval]);

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
