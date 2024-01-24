import React, { useCallback, useEffect, useRef } from "react";
import { useMatch, useNavigate } from "react-router-dom";
import {
  RefreshCw,
  Coffee,
  Haze,
  FolderPlus,
  CheckCircle,
  CheckCheck,
  Pencil,
  Trash2,
  Rss,
  Image,
  ExternalLink,
  BellOff,
  FileText,
  Link,
  Link2, Star,
} from "lucide-react";
import classNames from "classnames";
import { listen } from "@tauri-apps/api/event";
import { RouteConfig } from "@/config";
import { FeedResItem, Folder } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import { useBearStore } from "@/stores";
import { AddFeedChannel } from "../AddFeed";
import { AddFolder } from "../AddFolder";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Icon } from "../Icon";
import { DialogUnsubscribeFeed } from "@/layout/Setting/Content/DialogUnsubscribeFeed";
import { useModal } from "../Modal/useModal";
import { open } from "@tauri-apps/api/shell";
import { DialogEditFeed } from "@/layout/Setting/Content/DialogEditFeed";
import { useQuery } from "@/helpers/parseXML";
import { useRefresh } from "./useRefresh";
import { TooltipBox } from "../TooltipBox";
import { ListContainer } from "./ListContainer";
import { copyText } from "@/helpers/copyText";
import { toast } from "sonner";
import { DialogDeleteFolder } from "@/layout/Setting/Content/DialogDeleteFolder";
import { loadFeed } from "@/hooks/useLoadFeed";
import { SpaceSwitcher } from "../SpaceSwitcher";

const spaces = [
  {
    label: "Lettura",
    route: RouteConfig.LOCAL_TODAY,
    // icon: ;
  },
  {
    label: "FreshRSS",
    route: RouteConfig.SERVICE_FRESHRSS,
    // icon: ;
  }
]

