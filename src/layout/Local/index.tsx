import React, { useCallback, useEffect, useState } from "react";
import { Outlet, NavLink, useMatch, useNavigate } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import clsx from "clsx";
import { Search, PlusCircle, Settings, FolderPlus, RotateCw } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { ChannelList } from "../../components/Subscribes";
import { useBearStore } from "@/stores";
import { RouteConfig } from "@/config";

import { SpaceSwitcher } from "@/components/SpaceSwitcher";
import { useModal } from "@/components/Modal/useModal";
import { AddFeedChannel } from "@/components/AddFeed";
import { AddFolder } from "@/components/AddFolder";
import { useRefresh } from "@/components/Subscribes/useRefresh";
import { IconButton, Tooltip } from "@radix-ui/themes";
import { SettingPage } from "../Setting";

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

export const LocalPage = React.memo(function () {
  console.log("LocalPage")
  const navigate = useNavigate();
  const matched = useMatch(RouteConfig.LOCAL);
  const store = useBearStore(
    useShallow((state) => ({
      feed: state.feed,
      updateSettingDialogStatus: state.updateSettingDialogStatus,
    }))
  );
  const { getSubscribes, refreshing, startRefresh } = useRefresh();
  const [addFolderDialogStatus, setAddFolderDialogStatus] = useModal();

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

  const getSubscribesCallback = useCallback(getSubscribes, [getSubscribes]);

  return (
    <div className="flex flex-row h-full bg-canvas">
      <div
        className="relative flex h-full w-[var(--app-feedlist-width)] select-none flex-col text-[hsl(var(--foreground))]
  "
      >
        <div className="flex h-[var(--app-toolbar-height)] items-center justify-between bg-[var(--background)] pl-2 pr-3 pt-2">
          <SpaceSwitcher isCollapsed={false} spaces={spaces} />
          <div className="flex items-center gap-3">
            <AddFolder
              action="add"
              dialogStatus={addFolderDialogStatus}
              setDialogStatus={setAddFolderDialogStatus}
              afterConfirm={getSubscribesCallback}
              afterCancel={() => {}}
              trigger={
                <IconButton variant="ghost" size="2" color="gray" className="text-[var(--gray-12)]">
                  <FolderPlus size={14} />
                </IconButton>
              }
            />
            <Tooltip content="Update">
              <IconButton
                size="2"
                loading={refreshing}
                variant="ghost"
                onClick={startRefresh}
                color="gray"
                className="text-[var(--gray-12)]"
              >
                <RotateCw size={14} />
              </IconButton>
            </Tooltip>
          </div>
        </div>
        <div className="mt-4 px-2 pb-3">
          <Tooltip content="Search content" side="right">
            <>
              <NavLink
                to={RouteConfig.SEARCH}
                className={({ isActive }) => {
                  return clsx("sidebar-item", isActive ? "sidebar-item--active" : "");
                }}
              >
                <Search size={16} />
                Search
              </NavLink>
            </>
          </Tooltip>
          <AddFeedChannel>
            <div className={"sidebar-item"}>
              <PlusCircle size={16} />
              New Subscribe
            </div>
          </AddFeedChannel>
          <SettingPage>
            <div className={"sidebar-item"}>
              <Settings size={16} />
              Settings
            </div>
          </SettingPage>
        </div>
        <DndProvider backend={HTML5Backend}>
          <ChannelList />
        </DndProvider>
      </div>

      <Outlet />
    </div>
  );
});
