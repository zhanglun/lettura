import type { FC } from "react";
import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import type { Identifier, XYCoord } from "dnd-core";
import { RouteConfig } from "@/config";
import { FeedResItem } from "@/db";
import { useBearStore } from "@/stores";
import { getChannelFavicon } from "@/helpers/parseXML";

export const ItemTypes = {
  CARD: "card",
};

const style = {
  cursor: "move",
};

export interface CardProps {
  id: any;
  text: string;
  index: number;
  feed: FeedResItem;
  className?: String;
  children?: any;
  arrow?: React.ReactNode;
  isActive: Boolean;
  level?: number;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
  confirmDidDrop: () => void;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

export const SubscribeItem: FC<CardProps> = ({
  id,
  text,
  feed,
  index,
  moveCard,
  ...props
}) => {
  const { isActive, level, arrow, children } = props;
  const navigate = useNavigate();
  const store = useBearStore((state) => ({
    feed: state.feed,
    setFeed: state.setFeed,
    getFeedList: state.getFeedList,
    setFeedContextMenuTarget: state.setFeedContextMenuTarget,
    feedContextMenuTarget: state.feedContextMenuTarget,
  }));

  const ref = useRef<HTMLDivElement>(null);
  const [{ handlerId }, drop] = useDrop<
    DragItem,
    void,
    { handlerId: Identifier | null }
  >({
    accept: ItemTypes.CARD,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      moveCard(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CARD,
    item: () => {
      return { id, index };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
    end(item, monitor) {
      if (monitor.didDrop()) {
        props.confirmDidDrop();
      }
    },
  });

  const opacity = isDragging ? 0 : 1;

  const { unread = 0, link, logo } = feed;
  const ico = logo || getChannelFavicon(link);

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ ...style, opacity }}
      data-handler-id={handlerId}
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
      <span
        className={clsx(
          "w-full h-8 px-4 flex items-center rounded-md cursor-pointer mt-[2px] group text-foreground",
          {
            "bg-primary text-primary-foreground": isActive,
            "shadow-[inset_0_0_0_2px_var(--color-primary)]":
              store.feedContextMenuTarget &&
              store.feedContextMenuTarget.uuid === feed.uuid,
            "pl-8": level,
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
      </span>
    </div>
  );
};
