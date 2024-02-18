import { FC, useEffect, useLayoutEffect } from "react";
import { memo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useDrag, useDrop } from "react-dnd";
import type { Identifier, XYCoord } from "dnd-core";
import { FeedResItem } from "@/db";
import { DragItem, DropItem, ItemTypes } from "./ItemTypes";
import clsx from "clsx";
import { ItemView } from "./ItemView";

export interface CardProps {
  uuid: string;
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
  onDrop: (item: any, dropResult: any, position: string | null) => void;
}

export const SubscribeItem: FC<CardProps> = memo(
  ({
    uuid,
    text,
    feed,
    index,
    level,
    isActive,
    isExpanded,
    toggleFolder,
    ...props
  }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [insertTileIndicator, setInsertTileIndicator] = useState<
      string | null
    >(null);
    const [{ handlerId, isOver }, drop] = useDrop<
      DragItem,
      FeedResItem,
      { handlerId: Identifier | null; isOver: boolean }
    >({
      accept: [ItemTypes.CARD, ItemTypes.BOX],
      drop: (item: FeedResItem, monitor) => {
        if (monitor.didDrop()) {
          return;
        }

        if (item.uuid === feed.uuid) {
          return;
        }

        props.onDrop(item, feed, insertTileIndicator);

        return feed;
      },
      collect(monitor) {
        return {
          isOver: monitor.isOver({ shallow: true }),
          handlerId: monitor.getHandlerId(),
        };
      },
      hover(item: DragItem & Partial<FeedResItem>, monitor) {
        if (!ref.current) {
          return;
        }

        if (item.uuid === feed.uuid) {
          return;
        }

        if (item.uuid === feed.folder_uuid) {
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
        const hoverClientY =
          (clientOffset as XYCoord).y - hoverBoundingRect.top;

        const bottom = hoverClientY > hoverMiddleY + 5;
        const top = hoverClientY < hoverMiddleY - 5;

        let insertCaretDirection = "";

        if (bottom) {
          insertCaretDirection = "bottom";
        } else if (top) {
          insertCaretDirection = "top";
        } else {
          if (item.item_type === "folder" && feed.item_type === "folder") {
            return;
          }
          insertCaretDirection = "middle";
        }

        if (isOver && insertCaretDirection) {
          setInsertTileIndicator(insertCaretDirection);
        } else {
          setInsertTileIndicator(null);
        }
      },
    });

    const [{ isDragging }, drag] = useDrag({
      type: feed.item_type === "channel" ? ItemTypes.CARD : ItemTypes.BOX,
      item: () => {
        return { index, ...feed };
      },
      collect: (monitor: any) => ({
        isDragging: monitor.isDragging(),
      }),
      end(item, monitor) {},
    });

    const opacity = isDragging ? 0.5 : 1;

    drag(drop(ref));

    return (
      <div
        ref={ref}
        style={{ opacity }}
        className={clsx("relative rounded-md border border-transparent", {
          [`indicator-middle`]: isOver && insertTileIndicator === "middle",
          [`indicator-top`]: isOver && insertTileIndicator === "top",
          [`indicator-bottom`]: isOver && insertTileIndicator === "bottom",
        })}
        data-handler-uuid={handlerId}
      >
        <ItemView
          index={index}
          uuid={feed.uuid}
          level={level}
          text={feed.title}
          feed={{ ...feed }}
          isActive={isActive}
          isExpanded={isExpanded || false}
          toggleFolder={toggleFolder}
        >
          {props.children && (
            <div
              className={clsx(
                "grid grid-rows-[0fr] grid-cols-[100%] overflow-hidden transition-all",
                {
                  "grid-rows-[1fr]": isExpanded,
                },
              )}
            >
              <div className="min-h-0 ">{props.children}</div>
            </div>
          )}
        </ItemView>
      </div>
    );
  },
);
