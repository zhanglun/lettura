import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { RouteConfig } from "@/config";
import { FeedResItem } from "@/db";
import { useBearStore } from "@/stores";
import { getChannelFavicon } from "@/helpers/parseXML";
import { ChevronDownCircle, ChevronRightCircle } from "lucide-react";
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

  function renderNiceFolder(isActive: Boolean, isExpanded: Boolean) {
    let folderStatus: string;

    if (isExpanded) {
      folderStatus = "open";
    } else if (isActive) {
      folderStatus = "active";
    } else {
      folderStatus = "close";
    }

    return <NiceFolderIcon status={folderStatus} />;
  }

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
              {renderNiceFolder(isActive, isExpanded)}
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
