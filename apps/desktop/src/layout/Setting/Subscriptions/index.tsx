import { useMemo, useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import * as dataAgent from "@/helpers/dataAgent";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-dialog";
import { busChannel } from "@/helpers/busChannel";
import { toast } from "sonner";
import { showErrorToast } from "@/helpers/errorHandler";
import { RouteConfig } from "@/config";
import type { FeedResItem } from "@/db";
import { FeedsToolbar } from "@/layout/Feeds/FeedsToolbar";
import { FolderGroup } from "@/layout/Feeds/FolderGroup";
import { FeedRow } from "@/layout/Feeds/FeedRow";
import { FeedContextMenu } from "@/layout/Feeds/FeedContextMenu";
import { AddFolder } from "@/components/AddFolder";
import { AddFeedChannel } from "@/components/AddFeed";

export const Subscriptions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const addFeedTriggerRef = useRef<HTMLSpanElement>(null);

  const store = useBearStore(
    useShallow((state) => ({
      subscribes: state.subscribes,
      feedsSearchQuery: state.feedsSearchQuery,
      setFeedsSearchQuery: state.setFeedsSearchQuery,
      folderFilter: state.folderFilter,
      globalSyncStatus: state.globalSyncStatus,
      contextMenuPosition: state.contextMenuPosition,
      setContextMenuPosition: state.setContextMenuPosition,
      feedContextMenuTarget: state.feedContextMenuTarget,
      setFeedContextMenuTarget: state.setFeedContextMenuTarget,
      syncArticles: state.syncArticles,
      syncAllArticles: state.syncAllArticles,
      getSubscribes: state.getSubscribes,
      setFeed: state.setFeed,
    })),
  );

  useEffect(() => {
    store.getSubscribes();
  }, []);

  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [addFolderDialogStatus, setAddFolderDialogStatus] = useState(false);
  const [importing, setImporting] = useState(false);

  const filteredItems = useMemo(() => {
    const query = store.feedsSearchQuery.toLowerCase();
    return store.subscribes.filter((item) => {
      if (store.folderFilter && item.uuid !== store.folderFilter) return false;
      if (item.item_type === "folder") {
        if (!query) return true;
        const matchFolder = item.title.toLowerCase().includes(query);
        const matchChildren = item.children?.some(
          (c) => c.title.toLowerCase().includes(query) || c.link.toLowerCase().includes(query),
        );
        return matchFolder || matchChildren;
      }
      if (!query) return true;
      return item.title.toLowerCase().includes(query) || item.link.toLowerCase().includes(query);
    });
  }, [store.feedsSearchQuery, store.subscribes, store.folderFilter]);

  const folderItems = filteredItems.filter((i) => i.item_type === "folder");
  const ungroupedFeeds = filteredItems.filter((i) => i.item_type !== "folder");

  const handleToggleFolder = (uuid: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      next.has(uuid) ? next.delete(uuid) : next.add(uuid);
      return next;
    });
  };

  const handleFeedClick = (f: FeedResItem) => {
    store.setFeed(f);
    navigate(
      `${RouteConfig.LOCAL_FEED.replace(/:uuid/, f.uuid)}?feedUuid=${f.uuid}&feedUrl=${encodeURIComponent(f.feed_url)}&type=${f.item_type}`,
    );
  };

  const handleContextMenu = (e: React.MouseEvent, f: FeedResItem) => {
    e.preventDefault();
    store.setFeedContextMenuTarget(f);
    store.setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const handleFeedSync = (f: FeedResItem) => store.syncArticles(f).then(() => store.getSubscribes());

  const handleFeedDelete = (f: FeedResItem) => dataAgent.deleteChannel(f.uuid).then(() => store.getSubscribes());

  const handleFeedMarkAllRead = (f: FeedResItem) => dataAgent.markAllRead({ uuid: f.uuid }).then(() => store.getSubscribes());

  const handleMarkAllRead = () => dataAgent.markAllRead({ isAll: true }).then(() => store.getSubscribes());

  const handleCloseContextMenu = () => {
    store.setContextMenuPosition(null);
    store.setFeedContextMenuTarget(null);
  };

  const handleImportOPML = async () => {
    const selected = await open({ multiple: false, filters: [{ name: "OPML", extensions: ["opml", "xml"] }] });
    if (selected && typeof selected === "string") {
      setImporting(true);
      try {
        const opmlContent = await readTextFile(selected);
        const result = await dataAgent.importOpml(opmlContent);
        busChannel.emit("getChannels");
        if (result.feed_count > 0) toast.success(t("Successfully imported {count} feeds", { count: result.feed_count }));
        if (result.folder_count > 0) toast.success(t("Successfully created {count} folders", { count: result.folder_count }));
        if (result.failed_count > 0) toast.warning(t("Failed to import {count} feeds", { count: result.failed_count }));
      } catch (error) {
        showErrorToast(error, t("Failed to import OPML file"));
      } finally {
        setImporting(false);
      }
    }
  };

  return (
    <div className="settings-panel">
      <FeedsToolbar
        searchQuery={store.feedsSearchQuery}
        onSearchChange={store.setFeedsSearchQuery}
        onAddFeed={() => addFeedTriggerRef.current?.click()}
        onAddFolder={() => setAddFolderDialogStatus(true)}
        onSyncAll={() => store.syncAllArticles()}
        onMarkAllRead={handleMarkAllRead}
        syncing={store.globalSyncStatus}
      />
      <div>
        {folderItems.map((folder) => (
          <FolderGroup
            key={folder.uuid}
            folder={folder}
            isCollapsed={collapsedFolders.has(folder.uuid)}
            onToggle={handleToggleFolder}
            onFeedClick={handleFeedClick}
            onFeedContextMenu={handleContextMenu}
            onFeedSync={handleFeedSync}
            onFeedDelete={handleFeedDelete}
          />
        ))}
        {ungroupedFeeds.map((feed) => (
          <FeedRow
            key={feed.uuid}
            feed={feed}
            onClick={handleFeedClick}
            onContextMenu={handleContextMenu}
            onSync={handleFeedSync}
            onDelete={handleFeedDelete}
          />
        ))}
        {filteredItems.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-[var(--gray-9)]">
            {store.feedsSearchQuery ? t("No feeds match your search") : t("No feeds yet")}
          </div>
        )}
      </div>
      <div className="border-t border-[var(--gray-a5)] px-4 py-2.5 flex items-center gap-4 text-xs text-[var(--gray-9)] bg-[var(--gray-a2)]">
        <button className="btn-ghost text-[11px] py-1 px-2" onClick={handleImportOPML} disabled={importing}>
          {importing ? t("Importing...") : t("Import OPML")}
        </button>
      </div>

      <FeedContextMenu
        feed={store.feedContextMenuTarget}
        position={store.contextMenuPosition}
        onClose={handleCloseContextMenu}
        onViewArticles={handleFeedClick}
        onSync={handleFeedSync}
        onMarkAllRead={handleFeedMarkAllRead}
        onEdit={() => {}}
        onMoveToFolder={() => {}}
        onDisable={() => {}}
        onDelete={handleFeedDelete}
      />
      <AddFolder
        action="add"
        dialogStatus={addFolderDialogStatus}
        setDialogStatus={setAddFolderDialogStatus}
        afterConfirm={() => store.getSubscribes()}
      />
      <AddFeedChannel>
        <span ref={addFeedTriggerRef} className="hidden" />
      </AddFeedChannel>
    </div>
  );
};
