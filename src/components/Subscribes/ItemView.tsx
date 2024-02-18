import React, { FC } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { RouteConfig } from "@/config";
import { FeedResItem } from "@/db";
import { useBearStore } from "@/stores";
import { getChannelFavicon } from "@/helpers/parseXML";
import { NiceFolderIcon } from "../NiceFolderIcon";

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
  const store = useBearStore((state) => ({
    feed: state.feed,
    setFeed: state.setFeed,
    getFeedList: state.getFeedList,
    setFeedContextMenuTarget: state.setFeedContextMenuTarget,
    feedContextMenuTarget: state.feedContextMenuTarget,
    feedContextMenuStatus: state.feedContextMenuStatus,
  }));

  const handleToggle = () => {
    if (feed.item_type === "folder") {
      toggleFolder(uuid);
    }
  };

  const { unread = 0, link, logo } = feed;
  const ico = logo || getChannelFavicon(link);

  function renderNiceFolder(isActive: Boolean, isExpanded: Boolean) {
    let folderStatus: string;

    if (isExpanded) {
      folderStatus = "open";
    } else if (isActive) {
      folderStatus = "active";
    } else {
      folderStatus = "close";
    }

    return <NiceFolderIcon status={ folderStatus } onClick={ handleToggle }/>;
  }

  return (
    <>
      <div
        className={ clsx("sidebar-item", {
          "sidebar-item--active": isActive,
          "shadow-[inset_0_0_0_2px_var(--color-primary)]":
            store.feedContextMenuStatus &&
            store.feedContextMenuTarget &&
            store.feedContextMenuTarget.uuid === feed.uuid,
          "pl-5": level === 2,
        }) }
        onContextMenu={ () => {
          store.setFeedContextMenuTarget(feed);
        } }
        key={ feed.title }
        onClick={ (e: React.MouseEvent<HTMLDivElement>) => {
          e.stopPropagation();
          store.setFeed(feed);
          navigate(
            `${ RouteConfig.LOCAL_FEED.replace(/:uuid/, feed.uuid) }?feedUuid=${ feed.uuid }&feedUrl=${
              feed.feed_url
            }&type=${ feed.item_type }`
          );
        } }
      >
        { feed.item_type === "folder" && <div>{ renderNiceFolder(isActive, isExpanded) }</div> }
        { feed.link && (
          <img
            src={ ico }
            className={ clsx("h-4 w-4 rounded") }
            alt={ feed.title }
          />
        ) }
        <span className={ clsx("shrink grow basis-[0%] overflow-hidden text-ellipsis whitespace-nowrap text-sm") }>
          { feed.title }
        </span>
        { unread > 0 && (
          <span className={ clsx("-mr-1 h-4 min-w-[1rem] text-center text-[10px] leading-4") }>{ unread }</span>
        ) }
      </div>
      { props.children }
    </>
  );
};
