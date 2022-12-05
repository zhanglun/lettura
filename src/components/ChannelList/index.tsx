import React, { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDrop, DropTargetMonitor } from "react-dnd";
import update from "immutability-helper";
import { Progress, Tooltip } from "@douyinfe/semi-ui";
import {
  ArrowPathIcon,
  Cog6ToothIcon,
  FolderIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

import { RouteConfig } from "../../config";
import { Channel } from "../../db";
import { AddFeedChannel } from "../AddChannel";
import { AddFolder } from "../AddFolder";
import { getChannelFavicon } from "../../helpers/parseXML";
import * as dataAgent from "../../helpers/dataAgent";
import { busChannel } from "../../helpers/busChannel";

import { ChannelItem } from "./Item";
import styles from "./channel.module.scss";
import { Folder } from "./Folder";
import { ItemTypes } from "./ItemTypes";

const ChannelList = (props: any): JSX.Element => {
  const navigate = useNavigate();
  const addFeedButtonRef = useRef(null);
  const addFolderButtonRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [channelList, setChannelList] = useState<Channel[]>([]);
  const [done, setDone] = useState(0);

  const loadAndUpdate = (uuid: string) => {
    return dataAgent
      .syncArticlesWithChannelUuid(uuid)
      .then(async (res) => {
        return res;
      })
      .catch(() => {
        return Promise.resolve();
      })
      .finally(() => {
        setDone((done) => done + 1);
      });
  };

  const updateCount = (
    channelList: Channel[],
    uuid: string,
    action: string,
    count: number
  ) => {
    channelList.forEach((channel) => {
      if (channel.item_type === 'channel' && channel.uuid !== uuid) {
        return channel;
      }

      if (channel.item_type === 'folder' && !channel.children.some((child) => child.uuid === uuid )) {
        return channel;
      }

      switch (action) {
        case "increase": {
          channel.unread += count;
          break;
        }
        case "decrease": {
          channel.unread -= count;
          break;
        }
        case "upgrade": {
          // TODO
          break;
        }

        case "set": {
          channel.unread = count;
          break;
        }
        default: {
          // TODO
        }
      }

      channel.unread = Math.max(0, channel.unread);

      return channel;
    });

    setChannelList([...channelList]);
  };

  const getList = () => {
    Promise.all([dataAgent.getFeeds(), dataAgent.getUnreadTotal()]).then(
      ([channel, unreadTotal]) => {
        console.log("🚀 ~ file: index.tsx:95 ~ getList ~ unreadTotal", unreadTotal)
        console.log("🚀 ~ file: index.tsx:95 ~ getList ~ channel", channel)
        channel.forEach((item) => {
          item.unread = unreadTotal[item.uuid] || 0;
        });

        setChannelList(channel);
      }
    );
  };

  useEffect(() => {
    getList();

    const unsubscribeGetChannels = busChannel.on("getChannels", () => {
      getList();
    });

    return () => {
      unsubscribeGetChannels();
    };
  }, []);

  useEffect(() => {
    const unsubscribeUpdateCount = busChannel.on(
      "updateChannelUnreadCount",
      ({ uuid, action, count }) => {
        updateCount(channelList, uuid, action, count);
        unsubscribeUpdateCount();
      }
    );

    return () => {
      unsubscribeUpdateCount();
    };
  }, [channelList]);

  const refreshList = () => {
    setRefreshing(true);

    const urlList = (channelList || []).map((channel: any) => {
      return channel.uuid;
    });

    const limit = 5;
    let cur = 0;
    let tasks: Promise<any>[] = [];
    const res: Promise<any>[] = [];
    const enQueue = (): Promise<any> => {
      if (cur === urlList?.length || urlList.length === 0) {
        return Promise.resolve();
      }

      const url = urlList[cur];

      cur += 1;

      const p = Promise.resolve().then(() => loadAndUpdate(url));

      res.push(p);

      let r = Promise.resolve();

      if (limit <= urlList.length) {
        const e: Promise<any> = p.then(() => tasks.splice(tasks.indexOf(e), 1));
        tasks.push(e);
        if (tasks.length >= limit) {
          r = Promise.race(tasks);
        }
      }

      return r.then(() => enQueue());
    };

    enQueue()
      .then(() => {
        return Promise.allSettled(res);
      })
      .then(() => {
        window.setTimeout(() => {
          setRefreshing(false);
          setDone(0);
          getList();
        }, 500);
      });
  };

  const goToSetting = () => {
    navigate(RouteConfig.SETTINGS_GENERAL);
  };

  const findCard = useCallback(
    (uuid: string) => {
      const channel = channelList.filter((c) => `${c.uuid}` === uuid)[0];

      return {
        channel,
        index: channelList.indexOf(channel),
      };
    },
    [channelList]
  );

  const moveCard = useCallback(
    (uuid: string, atIndex: number, intoFolder?: Boolean) => {
      const { channel, index } = findCard(uuid);
      console.log(
        "🚀 ~ file: index.tsx ~ line 197 ~ ChannelList ~ index",
        index
      );

      let list: Channel[] = [];

      if (intoFolder) {
        list = update(channelList, {
          $splice: [
            [index, 1],
          ],
        });
      } else {
        list = update(channelList, {
          $splice: [
            [index, 1],
            [atIndex, 0, channel],
          ],
        });
      }

      list.forEach((item, idx) => (item.sort = idx));

      setChannelList(list);
    },
    [findCard, channelList]
  );

  const [, drop] = useDrop(
    () => ({
      accept: ItemTypes.BOX,
      collect: (moniter: DropTargetMonitor) => ({
        isOver: moniter.isOver(),
      }),
      drop(item: any, monitor) {
        const dropResult = monitor.getDropResult() as any;

        console.log("🚀 ~ file: index.tsx ~ line 225 ~ drop ~ dropResult", dropResult)
        console.log("🚀 ~ file: index.tsx ~ line 224 ~ drop ~ item", item)

        if (item.id === dropResult.id) {
          let feedSort = channelList.map((channel: any) => {
            return {
              uuid: channel.uuid,
              item_type: channel.item_type,
              sort: channel.sort,
            };
          });

          dataAgent.updateFeedSort(feedSort);
        }

      },
    }),
    [channelList]
  );

  const renderFeedList = (): JSX.Element => {
    return (
      <ul className={styles.list} ref={drop}>
        {channelList?.map((channel: any, i: number) => {
          const { unread = 0, link } = channel;
          const ico = getChannelFavicon(link);

          if (channel.item_type === "folder") {
            return (
              <Folder
                id={channel.uuid}
                ico={ico}
                channel={channel}
                unread={unread}
                key={channel.uuid}
                moveCard={moveCard}
                findCard={findCard}
                type={channel.item_type}
              />
            );
          } else {
            return (
              <ChannelItem
                channel={channel}
                ico={ico}
                unread={unread}
                key={channel.uuid}
                id={`${channel.uuid}`}
                moveCard={moveCard}
                findCard={findCard}
                type={channel.item_type}
              />
            );
          }
        })}
      </ul>
    );
  };

  const addFeed = () => {
    if (addFeedButtonRef && addFeedButtonRef.current) {
      (addFeedButtonRef.current as any).showModal();
    }
  };

  const addFolder = () => {
    if (addFolderButtonRef && addFolderButtonRef.current) {
      (addFolderButtonRef.current as any).showModal();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.toolbar}>
          <AddFeedChannel Aref={addFeedButtonRef} />
          <Tooltip content="Add feed">
            <span className={styles.toolbarItem} onClick={addFeed}>
              <PlusIcon className={"h-4 w-4"} />
            </span>
          </Tooltip>
          <Tooltip content="Create folder">
            <AddFolder Aref={addFolderButtonRef} />
            <span className={styles.toolbarItem} onClick={addFolder}>
              <FolderIcon className={"h-4 w-4"} />
            </span>
          </Tooltip>
          <Tooltip content="Refresh">
            <span className={styles.toolbarItem} onClick={refreshList}>
              <ArrowPathIcon
                className={`h-4 w-4 ${refreshing ? "spinning" : ""}`}
              />
            </span>
          </Tooltip>
          <Tooltip content="Setting">
            <span className={styles.toolbarItem} onClick={goToSetting}>
              <Cog6ToothIcon className={"h-4 w-4"} />
            </span>
          </Tooltip>
        </div>
      </div>
      <div className={styles.inner}>{renderFeedList()}</div>
      {refreshing && (
        <div className={styles.footer}>
          <span>
            {/* @ts-ignore */}
            <Progress percent={Math.ceil((done / channelList.length) * 100)} />
          </span>
          <span className={styles.footerCount}>
            {done}/{channelList.length}
          </span>
        </div>
      )}
    </div>
  );
};

export { ChannelList };
