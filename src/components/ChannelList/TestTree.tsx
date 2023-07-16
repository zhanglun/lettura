import React, { useEffect, useState } from "react";
import {
  ControlledTreeEnvironment,
  Tree,
  TreeDataProvider,
  StaticTreeDataProvider,
  InteractionMode,
  TreeItem,
  TreeItemRenderContext,
  TreeInformation,
  DraggingPosition
} from "react-complex-tree";
import "react-complex-tree/lib/style-modern.css";

import { Channel } from "@/db";
import { FeedItem, renderItemArrow } from "./Item";
import { useBearStore } from "@/hooks/useBearStore";

export interface TestTreeProps {
  treeData: any,
}

export const TestTree = (props: TestTreeProps) => {
  const { treeData } = props;
  const [ focusedItem, setFocusedItem ] = useState();
  const [ expandedItems, setExpandedItems ] = useState([]);
  const [ selectedItems, setSelectedItems ] = useState([]);
  const store = useBearStore((state) => ({
    channel: state.channel
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

    return (
      <FeedItem
        { ...context }
        feed={ item.data }
        arrow={ arrow }
        children={ children }
        isActive={ isActive }
        className={ "" }
        level={ depth }
      />
    );
  }

  function handleDrop<T>(items: TreeItem<T>[], target: DraggingPosition) {
    console.log(items);

  }

  return (
    <ControlledTreeEnvironment
      items={ treeData }
      getItemTitle={ (item) => item.data.title }
      viewState={ {
        ["feeds"]: {
          focusedItem,
          expandedItems,
          selectedItems
        }
      } }
      defaultInteractionMode={ InteractionMode.ClickArrowToExpand }
      canDragAndDrop={ true }
      canReorderItems={ true }
      canDropOnFolder={ true }
      canDropOnNonFolder={ true }
      // onDrop={ handleDrop }
      // @ts-ignore
      onFocusItem={ item => setFocusedItem(item.index) }
      // @ts-ignore
      onExpandItem={ item => setExpandedItems([ ...expandedItems, item.index ]) }
      onCollapseItem={ item =>
        setExpandedItems(expandedItems.filter(expandedItemIndex => expandedItemIndex !== item.index))
      }
      // @ts-ignore
      onSelectItems={ items => setSelectedItems(items) }
    >
      <Tree
        treeId="feeds"
        rootItem="root"
        treeLabel="Feed Tree"
        renderItemTitle={ ({ title }) => <span>{ title }</span> }
        renderItemArrow={ renderItemArrow }
        renderItem={ renderItem }
      />
    </ControlledTreeEnvironment>
  );
};
