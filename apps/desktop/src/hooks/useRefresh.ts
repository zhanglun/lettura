import React, { useEffect, useRef, useState } from "react";
import pLimit from "p-limit";
import { FeedResItem } from "@/db";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";

/**
 * 全局刷新 Hook，用于批量刷新所有订阅源
 *
 * 使用并发控制（p-limit）来限制同时进行的请求数量，避免过度占用系统资源。
 *
 * @returns {UseRefreshReturn} 包含 startRefresh 函数的对象
 *
 * @example
 * ```tsx
 * const { startRefresh } = useRefresh();
 *
 * <button onClick={startRefresh}>
 *   刷新所有订阅
 * </button>
 * ```
 */
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
    })),
  );

  const [done, setDone] = useState<number>(0);

  /**
   * 加载并更新单个订阅源
   *
   * @param {FeedResItem} channel - 需要同步的订阅源
   * @returns {Promise<void>} 同步完成后返回
   */
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

  /**
   * 启动全局刷新流程
   *
   * 1. 检查是否正在进行刷新，如果是则返回
   * 2. 获取用户配置，确定并发线程数
   * 3. 使用 p-limit 控制并发数量，批量刷新所有订阅源
   * 4. 更新最后同步时间
   *
   * @returns {boolean} 如果已经在刷新中则返回 false，否则启动刷新
   */
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
