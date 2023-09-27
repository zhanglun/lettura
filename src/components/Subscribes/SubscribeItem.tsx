import type { FC } from "react";
import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import type { Identifier, XYCoord } from "dnd-core";
import { FeedResItem } from "@/db";
import { DragItem, DropItem, ItemTypes } from "./ItemTypes";

const style = {
  cursor: "move",
};

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
    a: [dragIndex: number, dragItem: DragItem],
    b: [hoverIndex: number, dropResult: DropItem]
  ) => void;
  onDrop: () => void;
  onMoveIntoFolder: (dragItem: DragItem, dropResult: DropItem) => void;
}

export const SubscribeItem: FC<CardProps> = ({
  uuid,
  text,
  feed,
  index,
  onMove,
  onMoveIntoFolder,
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ handlerId }, drop] = useDrop<
    DragItem,
    void,
    { handlerId: Identifier | null }
  >({
    accept: [ItemTypes.CARD, ItemTypes.BOX],
    collect(monitor) {
      return {
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
        [dragIndex, item],
        [hoverIndex, monitor.getDropResult() as DropItem]
      );

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
      const dropResult = monitor.getDropResult<DropItem>();

      if (item.uuid && dropResult?.item_type === "folder") {
        console.log(
          `You dropped ${item.title} into ${
            dropResult.title
          }! ${monitor.didDrop()}`
        );
        onMoveIntoFolder(item, dropResult);
      } else if (monitor.didDrop()) {
        props.onDrop();
      }
    },
  });

  const opacity = isDragging ? 0 : 1;

  drag(drop(ref));

  return (
    <div ref={ref} style={{ ...style, opacity }} data-handler-uuid={handlerId}>
      {props.children}
    </div>
  );
};
