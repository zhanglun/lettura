import React, { FC } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, parseISO } from "date-fns";
import clsx from "clsx";
import { RouteConfig } from "@/config";
import { FeedResItem } from "@/db";
import { useBearStore } from "@/stores";
import { getFeedLogo } from "@/helpers/parseXML";
import { Avatar, HoverCard, Text } from "@radix-ui/themes";
import { useShallow } from "zustand/react/shallow";
import { ChevronDown, ChevronRight, Rss } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface CardProps {
  uuid: string;
  text: string;
  index: number;
  feed: FeedResItem;
  className?: String;
  children?: React.ReactNode;
  arrow?: React.ReactNode;
  isActive: boolean;
  isExpanded: boolean;
  level?: number;
  toggleFolder: (uuid: string) => void;
}

export const ItemView: FC<CardProps> = ({
  uuid,
  text,
  feed,
  index,
  isExpanded,
  toggleFolder,
  ...props
}) => {
  const { isActive } = props;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const store = useBearStore(
    useShallow((state) => ({
      setFeed: state.setFeed,
      getSubscribes: state.getSubscribes,
      setFeedContextMenuTarget: state.setFeedContextMenuTarget,
      feedContextMenuTarget: state.feedContextMenuTarget,
      feedContextMenuStatus: state.feedContextMenuStatus,
    })),
  );

  const { unread = 0, link, logo } = feed;
  const ico = logo || getFeedLogo(link);
  const syncLabel = (() => {
    if (!feed.last_sync_date) {
      return t("Not synced yet");
    }

    try {
      return t("Synced {{time}}", {
        time: formatDistanceToNow(parseISO(feed.last_sync_date), {
          addSuffix: true,
        }),
      });
    } catch {
      return feed.last_sync_date;
    }
  })();
  const folderUnread = (feed.children || []).reduce(
    (sum, child) => sum + (child.unread || 0),
    0,
  );
  const handleFolderToggle = () => {
    toggleFolder(feed.uuid);
  };
  const handleFolderKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleFolderToggle();
    }
  };
  const handleFeedOpen = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    store.setFeed(feed);
    navigate(
      `${RouteConfig.LOCAL_FEED.replace(/:uuid/, feed.uuid)}?feedUuid=${
        feed.uuid
      }&feedUrl=${feed.feed_url}&type=${feed.item_type}`,
    );
  };
  const handleFeedKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      store.setFeed(feed);
      navigate(
        `${RouteConfig.LOCAL_FEED.replace(/:uuid/, feed.uuid)}?feedUuid=${
          feed.uuid
        }&feedUrl=${feed.feed_url}&type=${feed.item_type}`,
      );
    }
  };

  if (feed.item_type === "folder") {
    return (
      <>
        <div
          className="mt-3 mb-1.5 flex cursor-pointer items-center gap-1 rounded px-1 py-1 text-[10px] font-semibold uppercase tracking-[0.5px] text-[var(--gray-9)] hover:bg-[var(--gray-a3)] hover:text-[var(--gray-11)]"
          role="button"
          tabIndex={0}
          onClick={handleFolderToggle}
          onKeyDown={handleFolderKeyDown}
          onContextMenu={() => {
            store.setFeedContextMenuTarget(feed);
          }}
        >
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <span className="block min-w-0 flex-1 truncate">{feed.title}</span>
          {folderUnread > 0 && (
            <span className="text-[10px] text-[var(--gray-9)] tabular-nums">
              {folderUnread}
            </span>
          )}
        </div>
        {props.children}
      </>
    );
  }

  return (
    <>
      <div
        className={clsx("sidebar-item", {
          "sidebar-item--active": isActive,
          "sidebar-item--hover":
            store.feedContextMenuStatus &&
            store.feedContextMenuTarget &&
            store.feedContextMenuTarget.uuid === feed.uuid,

        })}
        onContextMenu={() => {
          store.setFeedContextMenuTarget(feed);
        }}
        key={feed.title}
        role="button"
        tabIndex={0}
        onClick={handleFeedOpen}
        onKeyDown={handleFeedKeyDown}
      >
        {feed.link && (
          <Avatar
            size="1"
            src={ico}
            alt={feed.title}
            fallback={feed.title.slice(0, 1)}
            className="w-[18px] h-[18px] rounded-[3px]"
          />
        )}
        {!feed.link && <Rss size={14} className="shrink-0 text-[var(--accent-9)]" />}
        <span className="min-w-0 shrink grow basis-[0%]">
          <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-xs">
            {feed.title}
          </span>
          <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-normal text-[var(--gray-9)]">
            {syncLabel}
          </span>
        </span>
        <HoverCard.Root>
          <HoverCard.Trigger>
            <span
              className={clsx("ml-1 h-[7px] w-[7px] shrink-0 rounded-full", {
                "bg-[var(--green-9)]": feed.health_status === 0,
                "bg-[var(--red-9)]": feed.health_status === 1,
                "bg-[var(--amber-9)]": feed.health_status !== 0 && feed.health_status !== 1,
              })}
            />
          </HoverCard.Trigger>
          <HoverCard.Content size="1" maxWidth="240px">
            <Text size="1" className={feed.health_status === 1 ? "text-[var(--red-11)]" : ""}>
              {feed.health_status === 1
                ? feed.failure_reason || t("Feed sync failed")
                : syncLabel}
            </Text>
          </HoverCard.Content>
        </HoverCard.Root>
        {unread > 0 && (
          <span
            className={clsx(
              "ml-auto text-[10px] text-[var(--gray-9)] tabular-nums",
            )}
          >
            {unread}
          </span>
        )}
      </div>
      {props.children}
    </>
  );
};
