import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DropTargetMonitor, useDrop } from "react-dnd";
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
import { getChannelFavicon } from "../../helpers/parseXML";
import * as dataAgent from "../../helpers/dataAgent";
import { busChannel } from "../../helpers/busChannel";
import { promisePool } from "../../helpers/promsiePool";
import { AddFeedChannel } from "../AddChannel";
import { AddFolder } from "../AddFolder";
import { ChannelItem } from "./Item";
import { Folder } from "./Folder";
import { ItemTypes } from "./ItemTypes";

import styles from "./channel.module.scss";

const ChannelList = (props: any): JSX.Element => {
  const navigate = useNavigate();
  const addFeedButtonRef = useRef(null);
  const addFolderButtonRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [channelList, setChannelList] = useState<Channel[]>([]);
  const [done, setDone] = useState(0);

  const updateCount = (
    channelList: Channel[],
    uuid: string,
    action: string,
    count: number
  ) => {
    channelList.forEach((channel) => {
      if (channel.item_type === "channel" && channel.uuid !== uuid) {
        return channel;
      }

      if (
        channel.item_type === "folder" &&
        channel.uuid !== uuid &&
        !channel.children.some((child) => child.uuid === uuid)
      ) {
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
      ({uuid, action, count}) => {
        console.log(
          "🚀 ~ file: index.tsx:138 ~ useEffect ~ updateChannelUnreadCount"
        );
        updateCount(channelList, uuid, action, count);
        unsubscribeUpdateCount();
      }
    );

    return () => {
      unsubscribeUpdateCount();
    };
  }, [channelList]);

  const loadAndUpdate = (type: string, uuid: string) => {
    return dataAgent
      .syncArticlesWithChannelUuid(type, uuid)
      .then((res) => {
        getList();
        console.log(res)
        return res;
      })
      .catch(() => {
        return Promise.resolve();
      })
      .finally(() => {
        setDone((done) => done + 1);
      });
  };

  const refreshList = () => {
    setRefreshing(true);

    const fns = (channelList || []).map((channel: any) => {
      return loadAndUpdate(channel.item_type, channel.uuid);
    });


    dataAgent.getUserConfig().then((config) => {
      const { threads = 5 } = config;
      const pool = promisePool({limit: threads, fns});

      pool.run().then((res) => {
        window.setTimeout(() => {
          setRefreshing(false);
          setDone(0);
          getList();
        }, 500);
      });
    })
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
      const {channel, index} = findCard(uuid);

      let list: Channel[] = [];

      if (intoFolder) {
        list = update(channelList, {
          $splice: [[index, 1]],
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
          const {unread = 0, link} = channel;
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
                afterFn={getList}
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

  const listRef = useRef<HTMLDivElement>(null);
  const handleListScroll = useCallback(() => {
    if (listRef.current) {
      const scrollTop = listRef.current.scrollTop;

      if (scrollTop > 0) {
        listRef.current?.parentElement?.classList.add("is-scroll");
      } else {
        listRef.current?.parentElement?.classList.remove("is-scroll");
      }
    }
  }, []);

  useEffect(() => {
    if (listRef.current) {
      const $list = listRef.current as HTMLDivElement;
      $list.addEventListener("scroll", handleListScroll);
    }
  }, []);

  return (
    <div className={styles.container}>
      <div className={`sticky-header ${styles.header}`}>
        <div></div>
        <div className={styles.toolbar}>
          <AddFeedChannel Aref={addFeedButtonRef}/>
          <Tooltip content="Add feed">
            <span className={styles.toolbarItem} onClick={addFeed}>
              <PlusIcon className={"h-4 w-4"}/>
            </span>
          </Tooltip>
          <Tooltip content="Create folder">
            <AddFolder Aref={addFolderButtonRef}/>
            <span className={styles.toolbarItem} onClick={addFolder}>
              <FolderIcon className={"h-4 w-4"}/>
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
              <Cog6ToothIcon className={"h-4 w-4"}/>
            </span>
          </Tooltip>
        </div>
      </div>
      <div className={styles.inner} ref={listRef}>
        {renderFeedList()}
      </div>
      {refreshing && (
        <div className={styles.footer}>
          <span>
            {/* @ts-ignore */}
            <Progress percent={Math.ceil((done / channelList.length) * 100)}/>
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
