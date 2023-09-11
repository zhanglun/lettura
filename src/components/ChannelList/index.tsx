import React, { useCallback, useEffect, useRef, useState } from "react";
import { useMatch, useNavigate } from "react-router-dom";
import { Folder, RefreshCw, Settings, Coffee, Haze } from "lucide-react";
import classNames from "classnames";
import { listen } from "@tauri-apps/api/event";
import { RouteConfig } from "@/config";
import { Channel } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import { useBearStore } from "@/stores";
import { AddFeedChannel } from "../AddFeed";
import { AddFolder } from "../AddFolder";
import { TestTree } from "./TestTree";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Icon } from "../Icon";
import { DialogUnsubscribeFeed } from "../SettingPanel/Content/DialogUnsubscribeFeed";
import { useModal } from "../Modal/useModal";
import { open } from "@tauri-apps/api/shell";
import { DialogEditFeed } from "@/components/SettingPanel/Content/DialogEditFeed";
import { useQuery } from "@/helpers/parseXML";
import styles from "./channel.module.scss";
import { useRefresh } from "./useRefresh";
import { TooltipBox } from "../TooltipBox";

const ChannelList = (): JSX.Element => {
  const isToday = useMatch(RouteConfig.TODAY);
  const isAll = useMatch(RouteConfig.ALL);
  const navigate = useNavigate();
  const [addFolderDialogStatus, setAddFolderDialogStatus] = useModal();
  const [editFolderDialogStatus, setEditFolderDialogStatus] = useModal();
  const [editFeedStatus, setEditFeedStatus] = useModal();
  const [showStatus, setModalStatus] = useModal();
  const [treeData, setTreeData] = useState<any>([]);
  const [
    feedList,
    setFeedList,
    getFeedList,
    refreshing,
    setRefreshing,
    done,
    setDone,
    startFresh,
  ] = useRefresh();
  const store = useBearStore((state) => ({
    feed: state.feed,
    setFeed: state.setFeed,
    updateFeed: state.updateFeed,
    feedContextMenuTarget: state.feedContextMenuTarget,
    setFeedContextMenuTarget: state.setFeedContextMenuTarget,

    setViewMeta: state.setViewMeta,
  }));
  const [, , channelUuid] = useQuery();
  const [meta, setMeta] = useState<{
    [key: string]: { [key: string]: number };
  }>({
    total: { unread: 0 },
    today: { unread: 0 },
  });

  const initCollectionMetas = () => {
    dataAgent.getCollectionMetas().then((res) => {
      console.log("%c Line:19 🍅 res", "color:#ed9ec7", res);
      setMeta({
        today: { unread: res.today },
        total: { unread: res.total },
      });
    });
  };

  useEffect(() => {
    initCollectionMetas();
  }, []);

  useEffect(() => {
    initCollectionMetas();
    console.log("store.feed", store.feed);
  }, [store.feed]);

  const updateCount = (
    feedList: Channel[],
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

    feedList.forEach((channel) => {
      let target: any = channel.uuid === uuid ? channel : null;
      let child: any =
        channel.children.find((item) => item.uuid === uuid) || null;

      if (child) {
        target = channel;
      }

      if (!(target || child)) {
        return channel;
      }

      strategy(action, target);
      strategy(action, child);

      channel.unread = Math.max(0, channel.unread);

      return channel;
    });

    setFeedList([...feedList]);

    strategy(action, meta.total);

    if (isToday) {
      strategy(action, meta.today);
    }

    console.log("%c Line:137 🥚 meta", "color:#7f2b82", meta);

    setMeta(meta);
  };

  useEffect(() => {
    getFeedList();
    const unsubscribeGetChannels = busChannel.on("getChannels", () => {
      getFeedList();
    });

    return () => {
      unsubscribeGetChannels();
    };
  }, []);

  const reloadFeedIcon = (feed: Channel | null) => {
    feed &&
      dataAgent.updateIcon(feed.uuid, feed.link).then((res) => {
        console.log("%c Line:139 🍷 res", "color:#ea7e5c", res);
        feed.logo = res;
      });
  };

  useEffect(() => {
    const unsubscribeUpdateCount = busChannel.on(
      "updateChannelUnreadCount",
      ({ uuid, isToday, action, count }) => {
        console.log(
          "🚀 ~ file: index.tsx:138 ~ useEffect ~ updateChannelUnreadCount"
        );
        updateCount(feedList, uuid, isToday, action, count);
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
  }, [feedList]);

  useEffect(() => {
    feedList.forEach((feed) => {
      if (feed.uuid === channelUuid) {
        store.setFeed(feed);
      }
    });
  }, [channelUuid, feedList]);

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
    const treeData = feedList.reduce(
      (acu, cur) => {
        // @ts-ignore
        acu.root.children.push(cur.uuid);
        acu[cur.uuid] = {
          index: cur.uuid,
          isFolder: cur.item_type === "folder",
          children: cur.children.map((c: Channel) => c.uuid),
          title: cur.title,
          data: cur,
        };

        cur.children.forEach((child: Channel) => {
          acu[child.uuid] = {
            index: child.uuid,
            children: [],
            title: child.title,
            data: child,
          };
        });

        return acu;
      },
      {
        root: {
          index: "root",
          isFolder: true,
          children: [],
          data: "Root item",
        },
      } as any
    );

    setTreeData(treeData);
  }, [feedList]);

  return (
    <div
      className="relative grid grid-col w-[var(--app-channel-width)] h-full select-none border-r border-border text-[hsl(var(--foreground))]
  bg-[hsl(var(--background))]"
    >
      <div className={styles.header}>
        <div />
        <div className={styles.toolbar}>
          <AddFeedChannel />
          <AddFolder
            action="add"
            dialogStatus={addFolderDialogStatus}
            setDialogStatus={setAddFolderDialogStatus}
            afterConfirm={getFeedList}
            afterCancel={() => store.setFeedContextMenuTarget(null)}
            trigger={
              <Icon>
                <TooltipBox message="Add folder">
                  <Folder size={16} />
                </TooltipBox>
              </Icon>
            }
          />

          <Icon onClick={startFresh}>
            <RefreshCw
              size={16}
              className={`${refreshing ? "spinning" : ""}`}
            />
          </Icon>
          <Icon onClick={goToSetting}>
            <Settings size={16} />
          </Icon>
        </div>
      </div>
      <div
        className="overflow-y-auto pb-3 pl-3 height-[calc(100% - var(--app-toolbar-height))]"
        ref={listRef}
      >
        <h2 className="mt-6 mb-2 px-4 text-lg font-semibold tracking-tight">
          Collections
        </h2>
        <div>
          <div
            className={classNames(
              "w-full h-8 px-2 flex items-center rounded-md cursor-pointer mt-[2px] group",
              {
                "bg-primary text-primary-foreground": isToday,
              }
            )}
            onClick={() => {
              store.setFeed(null);
              store.setViewMeta({
                title: "Today",
                isToday: true,
                isAll: false,
              });
              navigate(RouteConfig.TODAY);
            }}
          >
            <span className="h-4 w-4 rounded mr-2">
              <Haze size={16} />
            </span>
            <span className="grow shrink basis-[0%] overflow-hidden text-ellipsis whitespace-nowrap text-sm">
              Today
            </span>
            {meta.today.unread > 0 && (
              <span
                className={classNames(
                  "px-1 min-w-[1rem] h-4 leading-4 text-center text-[10px]",
                  {
                    "text-primary-foreground": isToday,
                  }
                )}
              >
                {meta.today.unread}
              </span>
            )}
          </div>
          <div
            className={classNames(
              "w-full h-8 px-2 flex items-center rounded-md cursor-pointer mt-[2px] group",
              {
                "bg-primary text-primary-foreground": isAll,
              }
            )}
            onClick={() => {
              store.setFeed(null);
              store.setViewMeta({
                title: "All Items",
                isToday: false,
                isAll: true,
              });
              navigate(RouteConfig.ALL);
            }}
          >
            <span className="h-4 w-4 rounded mr-2">
              <Coffee size={16} />
            </span>
            <span className="grow shrink basis-[0%] overflow-hidden text-ellipsis whitespace-nowrap text-sm">
              All Items
            </span>
            {meta.total.unread > 0 && (
              <span
                className={classNames(
                  "px-1 min-w-[1rem] h-4 leading-4 text-center text-[10px]",
                  {
                    "text-primary-foreground": isAll,
                  }
                )}
              >
                {meta.total.unread}
              </span>
            )}
          </div>
        </div>
        <h2 className="mt-6 mb-2 px-4 text-lg font-semibold tracking-tight">
          Feeds
        </h2>
        <ContextMenu onOpenChange={handleContextMenuChange}>
          <ContextMenuTrigger className="w-full">
            <TestTree treeData={treeData} activeUuid={store?.feed?.uuid} />
          </ContextMenuTrigger>
          <ContextMenuContent>
            {store.feedContextMenuTarget?.item_type === "folder" && (
              <>
                <ContextMenuItem
                  onSelect={() => setEditFolderDialogStatus(true)}
                >
                  Edit
                </ContextMenuItem>
              </>
            )}
            {store.feedContextMenuTarget && (
              <>
                {store.feedContextMenuTarget?.item_type !== "folder" && (
                  <>
                    <ContextMenuItem
                      onClick={() =>
                        store.feedContextMenuTarget?.link &&
                        open(store.feedContextMenuTarget?.link)
                      }
                    >
                      Open {new URL(store.feedContextMenuTarget?.link).host}
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={() =>
                        reloadFeedIcon(store.feedContextMenuTarget)
                      }
                    >
                      Reload Icon
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => setEditFeedStatus(true)}>
                      Detail
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => setModalStatus(true)}>
                      Unsubscribe
                    </ContextMenuItem>
                  </>
                )}
              </>
            )}
          </ContextMenuContent>
        </ContextMenu>
        <DialogUnsubscribeFeed
          feed={store.feedContextMenuTarget}
          dialogStatus={showStatus}
          setDialogStatus={setModalStatus}
          afterConfirm={getFeedList}
          afterCancel={() => store.setFeedContextMenuTarget(null)}
        />
        <DialogEditFeed
          feed={store.feedContextMenuTarget}
          dialogStatus={editFeedStatus}
          setDialogStatus={setEditFeedStatus}
          afterConfirm={getFeedList}
          afterCancel={() => store.setFeedContextMenuTarget(null)}
        />
        <AddFolder
          action="edit"
          folder={store.feedContextMenuTarget}
          dialogStatus={editFolderDialogStatus}
          setDialogStatus={setEditFolderDialogStatus}
          afterConfirm={getFeedList}
          afterCancel={() => store.setFeedContextMenuTarget(null)}
        />
      </div>
      {refreshing && (
        <div className="sticky left-0 right-0 bottom-0 p-2 text-right">
          <span className="text-xs mr-3">Syncing...</span>
          <span className="text-xs text-foreground">
            {done}/{feedList.length}
          </span>
        </div>
      )}
    </div>
  );
};

export { ChannelList };
