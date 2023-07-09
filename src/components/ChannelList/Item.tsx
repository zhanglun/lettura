import React, { useState } from "react";
import { ChevronDown, ChevronRight, Folder, FolderOpen } from "lucide-react";
import { getChannelFavicon } from "@/helpers/parseXML";
import { RouteConfig } from "@/config";
import { useBearStore } from "@/hooks/useBearStore";
import { useNavigate } from "react-router-dom";
import classNames from "classnames";

export interface FeedItemProps {
  feed: any;
  className: String;
  isActive: Boolean;
  level: number;
  expandStatus: { expanded: boolean };
  onExpand: any;
}

const renderFolder = (expandStatus: { expanded: boolean }, onExpand: any) => {
  if (expandStatus.expanded) {
    return (
      <>
        <span className="h-4 w-4 rounded mr-1" onClick={ onExpand }>
          <ChevronDown size={ 16 }/>
        </span>
        <span className="h-4 w-4 rounded mr-1">
          <FolderOpen size={ 16 }/>
        </span>
      </>
    );
  } else {
    return (
      <>
        <span className="h-4 w-4 rounded mr-1" onClick={ onExpand }>
          <ChevronRight size={ 16 }/>
        </span>
        <span className="h-4 w-4 rounded mr-1">
          <Folder size={ 16 }/>
        </span>
      </>
    );
  }
};

export const FeedItem = React.forwardRef((props: FeedItemProps, ref: any) => {
  const navigate = useNavigate();
  const store = useBearStore((state) => ({
    channel: state.channel,
    setChannel: state.setChannel,
    getFeedList: state.getFeedList,
    setFeedContextMenuTarget: state.setFeedContextMenuTarget,
    feedContextMenuTarget: state.feedContextMenuTarget,
  }));
  const { feed, className, isActive, level, expandStatus, onExpand } = props;
  const { unread = 0, link, item_type, logo } = feed;
  const ico = logo || getChannelFavicon(link);
  const isFolder = item_type === "folder";

  return (
    <li
      className={ `${ className }` }
      role="treeitem"
      key={ feed.title }
      onClick={ () => {
        store.setChannel(feed);
        navigate(
          `${ RouteConfig.CHANNEL.replace(/:uuid/, feed.uuid) }?channelUuid=${
            feed.uuid
          }&feedUrl=${ feed.feed_url }`
        );
      } }
    >
      <span
        className={ classNames(
          "w-full h-8 px-2 flex items-center rounded-md cursor-pointer mt-[2px] group text-foreground",
          {
            "bg-primary text-primary-foreground": isActive,
            "shadow-[inset_0_0_0_2px_var(--color-primary)]": (store.feedContextMenuTarget && store.feedContextMenuTarget.uuid === feed.uuid),
            "pl-8": level,
          }
        ) }
        onContextMenu={ () => {
          store.setFeedContextMenuTarget(feed);
        } }
      >
        { isFolder && renderFolder(expandStatus, onExpand) }
        { feed.link && (
          <img
            src={ ico }
            onError={ (e) => {
              // @ts-ignore
              e.target.onerror = null;

              // @ts-ignore
              e.target.src = defaultSiteIcon;
            } }
            className="h-4 w-4 rounded mr-2"
            alt={ feed.title }
          />
        ) }
        <span className={ classNames(
          "grow shrink basis-[0%] overflow-hidden text-ellipsis whitespace-nowrap text-sm",
          {
            "text-primary-foreground": isActive,
          }
        ) }>
          { feed.title }
        </span>
        { unread > 0 && (
          <span
            className={ classNames(
              "px-1 min-w-[1rem] h-4 leading-4 text-center text-[10px]",
              {
                "text-primary-foreground": isActive,
              }
            ) }
          >
            { unread }
          </span>
        ) }
      </span>
    </li>
  );
});
