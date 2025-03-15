import React, { useEffect, useRef, useState } from "react";
import pLimit from "p-limit";
import { FeedResItem } from "@/db";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";

export const useRefresh = () => {
  const store = useBearStore(
    useShallow((state) => ({
      userConfig: state.userConfig,
      getUserConfig: state.getUserConfig,

      setLastSyncTime: state.setLastSyncTime,

      subscribes: state.subscribes,
      getSubscribes: state.getSubscribes,
      updateFeed: state.updateFeed,
      feed: state.feed,

      collectionMeta: state.collectionMeta,
      updateCollectionMeta: state.updateCollectionMeta,
      syncArticles: state.syncArticles,
    }))
  );
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [done, setDone] = useState<number>(0);
  const timeRef = useRef<any>();

  const getSubscribes = () => {
    store.getSubscribes();
  };

  const loadAndUpdate = (channel: FeedResItem) => {
    return store
      .syncArticles(channel)
      .then(() => {
        if (store.feed && store.feed.uuid === channel.uuid) {
          // TODO: get article list
        }
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

    console.log("🚀 ~ file: useRefresh.tsx:51 ~ startRefresh ~ refreshing:", refreshing);

    store.getUserConfig().then((config: UserConfig) => {
      if (!config) return;

      store.setLastSyncTime(new Date());

      const { threads = 5 } = config;
      const limit = pLimit(threads);
      const errors = [];
      const fns = (store.subscribes || []).map((channel: any) => {
        return limit(() => loadAndUpdate(channel));
      });

      setRefreshing(true);

      Promise.all(fns)
        .then((res) => {})
        .finally(() => {
          setRefreshing(false);
          setDone(0);
          getSubscribes();
          // loop();
        });
    });
  };

  function loop(cfg: UserConfig) {
    console.log("🚀 ~ file: useRefresh.tsx:96 ~ loop ~ cfg:", cfg);
    if (timeRef.current) {
      clearInterval(timeRef.current);
    }

    if (cfg.update_interval) {
      startRefresh();

      timeRef.current = setInterval(() => {
        startRefresh();
      }, cfg.update_interval * 60 * 60 * 1000);
    } else {
    }
  }

  return {
    subscribes: store.subscribes,
    getSubscribes,
    refreshing,
    setRefreshing,
    done,
    setDone,
    startRefresh,
    loop,
  } as const;
};
