import React, { useState } from "react";
import * as dataAgent from '@/helpers/dataAgent';
import pLimit from "p-limit";
import { Channel } from "@/db";

export const useRefresh = (props: { feedList: Channel[] }) => {
  const { feedList } = props;
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [done, setDone] = useState<number>(0);

  const loadAndUpdate = (type: string, uuid: string, unread: number) => {
    return dataAgent
      .syncArticlesWithChannelUuid(type, uuid)
      .then((res) => {
        console.log("%c Line:222 🍬 res", "color:#7f2b82", res);
        // res.forEach((item) => {
        //   const [ count, uuid, _msg ] = item;

        //   count > 0 && setChannelList((list) => {
        //     return list.map((item) => {
        //       return item.uuid === uuid ? {
        //         ...item,
        //         unread: unread + count
        //       } : item;
        //     });
        //   });
        // });

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
    setRefreshing(true);

    // dataAgent.getUserConfig().then((config) => {
    //   const { threads = 5 } = config;
    //   const limit = pLimit(threads);
    //   const fns = (feedList || []).map((channel: any) => {
    //     return limit(() =>
    //       loadAndUpdate(channel.item_type, channel.uuid, channel.unread)
    //     );
    //   });

    //   Promise.all(fns).then((res) => {
    //     // window.setTimeout(() => {
    //       setRefreshing(false);
    //       setDone(0);
    //       // getList();
    //     // }, 500);
    //   });
    // })
  }

  return [
    refreshing,
    setRefreshing,
    done,
    setDone,
    startRefresh,
  ] as const;
};
