import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { RouteConfig } from "@/config";
import { FeedResItem } from "@/db";
import { useBearStore } from "@/stores";
import { getChannelFavicon } from "@/helpers/parseXML";

export interface CardProps {
  id: any;
  text: string;
  index: number;
  feed: FeedResItem;
  className?: String;
  arrow?: React.ReactNode;
  isActive: Boolean;
  level?: number;
}

export const ItemView: FC<CardProps> = ({
  id,
  text,
  feed,
  index,
  ...props
}) => {
  const { isActive, level, arrow } = props;
  const navigate = useNavigate();
  const store = useBearStore((state) => ({
    feed: state.feed,
    setFeed: state.setFeed,
    getFeedList: state.getFeedList,
    setFeedContextMenuTarget: state.setFeedContextMenuTarget,
    feedContextMenuTarget: state.feedContextMenuTarget,
  }));

  const { unread = 0, link, logo } = feed;
  const ico = logo || getChannelFavicon(link);

  return (
    <div
      key={feed.title}
      onClick={() => {
        store.setFeed(feed);
        navigate(
          `${RouteConfig.CHANNEL.replace(/:uuid/, feed.uuid)}?channelUuid=${
            feed.uuid
          }&feedUrl=${feed.feed_url}`
        );
      }}
    >
      <div
        className={clsx(
          "w-full h-8 px-4 flex items-center rounded-md cursor-pointer mt-[2px] group text-foreground",
          {
            "bg-primary text-primary-foreground": isActive,
            "shadow-[inset_0_0_0_2px_var(--color-primary)]":
              store.feedContextMenuTarget &&
              store.feedContextMenuTarget.uuid === feed.uuid,
            "pl-8": level === 2,
          }
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
          className={clsx(
            "grow shrink basis-[0%] overflow-hidden text-ellipsis whitespace-nowrap text-sm",
            {
              "text-primary-foreground": isActive,
            }
          )}
        >
          {feed.title}
        </span>
        {unread > 0 && (
          <span
            className={clsx(
              "-mr-2 min-w-[1rem] h-4 leading-4 text-center text-[10px]",
              {
                "text-primary-foreground": isActive,
              }
            )}
          >
            {unread}
          </span>
        )}
      </div>
    </div>
  );
};
