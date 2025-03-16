import React, { FC } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { RouteConfig } from "@/config";
import { FeedResItem } from "@/db";
import { useBearStore } from "@/stores";
import { getFeedLogo } from "@/helpers/parseXML";
import { NiceFolderIcon } from "../NiceFolderIcon";
import { Avatar } from "@radix-ui/themes";
import { useShallow } from "zustand/react/shallow";

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

export const ItemView: FC<CardProps> = ({ uuid, text, feed, index, isExpanded, toggleFolder, ...props }) => {
  const { isActive, level } = props;
  const navigate = useNavigate();
  const store = useBearStore(useShallow((state) => ({
    setFeed: state.setFeed,
    getSubscribes: state.getSubscribes,
    setFeedContextMenuTarget: state.setFeedContextMenuTarget,
    feedContextMenuTarget: state.feedContextMenuTarget,
    feedContextMenuStatus: state.feedContextMenuStatus,
  })));

  const handleToggle = () => {
    if (feed.item_type === "folder") {
      toggleFolder(uuid);
    }
  };

  const { unread = 0, link, logo } = feed;
  const ico = logo || getFeedLogo(link);

  function renderNiceFolder(isActive: Boolean, isExpanded: Boolean) {
    let folderStatus: string;

    if (isExpanded) {
      folderStatus = "open";
    } else if (isActive) {
      folderStatus = "active";
    } else {
      folderStatus = "close";
    }

    return <NiceFolderIcon status={folderStatus} onClick={handleToggle} />;
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
          "pl-5": level === 2,
        })}
        onContextMenu={() => {
          console.log('content menu')
          store.setFeedContextMenuTarget(feed);
        }}
        key={feed.title}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
          e.stopPropagation();
          store.setFeed(feed);
          navigate(
            `${RouteConfig.LOCAL_FEED.replace(/:uuid/, feed.uuid)}?feedUuid=${feed.uuid}&feedUrl=${
              feed.feed_url
            }&type=${feed.item_type}`
          );
        }}
      >
        {feed.item_type === "folder" && <div>{renderNiceFolder(isActive, isExpanded)}</div>}
        {feed.link && (
          <Avatar
            size="1"
            src={ico}
            alt={feed.title}
            fallback={feed.title.slice(0, 1)}
            className="w-[18px] h-[18px]"
          ></Avatar>
        )}
        <span className={clsx("shrink grow basis-[0%] overflow-hidden text-ellipsis whitespace-nowrap text-sm")}>
          {feed.title}
        </span>
        {unread > 0 && <span className={clsx("h-4 min-w-[1rem] text-center text-[10px] leading-4")}>{unread}</span>}
      </div>
      {props.children}
    </>
  );
};
