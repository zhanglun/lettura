import React, { useEffect, useRef, useState } from "react";
import pLimit from "p-limit";
import { Channel } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { useBearStore } from "@/hooks/useBearStore";

export const useRefresh = () => {
  const store = useBearStore((state) => ({
    userConfig: state.userConfig,
  }));
  const [feedList, setFeedList] = useState<Channel[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [done, setDone] = useState<number>(0);

  const timeRef = useRef<any>();

  const getFeedList = () => {
    const initUnreadCount = (
      list: any[],
      countCache: { [key: string]: number },
    ) => {
      return list.map((item) => {
        item.unread = countCache[item.uuid] || 0;

        if (item.children) {
          item.children = initUnreadCount(item.children, countCache);
        }

        return item;
      });
    };
    return Promise.all([dataAgent.getFeeds(), dataAgent.getUnreadTotal()]).then(
      ([channel, unreadTotal]) => {
        channel = initUnreadCount(channel, unreadTotal);
        console.log("channel", channel);
        setFeedList(channel);
      },
    );
  };

  const loadAndUpdate = (type: string, uuid: string, unread: number) => {
    return dataAgent
      .syncArticlesWithChannelUuid(type, uuid)
      .then((res) => {
        console.log("%c Line:222 🍬 res", "color:#7f2b82", res);
        res.forEach((item) => {
          const [count, uuid, _msg] = item;

          count > 0 &&
            setFeedList((list) => {
              return list.map((item) => {
                return item.uuid === uuid
                  ? {
                      ...item,
                      unread: unread + count,
                    }
                  : item;
              });
            });
        });

        return res;
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

    dataAgent.getUserConfig().then((config) => {
      const { threads = 5 } = config;
      const limit = pLimit(threads);
      const fns = (feedList || []).map((channel: any) => {
        return limit(() =>
          loadAndUpdate(channel.item_type, channel.uuid, channel.unread),
        );
      });

      Promise.all(fns).then((res) => {
        // window.setTimeout(() => {
        setRefreshing(false);
        setDone(0);
        getFeedList();
        // }, 500);
      });
    });
  };

  // useEffect(() => {
  //   if (timeRef.current) {
  //     clearInterval(timeRef.current)
  //   }

  //   if (store.userConfig.update_interval) {
  //     timeRef.current = setInterval(() => {
  //       startRefresh();
  //     }, store.userConfig.update_interval * 60 * 60);
  //   }
  // }, [store.userConfig.update_interval]);

  return [
    feedList,
    setFeedList,
    getFeedList,
    refreshing,
    setRefreshing,
    done,
    setDone,
    startRefresh,
  ] as const;
};
