import { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import {
  Search,
  PlusCircle,
  FolderPlus,
  RotateCw,
} from "lucide-react";
import { IconButton, Tooltip } from "@radix-ui/themes";
import { useShallow } from "zustand/react/shallow";
import { ChannelList } from "../Subscribes";
import { useBearStore } from "@/stores";
import { RouteConfig } from "@/config";
import { AddFeedChannel } from "@/components/AddFeed";
import { AddFolder } from "@/components/AddFolder";
import { useRefresh } from "@/hooks/useRefresh";

export function Sidebar() {
  const { t } = useTranslation();
  const store = useBearStore(
    useShallow((state) => ({
      sidebarCollapsed: state.sidebarCollapsed,
      globalSyncStatus: state.globalSyncStatus,
      getSubscribes: state.getSubscribes,
    })),
  );

  const [addFolderDialogStatus, setAddFolderDialogStatus] = useState(false);
  const { startRefresh } = useRefresh();

  return (
    <div
      className={clsx(
        "h-full border-r border-gray-5 bg-panel select-none flex flex-col transition-all duration-200 ease-out overflow-hidden",
        store.sidebarCollapsed ? "w-0" : "w-60"
      )}
    >
      <div className="flex items-center justify-between px-2 pt-2 h-[var(--app-toolbar-height)] shrink-0">
        <div className="flex items-center gap-1">
          <Tooltip content={t("Search content")} side="right">
            <NavLink
              to={RouteConfig.SEARCH}
              className={({ isActive }) =>
                clsx("sidebar-item", isActive ? "sidebar-item--active" : "")
              }
            >
              <Search size={16} />
              {t("Search")}
            </NavLink>
          </Tooltip>
          <AddFeedChannel>
            <div className="sidebar-item">
              <PlusCircle size={16} />
              {t("New Subscribe")}
            </div>
          </AddFeedChannel>
        </div>
        <div className="flex items-center gap-1">
          <AddFolder
            action="add"
            dialogStatus={addFolderDialogStatus}
            setDialogStatus={setAddFolderDialogStatus}
            afterConfirm={store.getSubscribes}
            afterCancel={() => {}}
            trigger={
              <IconButton
                variant="ghost"
                size="2"
                color="gray"
                className="text-[var(--gray-12)]"
              >
                <FolderPlus size={14} />
              </IconButton>
            }
          />
          <Tooltip content={t("Update")}>
            <IconButton
              size="2"
              loading={store.globalSyncStatus}
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

      <DndProvider backend={HTML5Backend}>
        <ChannelList />
      </DndProvider>

      <div className="shrink-0 px-3 py-3 border-t border-[var(--gray-5)]">
        <div className="text-xs text-[var(--gray-11)] mb-1">
          {t("sidebar.today_focus")} · {t("sidebar.today_focus_hint")}
        </div>
        <div className="text-xs text-[var(--gray-9)]">
          {t("sidebar.no_tracked_topics")}
        </div>
      </div>
    </div>
  );
}
