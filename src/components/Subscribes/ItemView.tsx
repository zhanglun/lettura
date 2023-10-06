import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { RouteConfig } from "@/config";
import { FeedResItem } from "@/db";
import { useBearStore } from "@/stores";
import { getChannelFavicon } from "@/helpers/parseXML";
import { ChevronDownCircle, ChevronRightCircle } from "lucide-react";

export interface CardProps {
  uuid: any;
  text: string;
  index: number;
  feed: FeedResItem;
  className?: String;
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
  const { isActive, level, arrow } = props;
  const navigate = useNavigate();
  const store = useBearStore((state) => ({
    feed: state.feed,
    setFeed: state.setFeed,
    getFeedList: state.getFeedList,
    setFeedContextMenuTarget: state.setFeedContextMenuTarget,
    feedContextMenuTarget: state.feedContextMenuTarget,
  }));

  const handleToggle = () => {
    console.log("%c Line:42 🍷 handleToggle", "color:#b03734", feed.item_type);
    if (feed.item_type === "folder") {
      toggleFolder(uuid);
    }
  };

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
          }&feedUrl=${feed.feed_url}&type=${feed.item_type}`
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
            "pl-9": level === 2,
          }
        )}
        onContextMenu={() => {
          store.setFeedContextMenuTarget(feed);
        }}
      >
        <div onClick={handleToggle}>
          {feed.item_type === "folder" && (
            <span className="flex items-center">
              {isExpanded ? (
                <>
                  <ChevronDownCircle size={16} className="mr-1" />
                </>
              ) : (
                <>
                  <ChevronRightCircle size={16} className="mr-1"/>
                </>
              )}
            </span>
          )}
        </div>
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
