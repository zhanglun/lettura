import React, { useState } from "react";
import { ChevronDown, ChevronRight, Folder, FolderOpen } from "lucide-react";
import { getChannelFavicon } from "@/helpers/parseXML";
import { RouteConfig } from "@/config";
import { useBearStore } from "@/stores";
import { useNavigate } from "react-router-dom";
import classNames from "classnames";
import { TreeItemRenderContext, TreeItem } from "react-complex-tree";

export interface FeedItemProps extends TreeItemRenderContext<never> {
  feed: any;
  className: String;
  children: any;
  arrow: React.ReactNode;
  isActive: Boolean;
  level: number;
}

export const renderItemArrow = ({
  item,
  context,
}: {
  item: TreeItem;
  context: TreeItemRenderContext<never>;
}) => {
  if (item.isFolder) {
    return (
      <span className="flex items-center" {...context.arrowProps}>
        {context.isExpanded ? (
          <>
            <span className="h-4 w-4 rounded mr-1">
              <ChevronDown size={16} />
            </span>
            <span className="h-4 w-4 rounded mr-1">
              <FolderOpen size={16} />
            </span>
          </>
        ) : (
          <>
            <span className="h-4 w-4 rounded mr-1">
              <ChevronRight size={16} />
            </span>
            <span className="h-4 w-4 rounded mr-1">
              <Folder size={16} />
            </span>
          </>
        )}
      </span>
    );
  }

  return null;
};
export const FeedItem = React.forwardRef((props: FeedItemProps, ref: any) => {
  const navigate = useNavigate();
  const store = useBearStore((state) => ({
    feed: state.feed,
    setFeed: state.setFeed,
    getFeedList: state.getFeedList,
    setFeedContextMenuTarget: state.setFeedContextMenuTarget,
    feedContextMenuTarget: state.feedContextMenuTarget,
  }));
  const {
    feed,
    className,
    isActive,
    level,
    arrow,
    children,
    itemContainerWithChildrenProps,
  } = props;
  const { unread = 0, link, logo } = feed;
  const ico = logo || getChannelFavicon(link);

  return (
    <>
      <li
        {...itemContainerWithChildrenProps}
        key={feed.title}
        onClick={() => {
          store.setFeed(feed);
          navigate(
            `${RouteConfig.CHANNEL.replace(/:uuid/, feed.uuid)}?channelUuid=${
              feed.uuid
            }&feedUrl=${feed.feed_url}`,
          );
        }}
      >
        <span
          {...props.itemContainerWithoutChildrenProps}
          {...props.interactiveElementProps}
          className={classNames(
            "w-full h-8 px-4 flex items-center rounded-md cursor-pointer mt-[2px] group text-foreground",
            {
              "bg-primary text-primary-foreground": isActive,
              "shadow-[inset_0_0_0_2px_var(--color-primary)]":
                store.feedContextMenuTarget &&
                store.feedContextMenuTarget.uuid === feed.uuid,
              "pl-8": level,
            },
          )}
          onContextMenu={() => {
            store.setFeedContextMenuTarget(feed);
          }}
        >
          {arrow}
          {feed.link && (
            <img
              src={ico}
              onError={(e) => {
                // @ts-ignore
                e.target.onerror = null;

                // @ts-ignore
                // e.target.src = defaultSiteIcon;
              }}
              className="h-4 w-4 rounded mr-2"
              alt={feed.title}
            />
          )}
          <span
            className={classNames(
              "grow shrink basis-[0%] overflow-hidden text-ellipsis whitespace-nowrap text-sm",
              {
                "text-primary-foreground": isActive,
              },
            )}
          >
            {feed.title}
          </span>
          {unread > 0 && (
            <span
              className={classNames(
                "px-1 min-w-[1rem] h-4 leading-4 text-center text-[10px]",
                {
                  "text-primary-foreground": isActive,
                },
              )}
            >
              {unread}
            </span>
          )}
        </span>
      </li>
      {children}
    </>
  );
});
