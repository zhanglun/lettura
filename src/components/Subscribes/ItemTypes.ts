import { FeedResItem } from "@/db";

export const ItemTypes = {
  CARD: 'card',
  BOX: 'box',
}

export interface DragItem extends FeedResItem {
  index: number;
}

export interface DropItem extends DragItem {};
