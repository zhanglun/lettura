import React, { useState, useEffect, useRef, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "./channel.module.scss";
import defaultSiteIcon from "./default.png";
import { RouteConfig } from "../../config";
import { Channel } from "../../db";
import { AddFeedChannel } from "../AddChannel";
import { getChannelFavicon } from "../../helpers/parseXML";
import * as dataAgent from "../../helpers/dataAgent";
import { StoreContext } from "../../context";
import { Progress } from "@douyinfe/semi-ui";
import {
  ArrowPathIcon,
  Cog6ToothIcon,
  FolderIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { busChannel } from "../../helpers/busChannel";

const ChannelList = (props: any): JSX.Element => {
  const store = useContext(StoreContext);
  const navigate = useNavigate();
  const addFeedButtonRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [channelList, setChannelList] = useState<Channel[]>([]);
  const [done, setDone] = useState(0);

  const loadAndUpdate = (url: string) => {
    return dataAgent
      .addChannel(url)
      .then(async (res) => {
        console.log("%c Line:27 🍑 res", "color:#fca650", res);

        return res;
      })
      .catch(() => {
        return Promise.resolve();
      })
      .finally(() => {
        setDone((done) => done + 1);
      });
  };

  const updateCount = (channelList: Channel[], uuid: string, action: string, count: number) => {
    channelList.forEach((channel) => {
      if (channel.uuid !== uuid) {
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
    Promise.all([
      dataAgent.getChannels(),
      dataAgent.getUnreadTotal(),
    ]).then(([channel, unreadTotal]) => {
      channel.forEach((item) => {
        item.unread = unreadTotal[item.uuid] || 0;
      });

      setChannelList(channel);
    })
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
      return channel.feed_url;
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
        }, 500);
      });
  };

  const goToSetting = () => {
    navigate(RouteConfig.SETTINGS_GENERAL);
  };

  const renderFeedList = (): JSX.Element => {
    return (
      <ul className={styles.list}>
        {channelList?.map((channel: any, i: number) => {
          const { unread = 0, link } = channel;
          const ico = getChannelFavicon(link);

          return (
            <li
              key={channel.title + i}
              onClick={() => store.setChannel(channel)}
              aria-hidden="true"
            >
              <NavLink
                className={({ isActive }) =>
                  `${styles.item} ${isActive ? styles.itemActive : ""}`
                }
                to={`${RouteConfig.CHANNEL.replace(
                  /:uuid/,
                  channel.uuid
                )}?channelUuid=${channel.uuid}&feedUrl=${channel.feed_url}`}
              >
                <img
                  src={ico}
                  onError={(e) => {
                    // @ts-ignore
                    e.target.onerror = null;

                    // @ts-ignore
                    e.target.src = defaultSiteIcon;
                  }}
                  className={styles.icon}
                  alt={channel.title}
                />
                <span className={styles.name}>{channel.title}</span>
                {unread > 0 && <span className={styles.count}>{unread}</span>}
              </NavLink>
            </li>
          );
        })}
      </ul>
    );
  };

  const addFeed = () => {
    if (addFeedButtonRef && addFeedButtonRef.current) {
      (addFeedButtonRef.current as any).showModal();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.toolbar}>
          <AddFeedChannel Aref={addFeedButtonRef}/>
          <span className={styles.toolbarItem} onClick={addFeed}>
            <PlusIcon className={"h-4 w-4"}/>
          </span>
          <span className={styles.toolbarItem}>
            <FolderIcon className={"h-4 w-4"}/>
          </span>
          <span className={styles.toolbarItem} onClick={refreshList}>
            <ArrowPathIcon
              className={`h-4 w-4 ${refreshing ? "spinning" : ""}`}
            />
          </span>
          <span className={styles.toolbarItem} onClick={goToSetting}>
            <Cog6ToothIcon className={"h-4 w-4"}/>
          </span>
        </div>
      </div>
      <div className={styles.inner}>{renderFeedList()}</div>
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
