import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ChannelList } from "@/components/Subscribes";

export function SidebarFeeds() {
  return (
    <DndProvider backend={HTML5Backend}>
      <ChannelList />
    </DndProvider>
  );
}
