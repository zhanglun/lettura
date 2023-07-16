import React, { useCallback, useEffect, useRef, useState } from "react";
import { useMatch, useNavigate } from "react-router-dom";
import { Folder, RefreshCw, Settings, Coffee, Haze } from "lucide-react";
import pLimit from "p-limit";
import classNames from "classnames";
import { listen } from "@tauri-apps/api/event";
import { RouteConfig } from "@/config";
import { Article, Channel } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import { useBearStore } from "@/hooks/useBearStore";
import { AddFeedChannel } from "../AddFeed";
import { AddFolder } from "../AddFolder";
import { TestTree } from "./TestTree";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from "@/components/ui/context-menu";
import { Icon } from "../Icon";
import { FeedItem } from "./Item";
import { DialogUnsubscribeFeed } from "../SettingPanel/Content/DialogUnsubscribeFeed";
import { useModal } from "../Modal/useModal";
import { open } from "@tauri-apps/api/shell";
import { DialogEditFeed } from "@/components/SettingPanel/Content/DialogEditFeed";
import { useQuery } from "@/helpers/parseXML";

import styles from "./channel.module.scss";
import dayjs from "dayjs";
import { Separator } from "../ui/separator";

const ChannelList = (): JSX.Element => {
  const isToday = useMatch(RouteConfig.TODAY);
  const isAll = useMatch(RouteConfig.ALL);
  const navigate = useNavigate();
  const [ addFolderDialogStatus, setAddFolderDialogStatus ] = useModal();
  const [ editFolderDialogStatus, setEditFolderDialogStatus ] = useModal();
  const [ editFeedStatus, setEditFeedStatus ] = useModal();
  const [ showStatus, setModalStatus ] = useModal();
  const [ refreshing, setRefreshing ] = useState(false);
  const [ channelList, setChannelList ] = useState<Channel[]>([]);
  const [ treeData, setTreeData ] = useState<any>([]);
  const [ done, setDone ] = useState(0);
  const store = useBearStore((state) => ({
    channel: state.channel,
    setChannel: state.setChannel,
    updateFeed: state.updateFeed,
    feedContextMenuTarget: state.feedContextMenuTarget,
    setFeedContextMenuTarget: state.setFeedContextMenuTarget,

    setViewMeta: state.setViewMeta
  }));
  const [ channelUuid ] = useQuery();
  const [ meta, setMeta ] = useState<{
    [key: string]: { [key: string]: number };
  }>({
    total: { unread: 0 },
    today: { unread: 0 }
  });

  const initCollectionMetas = () => {
    dataAgent.getCollectionMetas().then((res) => {
      console.log("%c Line:19 🍅 res", "color:#ed9ec7", res);
      setMeta({
        today: { unread: res.today },
        total: { unread: res.total }
      });
    });
  };

  useEffect(() => {
    initCollectionMetas();
  }, []);

  const updateCount = (
    channelList: Channel[],
    uuid: string,
    isToday: boolean,
    action: string,
    count: number
  ) => {
    const strategy = (action: string, target: any) => {
      switch (action) {
        case "increase": {
          target ? (target.unread += count) : null;
          break;
        }
        case "decrease": {
          target ? (target.unread -= count) : null;
          break;
        }
        case "upgrade": {
          // TODO
          break;
        }

        case "set": {
          target ? (target.unread = count) : null;
          break;
        }
        default: {
          // TODO
        }
      }
    };

    channelList.forEach((channel) => {
      let target: any = channel.uuid === uuid ? channel : null;
      let child: any =
        channel.children.find((item) => item.uuid === uuid) || null;

      if (child) {
        target = channel;
      }

      if (!target && !child) {
        return channel;
      }

      strategy(action, target);
      strategy(action, child);

      channel.unread = Math.max(0, channel.unread);

      return channel;
    });

    setChannelList([ ...channelList ]);

    strategy(action, meta.total);

    if (isToday) {
      strategy(action, meta.today);
    }

    console.log("%c Line:137 🥚 meta", "color:#7f2b82", meta);

    setMeta(meta);
  };

  const getList = () => {
    const initUnreadCount = (
      list: any[],
      countCache: { [key: string]: number }
    ) => {
      return list.map((item) => {
        item.unread = countCache[item.uuid] || 0;

        if (item.children) {
          item.children = initUnreadCount(item.children, countCache);
        }

        return item;
      });
    };
    return Promise.all([ dataAgent.getFeeds(), dataAgent.getUnreadTotal() ]).then(
      ([ channel, unreadTotal ]) => {
        channel = initUnreadCount(channel, unreadTotal);
        console.log("channel", channel);
        setChannelList(channel);
      }
    );
  };

  const reloadFeedIcon = (feed: Channel | null) => {
    feed &&
    dataAgent.updateIcon(feed.uuid, feed.link).then((res) => {
      console.log("%c Line:139 🍷 res", "color:#ea7e5c", res);
      feed.logo = res;
    });
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
    channelList.forEach((feed) => {
      if (feed.uuid === channelUuid) {
        store.setChannel(feed);
      }
    });
  }, [ channelUuid, channelList ]);

  useEffect(() => {
    const unsubscribeUpdateCount = busChannel.on(
      "updateChannelUnreadCount",
      ({ uuid, isToday, action, count }) => {
        console.log(
          "🚀 ~ file: index.tsx:138 ~ useEffect ~ updateChannelUnreadCount"
        );
        updateCount(channelList, uuid, isToday, action, count);
        unsubscribeUpdateCount();
      }
    );

    const updateCollectionMeta = busChannel.on("updateCollectionMeta", () => {
      initCollectionMetas();
    });

    return () => {
      unsubscribeUpdateCount();
      updateCollectionMeta();
    };
  }, [ channelList ]);

  const loadAndUpdate = (type: string, uuid: string, unread: number) => {
    return dataAgent
      .syncArticlesWithChannelUuid(type, uuid)
      .then((res) => {
        console.log("%c Line:222 🍬 res", "color:#7f2b82", res);
        res.forEach((item) => {
          const [ count, uuid, _msg ] = item;

          count > 0 && setChannelList((list) => {
            return list.map((item) => {
              return item.uuid === uuid ? {
                ...item,
                unread: unread + count
              } : item;
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

  const refreshList = () => {
    setRefreshing(true);

    dataAgent.getUserConfig().then((config) => {
      const { threads = 5 } = config;
      const limit = pLimit(threads);
      const fns = (channelList || []).map((channel: any) => {
        return limit(() =>
          loadAndUpdate(channel.item_type, channel.uuid, channel.unread)
        );
      });

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

  const handleContextMenuChange = (status: boolean) => {
    // if (!status) {
    //   store.setFeedContextMenuTarget(null);
    // }
  };

  useEffect(() => {
    if (listRef.current) {
      const $list = listRef.current as HTMLDivElement;
      $list.addEventListener("scroll", handleListScroll);
    }

    const listener = async () => {
      await listen("start-auto-async", (event) => {
        console.log("%c Line:409 🍑 event", "color:#ea7e5c", event);
        let input = event.payload;
        console.log("%c Line:409 🍊 input", "color:#7f2b82", input);
      });
    };

    listener();
  }, []);

  useEffect(() => {
    const treeData = channelList.reduce(
      (acu, cur) => {
        // @ts-ignore
        acu.root.children.push(cur.uuid);
        acu[cur.uuid] = {
          index: cur.uuid,
          isFolder: cur.item_type === "folder",
          children: cur.children.map((c: Channel) => c.uuid),
          title: cur.title,
          data: cur
        };

        cur.children.forEach((child: Channel) => {
          acu[child.uuid] = {
            index: child.uuid,
            children: [],
            title: child.title,
            data: child
          };
        });

        return acu;
      },
      {
        root: {
          index: "root",
          isFolder: true,
          children: [],
          data: "Root item"
        }
      } as any
    );

    setTreeData(treeData);
  }, [ channelList ]);

  return (
    <div className="relative flex flex-col w-[var(--app-channel-width)] h-full select-none border-r border-border text-[hsl(var(--foreground))]
  bg-[hsl(var(--background))]">
      <div className={ `sticky-header ${ styles.header }` }>
        <div />
        <div className={ styles.toolbar }>
          <AddFeedChannel />
          <AddFolder
            action="add"
            dialogStatus={ addFolderDialogStatus }
            setDialogStatus={ setAddFolderDialogStatus }
            afterConfirm={ getList }
            afterCancel={ () => store.setFeedContextMenuTarget(null) }
            trigger={
              <Icon>
                <Folder size={ 16 } />
              </Icon>
            }
          />

          <Icon onClick={ refreshList }>
            <RefreshCw
              size={ 16 }
              className={ `${ refreshing ? "spinning" : "" }` }
            />
          </Icon>
          <Icon onClick={ goToSetting }>
            <Settings size={ 16 } />
          </Icon>
        </div>
      </div>
      <div
        className="overflow-y-auto mt-[var(--app-toolbar-height)] pb-3 pl-3 height-[calc(100% - var(--app-toolbar-height))]"
        ref={ listRef }
      >
        <h2 className="mt-8 mb-2 px-4 text-lg font-semibold tracking-tight">Collections</h2>
        <div>
          <div
            className={ classNames(
              "w-full h-8 px-2 flex items-center rounded-md cursor-pointer mt-[2px] group",
              {
                "bg-primary text-primary-foreground": isToday
              }
            ) }
            onClick={ () => {
              store.setChannel(null);
              store.setViewMeta({
                title: "Today",
                isToday: true,
                isAll: false
              });
              navigate(RouteConfig.TODAY);
            } }
          >
            <span className="h-4 w-4 rounded mr-2">
              <Haze size={ 16 } />
            </span>
            <span className="grow shrink basis-[0%] overflow-hidden text-ellipsis whitespace-nowrap text-sm">
              Today
            </span>
            { meta.today.unread > 0 && (
              <span
                className={ classNames(
                  "px-1 min-w-[1rem] h-4 leading-4 text-center text-[10px]",
                  {
                    "text-primary-foreground": isToday
                  }
                ) }
              >
                { meta.today.unread }
              </span>
            ) }
          </div>
          <div
            className={ classNames(
              "w-full h-8 px-2 flex items-center rounded-md cursor-pointer mt-[2px] group",
              {
                "bg-primary text-primary-foreground": isAll
              }
            ) }
            onClick={ () => {
              store.setChannel(null);
              store.setViewMeta({
                title: "All Items",
                isToday: false,
                isAll: true
              });
              navigate(RouteConfig.ALL);
            } }
          >
            <span className="h-4 w-4 rounded mr-2">
              <Coffee size={ 16 } />
            </span>
            <span className="grow shrink basis-[0%] overflow-hidden text-ellipsis whitespace-nowrap text-sm">
              All Items
            </span>
            { meta.total.unread > 0 && (
              <span
                className={ classNames(
                  "px-1 min-w-[1rem] h-4 leading-4 text-center text-[10px]",
                  {
                    "text-primary-foreground": isAll
                  }
                ) }
              >
                { meta.total.unread }
              </span>
            ) }
          </div>
        </div>
        <h2 className="mt-8 mb-2 px-4 text-lg font-semibold tracking-tight">Feeds</h2>
        <ContextMenu onOpenChange={ handleContextMenuChange }>
          <ContextMenuTrigger className="w-full">
            <TestTree treeData={ treeData } />
          </ContextMenuTrigger>
          <ContextMenuContent>
            { store.feedContextMenuTarget?.item_type === "folder" && (
              <>
                <ContextMenuItem
                  onSelect={ () => setEditFolderDialogStatus(true) }
                >
                  Edit
                </ContextMenuItem>
              </>
            ) }
            { store.feedContextMenuTarget && (
              <>
                { store.feedContextMenuTarget?.item_type !== "folder" && (
                  <>
                    <ContextMenuItem
                      onClick={ () =>
                        store.feedContextMenuTarget?.link &&
                        open(store.feedContextMenuTarget?.link)
                      }
                    >
                      Open { new URL(store.feedContextMenuTarget?.link).host }
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={ () =>
                        reloadFeedIcon(store.feedContextMenuTarget)
                      }
                    >
                      Reload Icon
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={ () => setEditFeedStatus(true) }>
                      Detail
                    </ContextMenuItem>
                    <ContextMenuItem onClick={ () => setModalStatus(true) }>
                      Unsubscribe
                    </ContextMenuItem>
                  </>
                ) }
              </>
            ) }
          </ContextMenuContent>
        </ContextMenu>
        <DialogUnsubscribeFeed
          feed={ store.feedContextMenuTarget }
          dialogStatus={ showStatus }
          setDialogStatus={ setModalStatus }
          afterConfirm={ getList }
          afterCancel={ () => store.setFeedContextMenuTarget(null) }
        ></DialogUnsubscribeFeed>
        <DialogEditFeed
          feed={ store.feedContextMenuTarget }
          dialogStatus={ editFeedStatus }
          setDialogStatus={ setEditFeedStatus }
          afterConfirm={ getList }
          afterCancel={ () => store.setFeedContextMenuTarget(null) }
        ></DialogEditFeed>
        <AddFolder
          action="edit"
          folder={ store.feedContextMenuTarget }
          dialogStatus={ editFolderDialogStatus }
          setDialogStatus={ setEditFolderDialogStatus }
          afterConfirm={ getList }
          afterCancel={ () => store.setFeedContextMenuTarget(null) }
        />
      </div>
      { refreshing && (
        <div className="sticky left-0 right-0 bottom-0 p-2 text-right">
          <span className="text-xs mr-3">Syncing...</span>
          <span className="text-xs text-foreground">
            { done }/{ channelList.length }
          </span>
        </div>
      ) }
    </div>
  );
};

export { ChannelList };
