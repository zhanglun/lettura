import React, { useCallback, useEffect, useRef, useState } from "react";
import { useMatch } from "react-router-dom";
import {
  CheckCheck,
  Pencil,
  Trash2,
  Rss,
  Image,
  ExternalLink,
  BellOff,
  FileText,
  Link,
  Link2,
} from "lucide-react";
import { listen } from "@tauri-apps/api/event";
import { RouteConfig } from "@/config";
import { FeedResItem, FolderResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import { useBearStore } from "@/stores";
import { AddFolder } from "../AddFolder";
import { ContextMenu } from "@radix-ui/themes";
import { DialogUnsubscribeFeed } from "@/layout/Setting/Content/DialogUnsubscribeFeed";
import { open } from "@tauri-apps/api/shell";
import { DialogEditFeed } from "@/layout/Setting/Content/DialogEditFeed";
import { useQuery } from "@/helpers/parseXML";
import { ListContainer } from "./ListContainer";
import { copyText } from "@/helpers/copyText";
import { toast } from "sonner";
import { DialogDeleteFolder } from "@/layout/Setting/Content/DialogDeleteFolder";
import { loadFeed } from "@/hooks/useLoadFeed";
import clsx from "clsx";
import { useScrollTop } from "@/hooks/useScrollTop";
import { useShallow } from "zustand/react/shallow";
import { CollectionMeta } from "./CollectionMeta";
import { useTranslation } from "react-i18next";

const ChannelList = (): JSX.Element => {
  console.log("ChannelList rendered")
  const { t } = useTranslation();
  const isToday = useMatch(RouteConfig.LOCAL_TODAY);
  const isAll = useMatch(RouteConfig.LOCAL_ALL);
  const [editFolderDialogStatus, setEditFolderDialogStatus] = useState(false);
  const [deleteFolderStatus, setDeleteFolderStatus] = useState(false);
  const [editFeedStatus, setEditFeedStatus] = useState(false);
  const [showStatus, setModalStatus] = useState(false);
  const store = useBearStore(
    useShallow((state) => ({
      feed: state.feed,
      setFeed: state.setFeed,
      updateFeed: state.updateFeed,

      feedContextMenuTarget: state.feedContextMenuTarget,
      setFeedContextMenuTarget: state.setFeedContextMenuTarget,
      setFeedContextMenuStatus: state.setFeedContextMenuStatus,

      articleList: state.articleList,
      setArticleList: state.setArticleList,

      syncArticles: state.syncArticles,

      subscribes: state.subscribes,
      getSubscribes: state.getSubscribes,

      globalSyncStatus: state.globalSyncStatus,
    }))
  );

  const [, , feedUuid] = useQuery();
  const [scrollTop, scrollTopProps] = useScrollTop();

  useEffect(() => {
    store.getSubscribes();
    const unsubscribeGetChannels = busChannel.on("getChannels", () => {
      store.getSubscribes();
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
      loadFeed(
        feed,
        store.syncArticles,
        () => {
          // TODO: get article List
        },
        () => {}
      );
    }
  };

  const markAllRead = () => {
    if (store.feedContextMenuTarget) {
      const { uuid } = store.feedContextMenuTarget;

      toast.promise(dataAgent.markAllRead({ uuid, isToday: !!isToday, isAll: !!isAll }), {
        loading: "Loading...",
        success: (data) => {
          store.getSubscribes();

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
      });
    }
  };

  useEffect(() => {
    store.subscribes.forEach((feed) => {
      if (feed.uuid === feedUuid) {
        store.setFeed(feed);
      }
    });
  }, [store.subscribes]);

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

    store.getSubscribes();
  };

  const afterUnsubscribeFeed = () => {
    if (store.feedContextMenuTarget) {
      const { uuid } = store.feedContextMenuTarget;
      if (store.feed?.uuid === uuid) {
        store.setArticleList([]);
      }
      store.setFeedContextMenuTarget(null);
    }

    store.getSubscribes();
  };

  return (
    <>
      <div
        {...scrollTopProps}
        className={clsx("flex-1 overflow-y-auto pb-2 pl-1 pr-1 scrollbar-gutter", {
          "border-t": scrollTop > 0,
        })}
        ref={listRef}
      >
        <CollectionMeta />
        <h2 className="mb-2 mt-6 px-2 font-semibold tracking-tight">{t("Feeds")}</h2>
        <ContextMenu.Root onOpenChange={handleContextMenuChange}>
          <ContextMenu.Trigger>
            <div>
              <ListContainer />
            </div>
          </ContextMenu.Trigger>
          <ContextMenu.Content key={store.feedContextMenuTarget?.uuid || "0"} alignOffset={0}>
            <ContextMenu.Item
              onClick={() => {
                markAllRead();
              }}
            >
              <CheckCheck size={14} /> {t("Mark all as read")}
            </ContextMenu.Item>
            <ContextMenu.Separator />
            {store.feedContextMenuTarget?.item_type === "folder" && (
              <>
                <ContextMenu.Item onSelect={() => setEditFolderDialogStatus(true)}>
                  <Pencil size={14} /> {t("Edit folder")}
                </ContextMenu.Item>
                <ContextMenu.Separator />
                <ContextMenu.Item
                  onClick={() => setDeleteFolderStatus(true)}
                  className="text-[var(--red-10)] hover:text-white"
                >
                  <Trash2 size={14} /> {t("Delete folder")}
                </ContextMenu.Item>
              </>
            )}
            {store.feedContextMenuTarget && (
              <>
                {store.feedContextMenuTarget?.item_type !== "folder" && (
                  <>
                    <ContextMenu.Item
                      onClick={() => store.feedContextMenuTarget?.link && open(store.feedContextMenuTarget?.link)}
                    >
                      <ExternalLink size={14} /> {t("Open home page")}
                    </ContextMenu.Item>
                    <ContextMenu.Separator />
                    <ContextMenu.Item
                      onClick={() =>
                        store.feedContextMenuTarget?.feed_url &&
                        copyText(store.feedContextMenuTarget?.feed_url).then(() =>
                          toast.message("Current URL copied to clipboard", {
                            description: "Paste it wherever you like",
                          })
                        )
                      }
                    >
                      <Link size={14} /> {t("Copy feed URL")}
                    </ContextMenu.Item>
                    <ContextMenu.Item
                      onClick={() =>
                        store.feedContextMenuTarget?.link &&
                        copyText(store.feedContextMenuTarget?.link).then(() =>
                          toast.message("Current URL copied to clipboard", {
                            description: "Paste it wherever you like",
                          })
                        )
                      }
                    >
                      <Link2 size={14} /> {t("Copy home page URL")}
                    </ContextMenu.Item>
                    <ContextMenu.Separator />
                    <ContextMenu.Item onClick={() => reloadFeedIcon(store.feedContextMenuTarget)}>
                      <Image size={14} /> {t("Reload icon")}
                    </ContextMenu.Item>
                    <ContextMenu.Item onClick={() => reloadFeedData(store.feedContextMenuTarget)}>
                      <Rss size={14} /> {t("Reload feeds")}
                    </ContextMenu.Item>
                    <ContextMenu.Separator />
                    <ContextMenu.Item onClick={() => setEditFeedStatus(true)}>
                      <FileText size={14} /> {t("View detail")}
                    </ContextMenu.Item>
                    <ContextMenu.Separator />
                    <ContextMenu.Item
                      onClick={() => setModalStatus(true)}
                      className="text-[var(--red-10)] hover:text-white"
                    >
                      <BellOff size={14} /> {t("Unsubscribe")}
                    </ContextMenu.Item>
                  </>
                )}
              </>
            )}
          </ContextMenu.Content>
        </ContextMenu.Root>
        <DialogUnsubscribeFeed
          feed={store.feedContextMenuTarget as FeedResItem | null}
          dialogStatus={showStatus}
          setDialogStatus={setModalStatus}
          afterConfirm={afterUnsubscribeFeed}
          afterCancel={() => store.setFeedContextMenuTarget(null)}
        />
        <DialogDeleteFolder
          folder={store.feedContextMenuTarget as FolderResItem | null}
          dialogStatus={deleteFolderStatus}
          setDialogStatus={setDeleteFolderStatus}
          afterConfirm={afterDeleteFolder}
          afterCancel={() => store.setFeedContextMenuTarget(null)}
        />
        <DialogEditFeed
          feed={store.feedContextMenuTarget}
          dialogStatus={editFeedStatus}
          setDialogStatus={setEditFeedStatus}
          afterConfirm={store.getSubscribes}
          afterCancel={() => store.setFeedContextMenuTarget(null)}
        />
        <AddFolder
          action="edit"
          folder={store.feedContextMenuTarget as FolderResItem | null}
          dialogStatus={editFolderDialogStatus}
          setDialogStatus={setEditFolderDialogStatus}
          afterConfirm={store.getSubscribes}
          afterCancel={() => store.setFeedContextMenuTarget(null)}
        />
      </div>
      <div className="h-[8px]"></div>
      {store.globalSyncStatus && (
        <div className="sticky bottom-0 left-0 right-0 p-2 text-right">
          <span className="mr-3 text-xs">Syncing...</span>
          {/* <span className="text-foreground text-xs">
            {done}/{feedList.length}
          </span> */}
        </div>
      )}
    </>
  );
};

export { ChannelList };
