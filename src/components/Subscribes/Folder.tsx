import { memo, useRef } from "react";
import type { CSSProperties, FC } from "react";
import { useDrag, useDrop } from "react-dnd";
import type { Identifier, XYCoord } from "dnd-core";
import { motion } from "framer-motion";
import { DragItem, DropItem, ItemTypes } from "./ItemTypes";
import { FeedResItem } from "@/db";

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
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.CARD,
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

      // Time to actually perform the action
      onMove(
        [dragIndex, item.uuid, item],
        [hoverIndex, uuid, monitor.getDropResult() as DropItem]
      );

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  const isActive = isOver && canDrop;

  let backgroundColor = "inherit";
  if (isActive) {
    // backgroundColor = 'darkgreen'
  } else if (canDrop) {
    // backgroundColor = 'darkkhaki'
  }

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
        console.log("%c Line:54 🍻 item", "color:#93c0a4", item);
        console.log(
          "%c Line:112 🍖 monitor.didDrop()",
          "color:#b03734",
          monitor.didDrop()
        );
      }
    },
  });

  drag(drop(ref));

  return (
    <div ref={ref} style={{ backgroundColor }} data-id="folder" className="overflow-hidden">
      {props.children}
    </div>
  );
});
