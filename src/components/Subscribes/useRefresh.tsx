import React, { useEffect, useRef, useState } from "react";
import pLimit from "p-limit";
import { FeedResItem } from "@/db";
import { useBearStore } from "@/stores";

export const useRefresh = () => {
  const store = useBearStore((state) => ({
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
  }));
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

    store.getUserConfig().then((config: UserConfig) => {
      if (!config) return;

      store.setLastSyncTime(new Date());

      const { threads = 5 } = config;
      const limit = pLimit(threads);
      const errors = [];
      const fns = (store.subscribes || []).map((channel: any) => {
        return limit(() => {
          try {
            // return loadAndUpdate(channel);
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                console.log("=====》");
                resolve("1");
              }, 1000);
            });
          } catch (err) {
            errors.push({
              channel,
              error: err,
            });
            return Promise.resolve(); // 继续执行下一个请求
          }
        });
      });

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
    if (timeRef.current) {
      clearInterval(timeRef.current);
    }

    if (cfg.update_interval) {
      timeRef.current = setInterval(() => {
        startRefresh();
        // }, cfg.update_interval * 60 * 60 * 1000);
      }, 3000);
    } else {
    }
  }

  useEffect(() => {
    console.log("%c Line:93 🥕 subscribes", "color:#33a5ff", store.subscribes);

    if (!store.subscribes || store.subscribes.length === 0) {
      return;
    }

    // if (!store.userConfig.last_sync_time) {
    //   startRefresh();
    // }

    // if (
    //   store.userConfig.update_interval &&
    //   store.userConfig.last_sync_time &&
    //   new Date().getTime() -
    //     new Date(store.userConfig.last_sync_time).getTime() >
    //     store.userConfig.update_interval * 60 * 60 * 1000
    // ) {
    //   startRefresh();
    // }

    // loop();

    return () => {
      clearTimeout(timeRef.current);
    };
  }, [store.subscribes, store.userConfig.update_interval]);

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
