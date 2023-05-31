import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tree } from "@douyinfe/semi-ui";
import { RouteConfig } from "../../config";
import { Channel } from "../../db";
import * as dataAgent from "../../helpers/dataAgent";
import { busChannel } from "../../helpers/busChannel";
import { AddFeedChannel } from "../AddFeed";
import { AddFolder } from "../AddFolder";
import pLimit from "p-limit";
import { useBearStore } from "../../hooks/useBearStore";

import styles from "./channel.module.scss";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  RefreshCw,
  Settings
} from "lucide-react";

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

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ChannelList = (): JSX.Element => {
  const navigate = useNavigate();
  const [addFolderDialogStatus, setAddFolderDialogStatus] = useModal();
  const [editFolderDialogStatus, setEditFolderDialogStatus] = useModal();
  const [editFeedStatus, setEditFeedStatus] = useModal();
  const [showStatus, setModalStatus] = useModal();
  const [refreshing, setRefreshing] = useState(false);
  const [channelList, setChannelList] = useState<Channel[]>([]);
  const [treeData, setTreeData] = useState<any>([]);
  const [done, setDone] = useState(0);
  const store = useBearStore((state) => ({
    channel: state.channel,
    setChannel: state.setChannel,
    feedContextMenuTarget: state.feedContextMenuTarget,
    setFeedContextMenuTarget: state.setFeedContextMenuTarget
  }));
  const query = useQuery();
  const channelUuid = query.get("channelUuid");

  const updateCount = (
    channelList: Channel[],
    uuid: string,
    action: string,
    count: number
  ) => {
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

      switch (action) {
        case "increase": {
          target ? (target.unread += count) : null;
          child ? (child.unread += count) : null;
          break;
        }
        case "decrease": {
          target ? (target.unread -= count) : null;
          child ? (child.unread -= count) : null;
          break;
        }
        case "upgrade": {
          // TODO
          break;
        }

        case "set": {
          target ? (target.unread = count) : null;
          child ? (child.unread = count) : null;
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
    return Promise.all([dataAgent.getFeeds(), dataAgent.getUnreadTotal()]).then(
      ([channel, unreadTotal]) => {
        channel = initUnreadCount(channel, unreadTotal);
        console.log("channel", channel);
        setChannelList(channel);
      }
    );
  };

  const reloadFeedIcon = (feed: Channel | null) => {
    feed && dataAgent.updateIcon(feed.uuid, feed.link).then((res) => {
      console.log("%c Line:139 🍷 res", "color:#ea7e5c", res);
      feed.icon = res;
    });
  }

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
    setRefreshing(true);

    dataAgent.getUserConfig().then((config) => {
      const { threads = 5 } = config;
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
      return (
        <>
          <span className="h-4 w-4 rounded mr-2" onClick={onExpand}>
            <ChevronDown size={16} />
          </span>
          <span className="h-4 w-4 rounded mr-3">
            <FolderOpen size={16} />
          </span>
        </>
      );
    } else {
      return (
        <>
          <span className="h-4 w-4 rounded mr-2" onClick={onExpand}>
            <ChevronRight size={16} />
          </span>
          <span className="h-4 w-4 rounded mr-3">
            <Folder size={16} />
          </span>
        </>
      );
    }
  };

  const renderLabel = ({
                         className,
                         onExpand,
                         data,
                         level,
                         expandIcon,
                         expandStatus
                       }: any) => {
    const { uuid } = data;
    // const isLeaf = !(data.children && data.children.length);
    const isActive = (store?.channel?.uuid || channelUuid) === uuid;

    return (
      <FeedItem
        feed={data}
        className={className}
        isActive={isActive}
        level={level}
        expandStatus={expandStatus}
        onExpand={onExpand}
      />
    );
  };

  const renderTree = (): JSX.Element => {
    function onDrop(info: any) {
      const { dropToGap, node, dragNode } = info;
      const dropKey = node.key;
      const dragKey = dragNode.key;
      const dropPos = node.pos.split("-");
      const dropPosition =
        info.dropPosition - Number(dropPos[dropPos.length - 1]);

      let data = [...treeData];
      const loop = (
        data: Channel[],
        key: string,
        callback: (item: Channel, idx: number, arr: Channel[]) => void
      ) => {
        data.forEach((item, ind, arr) => {
          // @ts-ignore
          if (item.key === key) return callback(item, ind, arr);
          if (item.children) return loop(item.children, key, callback);
        });
      };
      let dragObj: any;
      loop(data, dragKey, (item, ind, arr) => {
        arr.splice(ind, 1);
        dragObj = item;
      });

      if (!dropToGap) {
        // inset into the dropPosition
        loop(data, dropKey, (item, ind, arr) => {
          if (item.item_type === "folder") {
            item.children = item.children || [];
            item.children.push(dragObj);
          }
        });
      } else if (dropPosition === 1 && node.children && node.expanded) {
        // has children && expanded and drop into the node bottom gap
        // insert to the top
        loop(data, dropKey, (item: Channel) => {
          item.children = item.children || [];
          item.children.unshift(dragObj);
        });
      } else {
        let dropNodeInd: number = 0;
        let dropNodePosArr: Channel[] = [];

        loop(data, dropKey, (item, ind, arr) => {
          dropNodePosArr = arr;
          dropNodeInd = ind;
        });

        if (dropPosition === -1) {
          // insert to top
          dropNodePosArr.splice(dropNodeInd, 0, dragObj);
        } else {
          // insert to bottom
          dropNodePosArr.splice(dropNodeInd + 1, 0, dragObj);
        }
      }

      setTreeData(data);

      const updateSort = (list: any[]) => {
        return list.map((channel: Channel, idx: number) => {
          channel.sort = idx;

          if (channel.children) {
            channel.children = updateSort(channel.children);
          }
          return channel;
        });
      };

      console.log("updateSort(data)", data);

      let res: any[] = [];
      const createSortsMeta = (
        parent_uuid: string,
        list: Channel[],
        res: any[]
      ) => {
        list.forEach((item, idx) => {
          if (parent_uuid) {
            res.push({
              parent_uuid,
              child_uuid: item.uuid,
              sort: idx,
              item_type: item.item_type
            });
          } else {
            res.push({
              parent_uuid: "",
              child_uuid: item.uuid,
              sort: idx,
              item_type: item.item_type
            });
          }

          if (item.children) {
            createSortsMeta(item.uuid, item.children, res);
          }
        });
      };

      createSortsMeta("", updateSort(data), res);
      // setChannelList(updateSort(data));
      setTreeData(data);

      console.log("res", res);

      dataAgent.updateFeedSort(res).then(() => {
        console.log("====>after sort", data);
      });
    }

    return (
      <div>
        <Tree
          treeData={treeData}
          draggable={true}
          onDrop={onDrop}
          renderFullLabel={renderLabel}
          directory
          aria-label={"tree"}
        ></Tree>
      </div>
    );
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

  const handleEditFolder = () => {
  };

  useEffect(() => {
    if (listRef.current) {
      const $list = listRef.current as HTMLDivElement;
      $list.addEventListener("scroll", handleListScroll);
    }
  }, []);

  useEffect(() => {
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

    setTreeData(channelList.map((item) => format(item)));
  }, [channelList]);

  return (
    <div
      className="relative flex flex-col w-[var(--app-channel-width)] h-full select-none border-r border-slate-100 bg-feed-list-bg">
      <div className={`sticky-header ${styles.header}`}>
        <div />
        <div className={styles.toolbar}>
          <AddFeedChannel />
          <AddFolder
            action="add"
            dialogStatus={addFolderDialogStatus}
            setDialogStatus={setAddFolderDialogStatus}
            afterConfirm={getList}
            afterCancel={() => store.setFeedContextMenuTarget(null)}
            trigger={
              <Icon>
                <Folder size={16} />
              </Icon>
            }
          />

          <Icon onClick={refreshList}>
            <RefreshCw
              size={16}
              className={`${refreshing ? "spinning" : ""}`}
            />
          </Icon>
          <Icon onClick={goToSetting}>
            <Settings size={16} />
          </Icon>
          {/* <SettingDialog /> */}
        </div>
      </div>
      <div
        className="overflow-y-auto mt-[var(--app-toolbar-height)] pb-3 pl-3 height-[calc(100% - var(--app-toolbar-height))]"
        ref={listRef}
      >
        <ContextMenu onOpenChange={handleContextMenuChange}>
          <ContextMenuTrigger className="w-full">
            {renderTree()}
          </ContextMenuTrigger>
          <ContextMenuContent>
            {store.feedContextMenuTarget?.item_type === "folder" && (
              <>
                <ContextMenuItem onSelect={() => setEditFolderDialogStatus(true)}>
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
                    <ContextMenuItem onClick={() => reloadFeedIcon(store.feedContextMenuTarget)}>Reload Icon</ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => setEditFeedStatus(true)}>Detail</ContextMenuItem>
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
          afterConfirm={getList}
          afterCancel={() => store.setFeedContextMenuTarget(null)}
        ></DialogUnsubscribeFeed>
        <DialogEditFeed feed={store.feedContextMenuTarget} dialogStatus={editFeedStatus}
                        setDialogStatus={setEditFeedStatus} afterConfirm={getList}
                        afterCancel={() => store.setFeedContextMenuTarget(null)}></DialogEditFeed>
        <AddFolder
          action="edit"
          folder={store.feedContextMenuTarget}
          dialogStatus={editFolderDialogStatus}
          setDialogStatus={setEditFolderDialogStatus}
          afterConfirm={getList}
          afterCancel={() => store.setFeedContextMenuTarget(null)}
        />
      </div>
      {refreshing && (
        <div className="sticky left-0 right-0 bottom-0 p-2 text-right">
          <span className="text-xs mr-3">Syncing...</span>
          <span className="text-xs text-foreground">
            {done}/{channelList.length}
          </span>
        </div>
      )}
    </div>
  );
};

export { ChannelList };
