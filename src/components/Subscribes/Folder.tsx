import { FeedResItem } from '@/db';
import type { CSSProperties, FC } from 'react'
import { memo } from 'react'
import { useDrag, useDrop } from 'react-dnd'

export const ItemTypes = {
  Box: "box",
  Card: "card",
};

export interface DustbinProps {
  id: any;
  index: number;
  feed: FeedResItem;
  accept?: string,
  children?: React.ReactNode,
  lastDroppedItem?: any
  moveCard: (dragIndex: number, hoverIndex: number) => void;
  onDrop: (item: any) => void
  confirmDidDrop: () => void;
}

export const Folder: FC<DustbinProps> = memo(function Dustbin({
  accept,
  id,
  index,
  feed,
  lastDroppedItem,
  onDrop,
  ...props
}) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.Card,
    drop: onDrop,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  })

  const isActive = isOver && canDrop
  let backgroundColor = 'inherit'
  if (isActive) {
    backgroundColor = 'darkgreen'
  } else if (canDrop) {
    backgroundColor = 'darkkhaki'
  }

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.Box,
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

  return (
    <div ref={drop} style={{ backgroundColor }} data-testid="dustbin">
      {props.children}
    </div>
  )
})
