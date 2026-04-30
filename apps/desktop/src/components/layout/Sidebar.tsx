import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FolderPlus,
  RotateCw,
  PlusCircle,
  PanelLeftClose,
  Sparkles,
  Layers,
} from "lucide-react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { IconButton, Tooltip } from "@radix-ui/themes";
import { useShallow } from "zustand/react/shallow";
import { ChannelList } from "@/components/Subscribes";
import { AddFeedChannel } from "@/components/AddFeed";
import { AddFolder } from "@/components/AddFolder";
import { useRefresh } from "@/hooks/useRefresh";
import { useBearStore } from "@/stores";
import { RouteConfig } from "@/config";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar = React.memo(function ({
  collapsed,
  onToggle,
}: SidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const store = useBearStore(
    useShallow((state) => ({
      getSubscribes: state.getSubscribes,
      globalSyncStatus: state.globalSyncStatus,
    })),
  );

  const [addFolderDialogStatus, setAddFolderDialogStatus] = useState(false);
  const { startRefresh } = useRefresh();

  if (collapsed) {
    return null;
  }

  return (
    <div className="flex flex-col h-full w-[240px] bg-[var(--gray-1)] border-r border-[var(--gray-4)] select-none shrink-0 overflow-hidden">
      <div className="flex items-center justify-between h-[var(--app-toolbar-height)] px-3 pt-2">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[var(--accent-9)]" />
          <span className="text-sm font-semibold text-[var(--gray-12)]">
            {t("layout.sidebar.brand")}
          </span>
        </div>
        <Tooltip content={t("layout.sidebar.collapse")} side="right">
          <IconButton
            variant="ghost"
            size="1"
            color="gray"
            className="text-[var(--gray-11)]"
            onClick={onToggle}
          >
            <PanelLeftClose size={14} />
          </IconButton>
        </Tooltip>
      </div>

      <div className="px-3 pb-2">
        <div
          className="flex flex-col gap-0.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-[var(--gray-3)] transition-colors"
          onClick={() => navigate(RouteConfig.LOCAL_TODAY)}
        >
          <span className="text-xs font-medium text-[var(--gray-12)]">
            {t("layout.sidebar.today_focus")}
          </span>
          <span className="text-[11px] text-[var(--gray-9)]">
            {t("layout.sidebar.today_focus_desc")}
          </span>
        </div>
      </div>

      <div className="px-3 pb-2">
        <div
          className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-[var(--gray-3)] transition-colors"
          onClick={() => navigate(RouteConfig.LOCAL_TOPICS)}
        >
          <Layers size={14} className="text-[var(--gray-9)]" />
          <span className="text-xs font-medium text-[var(--gray-12)]">
            {t("layout.rail.topics")}
          </span>
        </div>
      </div>

      <div className="px-3 pb-2">
        <div className="px-2 py-1.5">
          <span className="text-xs font-medium text-[var(--gray-11)]">
            {t("layout.sidebar.tracked_topics")}
          </span>
        </div>
        <div className="px-2 py-2 text-xs text-[var(--gray-9)]">
          {t("layout.sidebar.no_tracked_topics")}
        </div>
      </div>

      <div className="mx-3 border-t border-[var(--gray-4)]" />

      <div className="flex items-center gap-1 px-3 py-2">
        <AddFolder
          action="add"
          dialogStatus={addFolderDialogStatus}
          setDialogStatus={setAddFolderDialogStatus}
          afterConfirm={store.getSubscribes}
          afterCancel={() => {}}
          trigger={
            <IconButton
              variant="ghost"
              size="1"
              color="gray"
              className="text-[var(--gray-11)]"
            >
              <FolderPlus size={14} />
            </IconButton>
          }
        />
        <Tooltip content={t("Update")}>
          <IconButton
            size="1"
            loading={store.globalSyncStatus}
            variant="ghost"
            onClick={startRefresh}
            color="gray"
            className="text-[var(--gray-11)]"
          >
            <RotateCw size={14} />
          </IconButton>
        </Tooltip>
        <AddFeedChannel>
          <IconButton
            variant="ghost"
            size="1"
            color="gray"
            className="text-[var(--gray-11)]"
          >
            <PlusCircle size={14} />
          </IconButton>
        </AddFeedChannel>
      </div>

      <DndProvider backend={HTML5Backend}>
        <ChannelList />
      </DndProvider>
    </div>
  );
});
