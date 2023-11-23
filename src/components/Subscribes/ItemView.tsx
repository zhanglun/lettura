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
  const { isActive, level, arrow } = props;
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

  return (
    <div>
    <div
      key={feed.title}
      onClick={() => {
        store.setFeed(feed);
        navigate(
          `${RouteConfig.LOCAL_FEED.replace(/:uuid/, feed.uuid)}?feedUuid=${
            feed.uuid
          }&feedUrl=${feed.feed_url}&type=${feed.item_type}`
        );
      }}
    >
      <div
        className={clsx(
          "w-full h-9 px-4 rounded-md flex items-center cursor-pointer group text-foreground hover:bg-accent",
          {
            "hover:bg-primary bg-primary text-primary-foreground": isActive,
            "shadow-[inset_0_0_0_2px_var(--color-primary)]":
              store.feedContextMenuStatus && store.feedContextMenuTarget &&
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
      {props.children}
    </div>
  );
};
