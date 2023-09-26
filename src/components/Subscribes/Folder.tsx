import { FeedResItem } from '@/db';
import type { CSSProperties, FC } from 'react'
import { memo, useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { ItemTypes } from './ItemTypes';
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
  const ref = useRef<HTMLDivElement>(null);
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.CARD,
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
    type: ItemTypes.CARD,
    item: () => {
      return { id, index, ...feed };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
    end(item, monitor) {
      console.log("%c Line:54 🍻 item", "color:#93c0a4", item);
      if (monitor.didDrop()) {
        props.confirmDidDrop();
      }
    },
  });

  drag(drop(ref));

  return (
    <div ref={ref} style={{ backgroundColor }} data-testid="dustbin">
      {props.children}
    </div>
  )
})
