import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { useDrag, useDrop } from "react-dnd";
import { FolderIcon } from "@heroicons/react/24/outline";

import styles from "./channel.module.scss";
import { ItemTypes } from "./ItemTypes";
import { StoreContext } from "../../context";
import { RouteConfig } from "../../config";

import { CardProps } from "./Item";

interface Item {
  id: string;
  name: string;
  originalIndex: number;
  type: string;
}

interface DropResult {
  allowedDropEffect: string;
  dropEffect: string;
  name: string;
}

export const Folder = ({
  id,
  channel,
  unread,
  moveCard,
  findCard,
}: CardProps) => {
  const store = useContext(StoreContext);
  const originalIndex = findCard(id).index;

  function selectBackgroundColor(isActive: boolean, canDrop: boolean) {
    if (isActive) {
      return "darkgreen";
    } else if (canDrop) {
      return "";
    } else {
      return "";
    }
  }

  const [{ opacity }, drag] = useDrag(
    () => ({
      type: ItemTypes.BOX,
      item: { id, originalIndex, name: channel.title },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
        opacity: monitor.isDragging() ? 0.4 : 1,
        handlerId: monitor.getHandlerId(),
      }),
      canDrag: (monitor) => {
        //是否取消拖拽
        console.log(monitor, "monitor131");
        return true;
      },
      end: (item, monitor) => {
        const { id: droppedId, originalIndex } = item;

        const didDrop = monitor.didDrop();
        const dropResult = monitor.getDropResult<DropResult>();

        if (item && dropResult) {
          let alertMessage = "";
          const isDropAllowed =
            dropResult.allowedDropEffect === "any" ||
            dropResult.allowedDropEffect === dropResult.dropEffect;

          if (isDropAllowed) {
            const isCopyAction = dropResult.dropEffect === "copy";
            const actionName = isCopyAction ? "copied" : "moved";
            alertMessage = `You ${actionName} ${item.name} into ${dropResult.name}!`;
            // TODO: move channel into folder
          } else {
            alertMessage = `You cannot ${dropResult.dropEffect} an item into the ${dropResult.name}`;
          }

          console.log(alertMessage);
        }

        if (!didDrop) {
          console.log("moveCard");
          moveCard(droppedId, originalIndex);
        }
      },
    }),
    [id, originalIndex, moveCard]
  );

  const [{ canDrop, isOver }, drop] = useDrop(
    () => ({
      accept: ItemTypes.BOX,
      drop: () => ({
        name: "folder-" + channel.uuid,
        allowedDropEffect: "move",
      }),
      hover({ id: draggedId, name }: Item) {
        if (draggedId !== id) {
          console.log('item ==>', name)
          const { index: overIndex } = findCard(id);
          moveCard(draggedId, overIndex);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [findCard, moveCard]
  );

  const isActive = canDrop && isOver;
  const backgroundColor = selectBackgroundColor(isActive, canDrop);

  return (
    <li
      ref={(node) => drag(drop(node))}
      style={{ backgroundColor, opacity }}
      key={channel.title}
      onClick={() => store.setChannel(channel)}
      aria-hidden="true"
      data-testid="dustbin"
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
        <span className={styles.icon}>
          <FolderIcon className={`h-4 w-4`} />
        </span>
        <span className={styles.name}>{channel.title}</span>
        {unread > 0 && <span className={styles.count}>{unread}</span>}
      </NavLink>
    </li>
  );
};
