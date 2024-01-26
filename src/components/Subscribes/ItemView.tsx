import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { RouteConfig } from "@/config";
import { FeedResItem } from "@/db";
import { useBearStore } from "@/stores";
import { getChannelFavicon } from "@/helpers/parseXML";
import { ChevronDownCircle, ChevronRightCircle } from "lucide-react";

const baseItemClass =
  "flex relative z-[1] px-3 rounded-lg items-center text-sm mt-[2px] h-8 w-full cursor-pointer gap-2 rounded-md after:block after:content-[''] after:-z-10 after:absolute after:top-[0] after:left-[0] after:w-full after:h-full after:rounded-lg after:opacity-0 after:scale-90 after:transition-all after:duration-300 after:ease-in-out hover:after:opacity-100 hover:after:scale-100 md:transition-all md:duration-[500ms] md:ease-in-out md:mr-0 text-base py-[8px] after:bg-zinc-300";

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
          className={clsx("sidebar-item", {
            "sidebar-item--active": isActive,
            "shadow-[inset_0_0_0_2px_var(--color-primary)]":
              store.feedContextMenuStatus &&
              store.feedContextMenuTarget &&
              store.feedContextMenuTarget.uuid === feed.uuid,
            "pl-9": level === 2,
          })}
          onContextMenu={() => {
            store.setFeedContextMenuTarget(feed);
          }}
        >
          {feed.item_type === "folder" && (
            <div onClick={handleToggle}>
              <span className="flex items-center">
                {isExpanded ? (
                  <>
                    <ChevronDownCircle size={16} className="mr-1" />
                  </>
                ) : (
                  <>
                    <ChevronRightCircle size={16} className="mr-1" />
                  </>
                )}
              </span>
            </div>
          )}
          {feed.link && (
            <img src={ico} className="h-5 w-5 rounded mr-2" alt={feed.title} />
          )}
          <span
            className={clsx(
              "grow shrink basis-[0%] overflow-hidden text-ellipsis whitespace-nowrap text-sm"
            )}
          >
            {feed.title}
          </span>
          {unread > 0 && (
            <span
              className={clsx(
                "-mr-1 min-w-[1rem] h-4 leading-4 text-center text-[10px]"
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