const ChannelList = (): JSX.Element => {
  const isToday = useMatch(RouteConfig.LOCAL_TODAY);
  const isAll = useMatch(RouteConfig.LOCAL_ALL);
  const isStarred = useMatch(RouteConfig.LOCAL_STARRED);
  const navigate = useNavigate();
  const [addFolderDialogStatus, setAddFolderDialogStatus] = useModal();
  const [editFolderDialogStatus, setEditFolderDialogStatus] = useModal();
  const [deleteFolderStatus, setDeleteFolderStatus] = useModal();
  const [editFeedStatus, setEditFeedStatus] = useModal();
  const [showStatus, setModalStatus] = useModal();
  const [
    feedList,
    setFeedList,
    getFeedList,
    refreshing,
    setRefreshing,
    done,
    setDone,
    startRefresh,
  ] = useRefresh();
  const store = useBearStore((state) => ({
    feed: state.feed,
    setFeed: state.setFeed,
    updateFeed: state.updateFeed,
    feedContextMenuTarget: state.feedContextMenuTarget,
    setFeedContextMenuTarget: state.setFeedContextMenuTarget,
    setFeedContextMenuStatus: state.setFeedContextMenuStatus,
    articleList: state.articleList,
    setArticleList: state.setArticleList,

    setViewMeta: state.setViewMeta,
    collectionMeta: state.collectionMeta,
    initCollectionMetas: state.initCollectionMetas,
    syncArticles: state.syncArticles,
  }));


  const [, , feedUuid] = useQuery();

  useEffect(() => {
    store.initCollectionMetas();
  }, []);

  useEffect(() => {
    getFeedList();
    const unsubscribeGetChannels = busChannel.on("getChannels", () => {
      getFeedList();
    });

    return () => {
      unsubscribeGetChannels();
    };
  }, []);

  const reloadFeedIcon = (feed: FeedResItem | null) => {
    feed &&
      dataAgent.updateIcon(feed.uuid, feed.link).then((res) => {
        feed.logo = res;
      });
  };

  const reloadFeedData = (feed: FeedResItem | null) => {
    if (feed) {
      loadFeed(feed, store.syncArticles, () => {
        // TODO: get article List
      }, () => {

      });
    }
  };

  const markAllRead = () => {
    if (store.feedContextMenuTarget) {
      const { uuid } = store.feedContextMenuTarget;

      toast.promise(
        dataAgent.markAllRead({ uuid, isToday: !!isToday, isAll: !!isAll }),
        {
          loading: "Loading...",
          success: (data) => {
            getFeedList();
            store.initCollectionMetas();

            if (store.feed?.uuid === uuid) {
              store.setArticleList(
                store.articleList.map((_) => {
                  _.read_status = 2;
                  return _;
                })
              );
            }
            return `Done!😀`;
          },
          error: "Error🤢",
        }
      );
    }
  };

  useEffect(() => {
    feedList.forEach((feed) => {
      if (feed.uuid === feedUuid) {
        store.setFeed(feed);
      }
    });
  }, [feedList]);

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
    store.setFeedContextMenuStatus(status);
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

  const afterDeleteFolder = () => {
    if (store.feedContextMenuTarget) {
      const { uuid } = store.feedContextMenuTarget;
      if (store.feed?.uuid === uuid) {
        store.setArticleList([]);
      }
      store.setFeedContextMenuTarget(null);
    }

    getFeedList();
  };

  const afterUnsubscribeFeed = () => {
    if (store.feedContextMenuTarget) {
      const { uuid } = store.feedContextMenuTarget;
      if (store.feed?.uuid === uuid) {
        store.setArticleList([]);
      }
      store.setFeedContextMenuTarget(null);
    }

    getFeedList();
  };

  return (
    <div
      className="relative flex flex-col w-[var(--app-feedlist-width)] h-full select-none border-r border-border text-[hsl(var(--foreground))]
  bg-white dark:bg-zinc-800"
    >
      <div className="flex items-center justify-end h-[var(--app-toolbar-height)] px-2 py-0 bg-[var(--background)] border-b">
        <SpaceSwitcher isCollapsed={false} spaces={spaces} />
        <div className="flex justify-end">
          <AddFeedChannel />
          <AddFolder
            action="add"
            dialogStatus={addFolderDialogStatus}
            setDialogStatus={setAddFolderDialogStatus}
            afterConfirm={getFeedList}
            afterCancel={() => store.setFeedContextMenuTarget(null)}
            trigger={
              <TooltipBox content="Add folder">
                <Icon>
                  <FolderPlus size={16} />
                </Icon>
              </TooltipBox>
            }
          />
          <TooltipBox content="Update">
            <Icon onClick={startRefresh}>
              <RefreshCw
                size={16}
                className={`${refreshing ? "spinning" : ""}`}
              />
            </Icon>
          </TooltipBox>
        </div>
      </div>
      <div
        className="flex-1 overflow-y-auto pb-2 px-1 height-[calc(100% - var(--app-toolbar-height))]"
        ref={listRef}
      >
        <h2 className="mt-6 mb-2 px-4 text-lg font-semibold tracking-tight">
          Collections
        </h2>
        <div>
          <div
            className={classNames(
              "w-full h-8 px-4 flex items-center rounded-md cursor-pointer mt-[2px] group",
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
              navigate(RouteConfig.LOCAL_TODAY);
            }}
          >
            <span className="h-4 w-4 rounded mr-2">
              <Haze size={16} />
            </span>
            <span className="grow shrink basis-[0%] overflow-hidden text-ellipsis whitespace-nowrap text-sm">
              Today
            </span>
            {store.collectionMeta.today.unread > 0 && (
              <span
                className={classNames(
                  "-mr-2 min-w-[1rem] h-4 leading-4 text-center text-[10px]",
                  {
                    "text-primary-foreground": isToday,
                  }
                )}
              >
                {store.collectionMeta.today.unread}
              </span>
            )}
          </div>
          <div
            className={classNames(
              "w-full h-8 px-4 flex items-center rounded-md cursor-pointer mt-[2px] group",
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
              navigate(RouteConfig.LOCAL_ALL);
            }}
          >
            <span className="h-4 w-4 rounded mr-2">
              <Coffee size={16} />
            </span>
            <span className="grow shrink basis-[0%] overflow-hidden text-ellipsis whitespace-nowrap text-sm">
              All Items
            </span>
            {store.collectionMeta.total.unread > 0 && (
              <span
                className={classNames(
                  "-mr-2 min-w-[1rem] h-4 leading-4 text-center text-[10px]",
                  {
                    "text-primary-foreground": isAll,
                  }
                )}
              >
                {store.collectionMeta.total.unread}
              </span>
            )}
          </div>
          <div
            className={classNames(
              "w-full h-8 px-4 flex items-center rounded-md cursor-pointer mt-[2px] group",
              {
                "bg-primary text-primary-foreground": isStarred,
              }
            )}
            onClick={() => {
              store.setFeed(null);
              store.setViewMeta({
                title: "Starred",
                isToday: false,
                isAll: false,
                isStarred: true,
              });
              navigate(RouteConfig.LOCAL_STARRED);
            }}
          >
            <span className="h-4 w-4 rounded mr-2">
              <Star size={16} />
            </span>
            <span className="grow shrink basis-[0%] overflow-hidden text-ellipsis whitespace-nowrap text-sm">
              Starred
            </span>
          </div>
        </div>
        <h2 className="mt-6 mb-2 px-4 text-lg font-semibold tracking-tight">
          Feeds
        </h2>
        <ContextMenu onOpenChange={handleContextMenuChange}>
          <ContextMenuTrigger>
            <ListContainer />
          </ContextMenuTrigger>
          <ContextMenuContent key={store.feedContextMenuTarget?.uuid || "0"}>
            <ContextMenuItem
              onClick={() => {
                markAllRead();
              }}
            >
              <CheckCheck size={14} className="mr-2" /> Mark all as read
            </ContextMenuItem>
            <ContextMenuSeparator />
            {store.feedContextMenuTarget?.item_type === "folder" && (
              <>
                <ContextMenuItem
                  onSelect={() => setEditFolderDialogStatus(true)}
                >
                  <Pencil size={14} className="mr-2" /> Edit folder
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  onClick={() => setDeleteFolderStatus(true)}
                  className="text-red-600"
                >
                  <Trash2 size={14} className="mr-2" /> Delete folder
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
                      <ExternalLink size={14} className="mr-2" /> Open Home Page
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={() =>
                        store.feedContextMenuTarget?.feed_url &&
                        copyText(store.feedContextMenuTarget?.feed_url).then(
                          () =>
                            toast.message("Current URL copied to clipboard", {
                              description: "Paste it wherever you like",
                            })
                        )
                      }
                    >
                      <Link size={14} className="mr-2" /> Copy Feed URL
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() =>
                        store.feedContextMenuTarget?.link &&
                        copyText(store.feedContextMenuTarget?.link).then(() =>
                          toast.message("Current URL copied to clipboard", {
                            description: "Paste it wherever you like",
                          })
                        )
                      }
                    >
                      <Link2 size={14} className="mr-2" /> Copy Home Page URL
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={() =>
                        reloadFeedIcon(store.feedContextMenuTarget)
                      }
                    >
                      <Image size={14} className="mr-2" /> Reload icon
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() =>
                        reloadFeedData(store.feedContextMenuTarget)
                      }
                    >
                      <Rss size={14} className="mr-2" /> Reload feeds
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => setEditFeedStatus(true)}>
                      <FileText size={14} className="mr-2" /> View detail
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={() => setModalStatus(true)}
                      className="text-red-600"
                    >
                      <BellOff size={14} className="mr-2" /> Unsubscribe
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
          afterConfirm={afterUnsubscribeFeed}
          afterCancel={() => store.setFeedContextMenuTarget(null)}
        />
        <DialogDeleteFolder
          folder={store.feedContextMenuTarget as FeedResItem & Folder}
          dialogStatus={deleteFolderStatus}
          setDialogStatus={setDeleteFolderStatus}
          afterConfirm={afterDeleteFolder}
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
