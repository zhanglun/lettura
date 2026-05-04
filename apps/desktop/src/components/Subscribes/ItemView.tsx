import React, { FC } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { RouteConfig } from "@/config";
import { FeedResItem } from "@/db";
import { useBearStore } from "@/stores";
import { getFeedLogo } from "@/helpers/parseXML";
import { Avatar, HoverCard, Text } from "@radix-ui/themes";
import { useShallow } from "zustand/react/shallow";
import { Rss } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface CardProps {
  uuid: any;
  text: string;
  index: number;
  feed: FeedResItem;
  className?: String;
  children?: any;
  arrow?: React.ReactNode;
  isActive: Boolean;
  isExpanded: Boolean;
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
  const { isActive, level } = props;
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

  if (feed.item_type === "folder") {
    return (
      <>
        <div
          className="mt-3 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.5px] text-[var(--gray-9)]"
          onContextMenu={() => {
            store.setFeedContextMenuTarget(feed);
          }}
        >
          <span className="block min-w-0 truncate">{feed.title}</span>
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
          "ml-2 w-[calc(100%-0.5rem)]": level === 2,
        })}
        onContextMenu={() => {
          console.log("content menu");
          store.setFeedContextMenuTarget(feed);
        }}
        key={feed.title}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
          e.stopPropagation();
          store.setFeed(feed);
          navigate(
            `${RouteConfig.LOCAL_FEED.replace(/:uuid/, feed.uuid)}?feedUuid=${
              feed.uuid
            }&feedUrl=${feed.feed_url}&type=${feed.item_type}`,
          );
        }}
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
        <span
          className={clsx(
            "shrink grow basis-[0%] overflow-hidden text-ellipsis whitespace-nowrap text-xs",
          )}
        >
          {feed.title}
        </span>
        {feed.last_sync_date && feed.health_status === 1 && (
          <HoverCard.Root>
            <HoverCard.Trigger>
              <span className="ml-1 h-[7px] w-[7px] shrink-0 rounded-full bg-[var(--red-9)]" />
            </HoverCard.Trigger>
            <HoverCard.Content size="1" maxWidth="240px">
              <Text size="1" className="text-[var(--red-11)]">
                {feed.failure_reason || t("Feed sync failed")}
              </Text>
            </HoverCard.Content>
          </HoverCard.Root>
        )}
        {feed.last_sync_date && feed.health_status === 0 && (
          <span className="ml-1 h-[7px] w-[7px] shrink-0 rounded-full bg-[var(--green-9)]" />
        )}
        {unread > 0 && (
          <span
            className={clsx(
              "ml-auto h-4 min-w-[1rem] text-center text-[10px] leading-4 text-[var(--gray-9)] tabular-nums",
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
