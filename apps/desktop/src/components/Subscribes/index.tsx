import React, { useCallback, useEffect, useRef } from "react";
import { useMatch, useNavigate } from "react-router-dom";
import {
  CheckCheck,
  Settings,
  Rss,
  Image,
  ExternalLink,
  Link,
  Link2,
} from "lucide-react";
import { RouteConfig } from "@/config";
import { FeedResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import { useBearStore } from "@/stores";
import { ContextMenu } from "@radix-ui/themes";
import { open as openExternal } from "@tauri-apps/plugin-shell";
import { useQuery } from "@/helpers/parseXML";
import { ListContainer } from "./ListContainer";
import { copyText } from "@/helpers/copyText";
import { toast } from "sonner";
import { loadFeed } from "@/hooks/useLoadFeed";
import clsx from "clsx";
import { useScrollTop } from "@/hooks/useScrollTop";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";

const ChannelList = (): JSX.Element => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isToday = useMatch(RouteConfig.LOCAL_TODAY);
  const isAll = useMatch(RouteConfig.LOCAL_ALL);
  const store = useBearStore(
    useShallow((state) => ({
      feed: state.feed,
      setFeed: state.setFeed,

      feedContextMenuTarget: state.feedContextMenuTarget,
      setFeedContextMenuStatus: state.setFeedContextMenuStatus,

      articleList: state.articleList,
      setArticleList: state.setArticleList,

      syncArticles: state.syncArticles,

      subscribes: state.subscribes,
      getSubscribes: state.getSubscribes,

    })),
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
        () => {},
      );
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
            store.getSubscribes();

            if (store.feed?.uuid === uuid) {
              store.setArticleList(
                store.articleList.map((_) => {
                  _.read_status = 2;
                  return _;
                }),
              );
            }
            return "Done!😀";
          },
          error: "Error🤢",
        },
      );
    }
  };

  useEffect(() => {
    store.subscribes.forEach((feed) => {
      if (feed.uuid === feedUuid && feed.uuid !== store.feed?.uuid) {
        store.setFeed(feed);
      }
    });
  }, [store.subscribes, feedUuid, store.feed?.uuid]);

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
    const list = listRef.current;
    if (!list) return;

    list.addEventListener("scroll", handleListScroll);
    return () => list.removeEventListener("scroll", handleListScroll);
  }, [handleListScroll]);

  return (
    <>
      <div className="px-4 py-2 flex items-center justify-between flex-shrink-0">
        <span className="text-[10px] font-semibold text-[var(--gray-9)] uppercase tracking-[0.5px]">
          {t("layout.sidebar.feeds")}
        </span>
        <button
          type="button"
          onClick={() => navigate(`${RouteConfig.SETTINGS}?tab=subscriptions`)}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-[var(--gray-9)] hover:text-[var(--gray-12)] hover:bg-[var(--gray-a3)] transition-colors"
          title={t("layout.sidebar.manage_feeds")}
        >
          <Settings size={10} />
          <span>{t("layout.sidebar.manage")}</span>
        </button>
      </div>
      <div
        {...scrollTopProps}
        className={clsx(
          "flex-1 overflow-y-auto px-3 pb-3 scrollbar-gutter",
          {
            "border-t": scrollTop > 0,
          },
        )}
        ref={listRef}
      >
        <ContextMenu.Root onOpenChange={handleContextMenuChange}>
          <ContextMenu.Trigger>
            <div>
              <ListContainer />
            </div>
          </ContextMenu.Trigger>
          <ContextMenu.Content
            key={store.feedContextMenuTarget?.uuid || "0"}
            alignOffset={0}
          >
            <ContextMenu.Item
              onClick={() => {
                markAllRead();
              }}
            >
              <CheckCheck size={14} /> {t("Mark all as read")}
            </ContextMenu.Item>
            <ContextMenu.Separator />
            {store.feedContextMenuTarget && (
              <>
                {store.feedContextMenuTarget?.item_type !== "folder" && (
                  <>
                    <ContextMenu.Item
                      onClick={() =>
                        store.feedContextMenuTarget?.link &&
                        openExternal(store.feedContextMenuTarget?.link)
                      }
                    >
                      <ExternalLink size={14} /> {t("Open home page")}
                    </ContextMenu.Item>
                    <ContextMenu.Separator />
                    <ContextMenu.Item
                      onClick={() =>
                        store.feedContextMenuTarget?.feed_url &&
                        copyText(store.feedContextMenuTarget?.feed_url).then(
                          () =>
                            toast.message(
                              t("Current URL copied to clipboard"),
                              {
                                description: t("Paste it wherever you like"),
                              },
                            ),
                        )
                      }
                    >
                      <Link size={14} /> {t("Copy feed URL")}
                    </ContextMenu.Item>
                    <ContextMenu.Item
                      onClick={() =>
                        store.feedContextMenuTarget?.link &&
                        copyText(store.feedContextMenuTarget?.link).then(() =>
                          toast.message(t("Current URL copied to clipboard"), {
                            description: t("Paste it wherever you like"),
                          }),
                        )
                      }
                    >
                      <Link2 size={14} /> {t("Copy home page URL")}
                    </ContextMenu.Item>
                    <ContextMenu.Separator />
                    <ContextMenu.Item
                      onClick={() =>
                        reloadFeedIcon(store.feedContextMenuTarget)
                      }
                    >
                      <Image size={14} /> {t("Reload icon")}
                    </ContextMenu.Item>
                    <ContextMenu.Item
                      onClick={() =>
                        reloadFeedData(store.feedContextMenuTarget)
                      }
                    >
                      <Rss size={14} /> {t("Reload feeds")}
                    </ContextMenu.Item>
                  </>
                )}
              </>
            )}
          </ContextMenu.Content>
        </ContextMenu.Root>
      </div>
      {/* {store.globalSyncStatus && (
        <div className="sticky bottom-0 left-0 right-0 p-2 text-right">
          <div className="h-[8px]"></div>
        </div>
      )} */}
    </>
  );
};

export { ChannelList };
