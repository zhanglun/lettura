import React, { useEffect, useRef, useState } from "react";
import pLimit from "p-limit";
import { FeedResItem } from "@/db";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";

export const useRefresh = () => {
  console.log("Hooks: useRefresh2 called");

  const store = useBearStore(
    useShallow((state) => ({
      getUserConfig: state.getUserConfig,
      getSubscribes: state.getSubscribes,
      syncArticles: state.syncArticles,
      getSubscribesFromStore: state.getSubscribesFromStore,
      globalSyncStatus: state.globalSyncStatus,
      setGlobalSyncStatus: state.setGlobalSyncStatus,
      setLastSyncTime: state.setLastSyncTime,
    }))
  );

  const [done, setDone] = useState<number>(0);

  const loadAndUpdate = (channel: FeedResItem) => {
    return store
      .syncArticles(channel)
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

  function startRefresh() {
    if (store.globalSyncStatus) {
      return false;
    }

    store.setGlobalSyncStatus(true);
    store.getUserConfig().then((config: UserConfig) => {
      if (!config) return;

      store.setLastSyncTime(new Date());

      const { threads = 5 } = config;
      const limit = pLimit(threads);
      const errors = [];
      const fns = (store.getSubscribesFromStore() || []).map((channel: any) => {
        return limit(() => loadAndUpdate(channel));
      });

      Promise.all(fns)
        .then((res) => {})
        .finally(() => {
          store.setGlobalSyncStatus(false);
          setDone(0);
          store.getSubscribes();
        });
    });
  }

  return {
    startRefresh,
  };
};
