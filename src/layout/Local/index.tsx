import { Outlet, useMatch, useNavigate } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { ChannelList } from "../../components/Subscribes";
import { useBearStore } from "@/stores";
import { useEffect } from "react";
import { RouteConfig } from "@/config";

export function LocalPage() {
  const navigate = useNavigate();
  const matched = useMatch(RouteConfig.LOCAL);
  const store = useBearStore((state) => ({
    feed: state.feed,
  }));

  useEffect(() => {
    if (store.feed && matched) {
      const { feed } = store;

      navigate(
        `${RouteConfig.LOCAL_FEED.replace(/:uuid/, feed.uuid)}?feedUuid=${
          feed.uuid
        }&feedUrl=${feed.feed_url}&type=${feed.item_type}`,
        {
          replace: true,
        }
      );
    }
  }, [matched]);

  return (
    <div className="flex flex-row">
      <DndProvider backend={HTML5Backend}>
        <ChannelList />
      </DndProvider>
      <Outlet />
    </div>
  );
}
