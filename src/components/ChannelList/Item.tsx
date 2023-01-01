import type { CSSProperties, FC } from "react";
import { memo, useContext } from "react";
import { NavLink } from "react-router-dom";
import { useDrag, useDrop } from "react-dnd";
import { FolderIcon } from "@heroicons/react/24/outline";
import { StoreContext } from "../../context";
import defaultSiteIcon from "./default.png";
import { Channel } from "../../db";
import * as dataAgent from '../../helpers/dataAgent';
import { RouteConfig } from "../../config";

import styles from "./channel.module.scss";
import { ItemTypes } from "./ItemTypes";
import { after } from "node:test";

const style: CSSProperties = {
  cursor: 'move',
}

export interface CardProps {
  id: string;
  channel: Channel;
  ico: string;
  unread: number;
  type: string;
  moveCard: (id: string, to: number, intoFolder?: boolean) => void;
  findCard: (id: string) => { index: number };
  afterFn: any;
}

interface Item {
  id: string;
  originalIndex: number;
}

export interface BoxProps {
  name: string
}

interface DropResult {
  allowedDropEffect: string
  dropEffect: string
  name: string
  type: string
  id: string
}

export const ChannelItem: FC<CardProps> = memo(function Card({
  id,
  channel,
  ico,
  unread,
  type,
  moveCard,
  findCard,
  afterFn,
}) {
  const store = useContext(StoreContext);
  const originalIndex = findCard(id).index;
  const [{ opacity }, drag] = useDrag(
    () => ({
      type: ItemTypes.BOX,
      item: {
        id,
        originalIndex,
        name: channel.title,
        type,
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
        opacity: monitor.isDragging() ? 0.4 : 1,
        handlerId: monitor.getHandlerId(),
      }),
      end: (item, monitor) => {
        const { id: droppedId, originalIndex } = item;
        const didDrop = monitor.didDrop();
        const dropResult = monitor.getDropResult<DropResult>()

        if (item && dropResult) {
          let alertMessage = ''
          const isDropAllowed =
            dropResult.allowedDropEffect === 'any' ||
            dropResult.allowedDropEffect === dropResult.dropEffect

          if (isDropAllowed && dropResult.type === 'folder') {
            const isCopyAction = dropResult.dropEffect === 'copy'
            const actionName = isCopyAction ? 'copied' : 'moved'

            alertMessage = `You ${actionName} ${item.name} into ${dropResult.name}!`
            dataAgent.moveChannelIntoFolder(item.id, dropResult.id, 1).then((res) => {
              console.log('res ==>', res)
              afterFn && afterFn();
            })

            moveCard(droppedId, originalIndex, true);
          } else {
            alertMessage = `You cannot ${dropResult.dropEffect} an item into the ${dropResult.name}`
          }

          console.log(alertMessage)
        }

        if (!didDrop) {
          console.log('moveCard')
          moveCard(droppedId, originalIndex);
        }
      },
    }),
    [id, originalIndex, moveCard]
  );

  const [, drop] = useDrop(
    () => ({
      accept: ItemTypes.BOX,
      hover({ id: draggedId }: Item) {
        if (draggedId !== id) {
          const { index: overIndex } = findCard(id);
          moveCard(draggedId, overIndex);
        }
      },
      drop(item, monitor) {
        return {
          name: channel.title,
          id: channel.uuid,
          allowedDropEffect: "move",
        }
      }
    }),
    [findCard, moveCard]
  );

  return (
    <li
      ref={(node) => drag(drop(node))}
      style={{ ...style, opacity }}
      key={channel.title}
      onClick={() => store.setChannel(channel)}
      aria-hidden="true"
    >
      <NavLink
        className={({ isActive }: any) =>
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
