import { memo, useRef, useState } from "react";
import type { CSSProperties, FC } from "react";
import { useDrag, useDrop } from "react-dnd";
import type { Identifier, XYCoord } from "dnd-core";
import { motion } from "framer-motion";
import { DragItem, DropItem, ItemTypes } from "./ItemTypes";
import { FeedResItem } from "@/db";
import clsx from "clsx";

export interface DustbinProps {
  uuid: any;
  index: number;
  feed: FeedResItem;
  accept?: string;
  children?: React.ReactNode;
  isExpanded?: Boolean;
  lastDroppedItem?: any;
  onMove: (
    a: [dragIndex: number, uuid: string, dragItem: DragItem],
    b: [hoverIndex: number, uuid: string, dropResult: DropItem]
  ) => void;
  onDrop: (item: any) => void;
}

export const Folder: FC<DustbinProps> = memo(function Folder({
  accept,
  uuid,
  index,
  feed,
  isExpanded,
  lastDroppedItem,
  onDrop,
  onMove,
  ...props
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [insertTileIndicator, setInsertTileIndicator] = useState<string | null>(
    null
  );
  const [{ isOver, canDrop }, drop] = useDrop({
    // accept: ItemTypes.CARD,
    accept: [ItemTypes.CARD, ItemTypes.BOX],
    drop: onDrop,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
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

      const isOver = monitor.isOver();

      let insertCaretDirection = "";

      if (hoverClientY > hoverMiddleY) {
        insertCaretDirection = "top";
      } else {
        insertCaretDirection = "bottom";
      }

      if (isOver && insertCaretDirection) {
        setInsertTileIndicator(`select-${insertCaretDirection}`);
      } else {
        setInsertTileIndicator(null);
      }

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;

      // Time to actually perform the action
      // onMove(
      //   [dragIndex, item.uuid, item],
      //   [hoverIndex, uuid, monitor.getDropResult() as DropItem]
      // );
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.BOX,
    item: () => {
      return { index, ...feed };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
    end(item, monitor) {
      if (monitor.didDrop()) {
          // monitor.didDrop()
      }
    },
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      data-id="folder"
      className={clsx(
        "overflow-hidden relative",
        { [`${insertTileIndicator}`]: isOver },
        { "bg-red": isDragging }
      )}
    >
      {props.children}
    </div>
  );
});
