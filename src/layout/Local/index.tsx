import { useEffect } from "react";
import { Outlet, NavLink, useMatch, useNavigate } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import clsx from "clsx";
import { Search, PlusCircle, Settings, FolderPlus, RefreshCw } from "lucide-react";
import { ChannelList } from "../../components/Subscribes";
import { useBearStore } from "@/stores";
import { RouteConfig } from "@/config";

import { TooltipBox } from "@/components/TooltipBox";
import { SpaceSwitcher } from "@/components/SpaceSwitcher";
import { useModal } from "@/components/Modal/useModal";
import { AddFeedChannel } from "@/components/AddFeed";
import { AddFolder } from "@/components/AddFolder";
import { useRefresh } from "@/components/Subscribes/useRefresh";
import { Icon } from "@/components/Icon";
import { SettingDialog } from "../Setting/SettingDialog";

const spaces = [
  {
    label: "Lettura",
    route: RouteConfig.LOCAL_TODAY,
    // icon: ;
  },
  // {
  //   label: "FreshRSS",
  //   route: RouteConfig.SERVICE_FRESHRSS,
  //   // icon: ;
  // },
];

export function LocalPage() {
  const navigate = useNavigate();
  const matched = useMatch(RouteConfig.LOCAL);
  const store = useBearStore((state) => ({
    feed: state.feed,
  }));
  const [feedList, setFeedList, getFeedList, refreshing, setRefreshing, done, setDone, startRefresh] = useRefresh();
  const [addFolderDialogStatus, setAddFolderDialogStatus] = useModal();
  const [editFolderDialogStatus, setEditFolderDialogStatus] = useModal();

  useEffect(() => {
    if (store.feed && matched) {
      const { feed } = store;

      navigate(
        `${RouteConfig.LOCAL_FEED.replace(/:uuid/, feed.uuid)}?feedUuid=${feed.uuid}&feedUrl=${feed.feed_url}&type=${
          feed.item_type
        }`,
        {
          replace: true,
        }
      );
    }
  }, [matched]);

  return (
    <div className="flex flex-row h-full bg-canvas">
      <div
        className="relative flex h-full w-[var(--app-feedlist-width)] select-none flex-col text-[hsl(var(--foreground))]
  "
      >
        <div className="flex h-[var(--app-toolbar-height)] items-center justify-end bg-[var(--background)] px-2 py-0">
          <SpaceSwitcher isCollapsed={false} spaces={spaces} />
          <div className="flex justify-end">
            <AddFolder
              action="add"
              dialogStatus={addFolderDialogStatus}
              setDialogStatus={setAddFolderDialogStatus}
              afterConfirm={getFeedList}
              afterCancel={() => {}}
              trigger={
                <TooltipBox content="Add folder">
                  <Icon>
                    <FolderPlus size={16} />
                  </Icon>
                </TooltipBox>
              }
            />
            <TooltipBox content="Update">
              <Icon onClick={startRefresh}>
                <RefreshCw size={16} className={`${refreshing ? "spinning" : ""}`} />
              </Icon>
            </TooltipBox>
          </div>
        </div>
        <div className="px-2 pb-3">
          <TooltipBox content="Search content" side="right" className="w-full">
            <NavLink
              to={RouteConfig.SEARCH}
              className={({ isActive }) => {
                return clsx("sidebar-item", isActive ? "sidebar-item--active" : "");
              }}
            >
              <Search size={16} />
              Search
            </NavLink>
          </TooltipBox>
          <AddFeedChannel>
            <div className={"sidebar-item"}>
              <PlusCircle size={16} />
              New Subscribe
            </div>
          </AddFeedChannel>
          <TooltipBox content="Go to settings" side="right" className="w-full">
            {/* <NavLink
              to={RouteConfig.SETTINGS_GENERAL}
              className={({ isActive }) => {
                return clsx("sidebar-item", isActive ? "sidebar-item--active" : "");
              }}
            >
            </NavLink> */}
            <SettingDialog>
              <div className="sidebar-item">
                <Settings size={16} />
                Settings
              </div>
            </SettingDialog>
          </TooltipBox>
        </div>
        <DndProvider backend={HTML5Backend}>
          <ChannelList />
        </DndProvider>
      </div>

      <Outlet />
    </div>
  );
}
