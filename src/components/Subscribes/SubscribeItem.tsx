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
  onMove: (
    a: [dragIndex: number, uuid: string, dragItem: DragItem],
    b: [hoverIndex: number, uuid: string, dropResult: DropItem]
  ) => void;
  onDrop: () => void;
}

export const SubscribeItem: FC<CardProps> = ({
  uuid,
  text,
  feed,
  index,
  level,
  onMove,
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [insertTileIndicator, setInsertTileIndicator] = useState<string | null>(
    null
  );
  const [{ handlerId, isOver }, drop] = useDrop({
    accept: [ItemTypes.CARD, ItemTypes.BOX],
    collect(monitor) {
      return {
        isOver: monitor.isOver(),
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem & Partial<FeedResItem>, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      const isOver = monitor.isOver();

      const bottom = dragIndex > hoverIndex;
      const top = dragIndex < hoverIndex;

      let insertCaretDirection = "";

      if (bottom) {
        insertCaretDirection = "bottom";
      }

      if (top) {
        insertCaretDirection = "top";
      }

      if (isOver && insertCaretDirection) {
        setInsertTileIndicator(`select-${insertCaretDirection}`);
      } else {
        setInsertTileIndicator(null);
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
      // onMove(
      //   [dragIndex, item.uuid, item],
      //   [hoverIndex, uuid, monitor.getDropResult() as DropItem]
      // );

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
      return { index, ...feed };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
    end(item, monitor) {
      if (monitor.didDrop()) {
        // props.onDrop();
      }
    },
  });

  const opacity = isDragging ? 0.5 : 1;

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity }}
      className={clsx("overflow-hidden relative", {
        [`${insertTileIndicator}`]: isOver,
      })}
      data-handler-uuid={handlerId}
    >
      {props.children}
    </div>
  );
};
