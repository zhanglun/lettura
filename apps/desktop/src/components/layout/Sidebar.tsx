import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FolderPlus,
  RotateCw,
  PlusCircle,
  PanelLeftClose,
} from "lucide-react";
import { IconButton, Tooltip } from "@radix-ui/themes";
import { useShallow } from "zustand/react/shallow";
import { AddFeedChannel } from "@/components/AddFeed";
import { AddFolder } from "@/components/AddFolder";
import { useRefresh } from "@/hooks/useRefresh";
import { useBearStore } from "@/stores";
import { SidebarToday } from "./SidebarToday";
import { SidebarTopics } from "./SidebarTopics";
import { SidebarFeeds } from "./SidebarFeeds";

export type SidebarContext = "today" | "topics" | "feeds" | "default";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  context?: SidebarContext;
}

export const Sidebar = React.memo(function ({
  collapsed,
  onToggle,
  context = "default",
}: SidebarProps) {
  const { t } = useTranslation();
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

  const renderContextContent = () => {
    switch (context) {
      case "today":
        return <SidebarToday />;
      case "topics":
        return <SidebarTopics />;
      case "feeds":
        return <SidebarFeeds />;
      default:
        return <SidebarToday />;
    }
  };

  return (
    <div className="flex flex-col h-full w-[240px] bg-[var(--gray-1)] border-r border-[var(--gray-4)] select-none shrink-0 overflow-hidden">
      <div className="flex items-center justify-between h-[var(--app-toolbar-height)] px-3 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--gray-12)]">
            {t(`layout.sidebar.context_${context}`)}
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

      <div className="flex-1 overflow-auto">
        {renderContextContent()}
      </div>

      {context === "feeds" && (
        <div className="flex items-center gap-1 px-3 py-2 border-t border-[var(--gray-4)]">
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
      )}
    </div>
  );
});
