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

// interface DropResult {
//   allowedDropEffect: string;
//   dropEffect: string;
//   name: string;
//   id: string,
// }

export const Folder = ({
  id,
  channel,
  unread,
  moveCard,
  findCard,
  type
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
      item: {
        id,
        originalIndex,
        name: channel.title,
        type
      },
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
      // end: (item, monitor) => {
      //   const { id: droppedId, originalIndex } = item;

      //   const didDrop = monitor.didDrop();
      //   const dropResult = monitor.getDropResult<DropResult>();
      //   console.log("%c Line:71 🍞 dropResult", "color:#e41a6a", dropResult);

      //   if (item && dropResult) {
      //     let alertMessage = "";
      //     const isDropAllowed =
      //       dropResult.allowedDropEffect === "any" ||
      //       dropResult.allowedDropEffect === dropResult.dropEffect;

      //     if (isDropAllowed) {
      //       const isCopyAction = dropResult.dropEffect === "copy";
      //       const actionName = isCopyAction ? "copied" : "moved";
      //       alertMessage = `You ${actionName} ${item.name} into ${dropResult.name}!`;
      //       // TODO: move channel into folder
      //     } else {
      //       alertMessage = `You cannot ${dropResult.dropEffect} an item into the ${dropResult.name}`;
      //     }

      //     alert(alertMessage);
      //   }

      //   if (!didDrop) {
      //     alert("moveCard");
      //     moveCard(droppedId, originalIndex);
      //   }
      // },
    }),
    [id, originalIndex, moveCard]
  );

  const [{ canDrop, isOver }, drop] = useDrop(
    () => ({
      accept: ItemTypes.BOX,
      drop: () => ({
        id,
        name: "folder-" + channel.title,
        allowedDropEffect: "move",
        type: channel.item_type,
      }),
      hover({ id: draggedId, name, type }: Item, monitor) {
        console.log("%c Line:102 🍒 name", "color:#42b983", name);
        console.log("%c Line:102 🥕 type", "color:#7f2b82", type);

        const monitorItem = monitor.getItem();

        console.log("%c Line:110 🌽 monitorItem", "color:#465975", monitorItem);

        if (draggedId !== id && type === 'folder') {
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

  const isDropActive = canDrop && isOver;

  return (
    <li
      ref={(node) => drag(drop(node))}
      style={{ opacity }}
      key={channel.title}
      onClick={() => store.setChannel(channel)}
      aria-hidden="true"
      data-testid="dustbin"
    >
      <NavLink
        className={({ isActive }) =>
        `${styles.item} ${isActive ? styles.itemActive : ""} ${isDropActive ? styles.itemDropActive : ""} `
        }
        to={`${RouteConfig.CHANNEL.replace(
          /:uuid/,
          channel.uuid
        )}?channelUuid=${channel.uuid}&type=${channel.item_type}&feedUrl=${channel.feed_url}`}
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
