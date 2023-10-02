import React, { useCallback, useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { List } from "./List";

export const ListContainer = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <List />
      {/* <TreeView /> */}
    </DndProvider>
  );
};
