import type { FC } from "react";
import { useRef, useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import type { Identifier, XYCoord } from "dnd-core";
import { FeedResItem } from "@/db";
import { DragItem, DropItem, ItemTypes } from "./ItemTypes";
import clsx from "clsx";

export interface CardProps {
  uuid: string;
  text: string;
  index: number;
  feed: FeedResItem;
  className?: String;
  children?: any;
  arrow?: React.ReactNode;
  isActive: Boolean;
  level?: number;
  onDrop: (item: any, dropResult: any, position: string | null) => void;
}

export const SubscribeItem: FC<CardProps> = ({
  uuid,
  text,
  feed,
  index,
  level,
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [insertTileIndicator, setInsertTileIndicator] = useState<string | null>(
    null
  );
  const [{ handlerId, isOver }, drop] = useDrop<
    DragItem,
    FeedResItem,
    { handlerId: Identifier | null,
    isOver: boolean,
    }
  >({
    accept: [ItemTypes.CARD, ItemTypes.BOX],
    drop: (item: FeedResItem, monitor) => {
      if (monitor.didDrop()) {
        return
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
      const dragIndex = item.index;
      const hoverIndex = index;

      if (item.uuid === feed.uuid) {
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
      // if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
      //   return;
      // }

      // // Dragging upwards
      // if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      //   return;
      // }
      // const isOver = monitor.isOver({ shallow: true });
      const bottom = hoverClientY > hoverMiddleY + 5;
      const top = hoverClientY < hoverMiddleY - 5;

      let insertCaretDirection = "";

      if (bottom) {
        insertCaretDirection = "bottom";
      } else if (top) {
        insertCaretDirection = "top";
      } else {
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
    end(item, monitor) {
    },
  });

  const opacity = isDragging ? 0.5 : 1;

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity }}
      className={clsx(
        "relative rounded-md border border-transparent",
        {
        [`indicator-${insertTileIndicator}`]: isOver,
      })}
      data-handler-uuid={handlerId}
    >
      {props.children}
    </div>
  );
};
