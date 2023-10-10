import { FeedResItem } from "@/db";

function flatten(
  items: FeedResItem[],
  parentId: string | null = null,
  depth = 0
): FeedResItem[] {
  return items.reduce<FeedResItem[]>((acc, item, index) => {
    return [
      ...acc,
      { ...item, parentId, depth, index },
      ...flatten(item.children, item.uuid, depth + 1),
    ];
  }, []);
}

export function findItemDeep(
  items: TreeItem[],
  itemId: string
): TreeItem | undefined {
  for (const item of items) {
    const { uuid, children = [] } = item;

    if (uuid === itemId) {
      return item;
    }

    if (children.length) {
      const child = findItemDeep(children as TreeItem[], itemId);

      if (child) {
        return child;
      }
    }
  }

  return undefined;
}

export function removeItem(items: FeedResItem[], uuid: string) {
  const newItems = [];

  for (const item of items) {
    if (item.uuid === uuid) {
      continue;
    }

    if (item.children && item.children.length) {
      item.children = removeItem(item.children, uuid);
    }

    newItems.push(item);
  }

  return newItems;
}


export function findFolderAndIndex(
  items: FeedResItem[],
  uuid: string
): [number, FeedResItem] {
  const index = items.findIndex((item) => item.uuid === uuid);

  if (index > -1) {
    return [index, { ...items[index] }];
  } else {
    return [index, {} as FeedResItem];
  }
}

export function adjustedTargetIndex(
  targetIndex: number,
  foundIndex: number,
  position: string | null
) {
  if (position !== "top") {
    targetIndex += 1;
  }

  if (foundIndex === -1) {
    return targetIndex;
  } else {
    return targetIndex > foundIndex ? targetIndex - 1 : targetIndex;
  }
}

export interface TreeItem extends FeedResItem {
  is_expanded: boolean;
}

export function getParent(items: TreeItem[], uuid: string): TreeItem | null {
  for (const item of items) {
    if (item.children && item.children.length > 0) {
      if (item.children.some(child => child.uuid === uuid)) {
        return item; // 找到了父级元素
      } else {
        const foundParent = getParent(item.children as TreeItem[], uuid);

        if (foundParent) {
          return foundParent; // 找到了父级元素
        }
      }
    }
  }

  return null; // 没有找到匹配的父级元素
}
