import type { CSSProperties, FC } from "react";
import { memo, useContext } from "react";
import { NavLink } from "react-router-dom";
import { useDrag, useDrop } from "react-dnd";
import { FolderIcon } from "@heroicons/react/24/outline";
import { StoreContext } from "../../context";
import defaultSiteIcon from "./default.png";
import { Channel } from "../../db";
import { RouteConfig } from "../../config";

import styles from "./channel.module.scss";

const style: CSSProperties = {
  cursor: 'move',
}

export interface CardProps {
  id: string;
  channel: Channel;
  ico: string;
  unread: number;
  moveCard: (id: string, to: number) => void;
  findCard: (id: string) => { index: number };
}

interface Item {
  id: string;
  originalIndex: number;
}

export const ChannelItem: FC<CardProps> = memo(function Card({
  id,
  channel,
  ico,
  unread,
  moveCard,
  findCard,
}) {
  const store = useContext(StoreContext);
  const originalIndex = findCard(id).index;
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "card",
      item: { id, originalIndex },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
        opacity: monitor.isDragging() ? 0.4 : 1,
      }),
      canDrag: (monitor) => {
        //是否取消拖拽
        console.log(monitor, 'monitor131');
        return true;
      },
      end: (item, monitor) => {
        const { id: droppedId, originalIndex } = item;
        const didDrop = monitor.didDrop();

        if (!didDrop) {
          moveCard(droppedId, originalIndex);
        }
      },
    }),
    [id, originalIndex, moveCard]
  );

  const [, drop] = useDrop(
    () => ({
      accept: "card",
      hover({ id: draggedId }: Item) {
        console.log(
          "🚀 ~ file: Item.tsx ~ line 63 ~ hover ~ draggedId",
          draggedId
        );
        if (draggedId !== id) {
          const { index: overIndex } = findCard(id);
          moveCard(draggedId, overIndex);
        }
      },
    }),
    [findCard, moveCard]
  );

  const opacity = isDragging ? 0 : 1;

  console.log("channle", channel);

  return (
    <li
      ref={(node) => drag(drop(node))}
      style={{ ...style, opacity }}
      key={channel.title}
      onClick={() => store.setChannel(channel)}
      aria-hidden="true"
    >
      <NavLink
        className={({ isActive }) =>
          `${styles.item} ${isActive ? styles.itemActive : ""}`
        }
        to={`${RouteConfig.CHANNEL.replace(
          /:uuid/,
          channel.uuid
        )}?channelUuid=${channel.uuid}&feedUrl=${channel.feed_url}`}
      >
        { channel.item_type === 'channel' &&
          <img
            src={ico}
            onError={(e) => {
              // @ts-ignore
              e.target.onerror = null;

              // @ts-ignore
              e.target.src = defaultSiteIcon;
            }}
            className={styles.icon}
            alt={channel.title}
          />
        }
        {channel.item_type === 'folder' &&
          <span className={styles.icon}>
            <FolderIcon className={`h-4 w-4`} />
          </span>
        }
        <span className={styles.name}>{channel.title}</span>
        {unread > 0 && <span className={styles.count}>{unread}</span>}
      </NavLink>
    </li>
  );
});
