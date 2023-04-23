import React, {useCallback, useEffect, useRef, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {Progress, Tooltip, Tree} from "@douyinfe/semi-ui";
import {
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  FolderIcon,
  FolderOpenIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import {RouteConfig} from "../../config";
import {Channel} from "../../db";
import {getChannelFavicon} from "../../helpers/parseXML";
import * as dataAgent from "../../helpers/dataAgent";
import {busChannel} from "../../helpers/busChannel";
import {AddFeedChannel} from "../AddChannel";
import {AddFolder} from "../AddFolder";
import pLimit from "p-limit";
import {useBearStore} from "../../hooks/useBearStore";

import styles from "./channel.module.scss";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ChannelList = (): JSX.Element => {
  const navigate = useNavigate();
  const addFeedButtonRef = useRef(null);
  const addFolderButtonRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [channelList, setChannelList] = useState<Channel[]>([]);
  const [done, setDone] = useState(0);
  const store = useBearStore((state) => ({
    channel: state.channel,
    setChannel: state.setChannel,
  }))
  const query = useQuery();
  const feedUrl = query.get("feedUrl");
  const type = query.get("type");
  const channelUuid = query.get("channelUuid");

  const updateCount = (
    channelList: Channel[],
    uuid: string,
    action: string,
    count: number
  ) => {
    channelList.forEach((channel) => {
      let target: any = channel.uuid === uuid ? channel : null
      let child: any = channel.children.find((item) => item.uuid === uuid) || null;

      if (child) {
        target = channel
      }

      if (!target || !child) {
        return channel;
      }

      switch (action) {
        case "increase": {
          target ? target.unread += count : null;
          child ? child.unread += count : null;
          break;
        }
        case "decrease": {
          target ? target.unread -= count : null;
          child ? child.unread -= count : null;
          break;
        }
        case "upgrade": {
          // TODO
          break;
        }

        case "set": {
          target ? target.unread = count : null;
          child ? child.unread = count : null;
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
    const initUnreadCount = (list: any[], countCache: { [key: string]: number }) => {
      return list.map((item) => {
        item.unread = countCache[item.uuid] || 0;

        if (item.children) {
          item.children = initUnreadCount(item.children, countCache)
        }

        return item;
      });
    }
    return Promise.all([dataAgent.getFeeds(), dataAgent.getUnreadTotal()]).then(
      ([channel, unreadTotal]) => {
        channel = initUnreadCount(channel, unreadTotal);
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
        // getList();
        console.log(res);
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
    console.log("%c Line:144 🍷 refreshList", "color:#42b983", "refreshList");
    setRefreshing(true);

    dataAgent.getUserConfig().then((config) => {
      const {threads = 5} = config;
      const limit = pLimit(threads);
      const fns = (channelList || []).map((channel: any) => {
        return limit(() => loadAndUpdate(channel.item_type, channel.uuid));
      });

      console.log("fns.length ===> ", fns.length);

      Promise.all(fns).then((res) => {
        window.setTimeout(() => {
          setRefreshing(false);
          setDone(0);
          getList();
        }, 500);
      });
    });
  };

  const goToSetting = () => {
    navigate(RouteConfig.SETTINGS_GENERAL);
  };

  const renderFolder = (expandStatus: { expanded: boolean }, onExpand: any) => {
    if (expandStatus.expanded) {
      return <>
        <span className="h-4 w-4 rounded mr-2" onClick={onExpand}>
          <ChevronDownIcon className={"h-4 w-4"}/>
        </span>
        <span className="h-4 w-4 rounded mr-3">
          <FolderOpenIcon className={"h-4 w-4"}/>
        </span>
      </>
    } else {
      return <>
        <span className="h-4 w-4 rounded mr-2" onClick={onExpand}>
          <ChevronRightIcon className={"h-4 w-4"}/>
        </span>
        <span className="h-4 w-4 rounded mr-3">
          <FolderIcon className={"h-4 w-4"}/>
        </span>
      </>
    }
  }

  const renderLabel = ({
                         className,
                         onExpand,
                         data,
                         level,
                         expandIcon,
                         expandStatus,
                       }: any) => {
    const {unread = 0, link, label, item_type, uuid} = data;
    const channel = data;
    const ico = getChannelFavicon(link);
    const isLeaf = !(data.children && data.children.length);
    const isActive = (store?.channel?.uuid || channelUuid) === uuid;

    return (
      <li role="treeitem"
          key={channel.title}
          onClick={() => {
            store.setChannel(channel)
            navigate(`${RouteConfig.CHANNEL.replace(
              /:uuid/,
              channel.uuid
            )}?channelUuid=${channel.uuid}&feedUrl=${channel.feed_url}`)
          }}
      >
        <span
          className={
            `w-full flex items-center h-8 px-2 py-3 rounded-md cursor-pointer ${
              isActive
                ? "text-[#fff] bg-royal-blue-600 hover:text-[#fff] hover:bg-royal-blue-600"
                : " text-slate-600 hover:text-slate-900 hover:bg-stone-100"
            } ${level ? 'pl-8' : ''}`
          }
        >
          {!isLeaf && renderFolder(expandStatus, onExpand)}

          {channel.link && (
            <img
              src={ico}
              onError={(e) => {
                // @ts-ignore
                e.target.onerror = null;

                // @ts-ignore
                e.target.src = defaultSiteIcon;
              }}
              className="h-4 w-4 rounded mr-3"
              alt={channel.title}
            />
          )}
          <span
            className="grow shrink basis-[0%] overflow-hidden text-ellipsis whitespace-nowrap text-sm text-[color:currentColor]">
            {channel.title}
          </span>
          {unread > 0 && (
            <span
              className="px-1 min-w-[1rem] h-4 leading-4 text-center text-[10px] text-white rounded-lg bg-neutral-600">
              {unread}
            </span>
          )}
        </span>
      </li>
    );
  };

  const renderTree = (): JSX.Element => {
    const format = (item: any) => {
      item.label = item.title;
      item.key = item.uuid;
      item.value = item.uuid;
      if (item.children) {
        (item.children || []).map((child: Channel) => {
          return format(child);
        });

        return item;
      }
    };

    const data = channelList.map((item) => format(item));

    return (
      <div>
        <Tree
          treeData={data}
          renderFullLabel={renderLabel}
          directory
        ></Tree>
      </div>
    );
  };

  const addFeed = () => {
    if (addFeedButtonRef?.current) {
      (addFeedButtonRef.current as any).showModal();
    }
  };

  const addFolder = () => {
    if (addFolderButtonRef?.current) {
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
    <div className="relative flex flex-col w-[var(--app-channel-width)] h-full select-none border-r border-slate-100">
      <div className={`sticky-header ${styles.header}`}>
        <div/>
        <div className={styles.toolbar}>
          <AddFeedChannel Aref={addFeedButtonRef}/>
          <Tooltip content="Add feed">
            <span
              className={styles.toolbarItem}
              onClick={addFeed}
              onKeyUp={addFeed}
            >
              <PlusIcon className={"h-4 w-4"}/>
            </span>
          </Tooltip>
          <Tooltip content="Create folder">
            <AddFolder Aref={addFolderButtonRef}/>
            <span
              className={styles.toolbarItem}
              onClick={addFolder}
              onKeyUp={addFolder}
            >
              <FolderIcon className={"h-4 w-4"}/>
            </span>
          </Tooltip>
          <Tooltip content="Refresh">
            <span
              className={styles.toolbarItem}
              onClick={refreshList}
              onKeyUp={refreshList}
            >
              <ArrowPathIcon
                className={`h-4 w-4 ${refreshing ? "spinning" : ""}`}
              />
            </span>
          </Tooltip>
          <Tooltip content="Setting">
            <span
              className={styles.toolbarItem}
              onClick={goToSetting}
              onKeyUp={goToSetting}
            >
              <Cog6ToothIcon className={"h-4 w-4"}/>
            </span>
          </Tooltip>
        </div>
      </div>
      <div className="overflow-y-auto mt-[var(--app-toolbar-height)] pb-3 pl-3 height-[calc(100% - var(--app-toolbar-height))]" ref={listRef}>
        {renderTree()}
      </div>
      {refreshing && (
        <div className="sticky left-0 right-0 bottom-0 grid grid-flow-col items-center gap-3 p-3">
          <span>
            {/* @ts-ignore */}
            <Progress percent={Math.ceil((done / channelList.length) * 100)}/>
          </span>
          <span className="text-sm">
            {done}/{channelList.length}
          </span>
        </div>
      )}
    </div>
  );
};

export {ChannelList};
