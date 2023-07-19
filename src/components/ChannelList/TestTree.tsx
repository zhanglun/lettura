import React, { useCallback, useEffect, useState } from "react";
import {
  ControlledTreeEnvironment,
  Tree,
  TreeDataProvider,
  StaticTreeDataProvider,
  InteractionMode,
  TreeItem,
  TreeItemRenderContext,
  TreeInformation,
  DraggingPosition,
} from "react-complex-tree";
import "react-complex-tree/lib/style-modern.css";

import { Channel } from "@/db";
import { FeedItem, renderItemArrow } from "./Item";
import { useBearStore } from "@/hooks/useBearStore";

export interface TestTreeProps {
  treeData: any;
  activeUuid?: string;
}

export const TestTree = (props: TestTreeProps) => {
  const { treeData, activeUuid } = props;
  const [focusedItem, setFocusedItem] = useState();
  const [expandedItems, setExpandedItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const store = useBearStore((state) => ({
    channel: state.channel,
  }));

  function renderItem<T>(props: {
    item: TreeItem<T>;
    depth: number;
    children: any;
    title: React.ReactNode;
    arrow: React.ReactNode;
    context: TreeItemRenderContext<never>;
    info: TreeInformation;
  }) {
    const { item, depth, context, children, title, arrow } = props;
    const { uuid } = item.data as Channel;
    const isActive = store?.channel?.uuid === uuid;
    // const isActive = activeUuid === uuid;

    return (
      <FeedItem
        {...context}
        feed={item.data}
        arrow={arrow}
        children={children}
        isActive={isActive}
        className={""}
        level={depth}
      />
    );
  }

  // const onDrop = useCallback(() => {
  //   return async (items:TreeItem[], target: DraggingPosition) => {
  //     const promises: Promise<void>[] = [];
  //     for (const item of items) {
  //       // @ts-ignore
  //       const parent: TreeItem = Object.values(treeData).find((potentialParent: any) =>
  //         potentialParent.children?.includes(item.index)
  //       );
  //
  //       if (!parent) {
  //         throw Error(`Could not find parent of item "${item.index}"`);
  //       }
  //
  //       if (!parent.children) {
  //         throw Error(
  //           `Parent "${parent.index}" of item "${item.index}" did not have any children`
  //         );
  //       }
  //
  //       if (target.targetType === "item" || target.targetType === "root") {
  //         if (target.targetItem === parent.index) {
  //           // NOOP
  //         } else {
  //           promises.push(
  //             dataProvider.onChangeItemChildren(
  //               parent.index,
  //               parent.children.filter((child) => child !== item.index)
  //             )
  //           );
  //           promises.push(
  //             dataProvider.onChangeItemChildren(target.targetItem, [
  //               ...(treeData[target.targetItem].children ?? []),
  //               item.index
  //             ])
  //           );
  //         }
  //       } else {
  //         const newParent = treeData[target.parentItem];
  //         const newParentChildren = [...(newParent.children ?? [])].filter(
  //           (child) => child !== item.index
  //         );
  //
  //         if (target.parentItem === item.index) {
  //           // Trying to drop inside itself
  //           return;
  //         }
  //
  //         if (target.parentItem === parent.index) {
  //           const isOldItemPriorToNewItem =
  //             ((newParent.children ?? []).findIndex(
  //               (child) => child === item.index
  //             ) ?? Infinity) < target.childIndex;
  //           newParentChildren.splice(
  //             target.childIndex - (isOldItemPriorToNewItem ? 1 : 0),
  //             0,
  //             item.index
  //           );
  //           promises.push(
  //             dataProvider.onChangeItemChildren(
  //               target.parentItem,
  //               newParentChildren
  //             )
  //           );
  //         } else {
  //           newParentChildren.splice(target.childIndex, 0, item.index);
  //           promises.push(
  //             dataProvider.onChangeItemChildren(
  //               parent.index,
  //               parent.children.filter((child) => child !== item.index)
  //             )
  //           );
  //           promises.push(
  //             dataProvider.onChangeItemChildren(
  //               target.parentItem,
  //               newParentChildren
  //             )
  //           );
  //         }
  //       }
  //     }
  //     await Promise.all(promises);
  //     props.onDrop?.(items, target);
  //   };
  // }, [treeData]);

  const onDrop = () => {};

  return (
    <ControlledTreeEnvironment
      items={treeData}
      getItemTitle={(item) => item.data.title}
      viewState={{
        ["feeds"]: {
          focusedItem,
          expandedItems,
          selectedItems,
        },
      }}
      defaultInteractionMode={InteractionMode.ClickArrowToExpand}
      canDragAndDrop={true}
      canReorderItems={true}
      canDropOnFolder={true}
      canDropOnNonFolder={true}
      onDrop={onDrop}
      // @ts-ignore
      onFocusItem={(item) => setFocusedItem(item.index)}
      // @ts-ignore
      onExpandItem={(item) => setExpandedItems([...expandedItems, item.index])}
      onCollapseItem={(item) =>
        setExpandedItems(
          expandedItems.filter(
            (expandedItemIndex) => expandedItemIndex !== item.index,
          ),
        )
      }
      // @ts-ignore
      onSelectItems={(items) => setSelectedItems(items)}
    >
      <Tree
        treeId="feeds"
        rootItem="root"
        treeLabel="Feed Tree"
        renderItemTitle={({ title }) => <span>{title}</span>}
        renderItemArrow={renderItemArrow}
        renderItem={renderItem}
      />
    </ControlledTreeEnvironment>
  );
};
