import { useMemo, useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import * as dataAgent from "@/helpers/dataAgent";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { open, save } from "@tauri-apps/plugin-dialog";
import { busChannel } from "@/helpers/busChannel";
import { toast } from "sonner";
import { showErrorToast } from "@/helpers/errorHandler";
import { RouteConfig } from "@/config";
import type { FeedResItem } from "@/db";
import { FeedContextMenu } from "@/layout/Feeds/FeedContextMenu";
import { AddFolder } from "@/components/AddFolder";
import { AddFeedChannel } from "@/components/AddFeed";
import {
  CheckCheck,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  GripVertical,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

function getFeedUrlLabel(feed: FeedResItem): string {
  const url = feed.link || feed.feed_url || "";
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname === "/" ? "" : parsed.pathname}`;
  } catch {
    return url;
  }
}

function formatSyncTime(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getFeedHealth(feed: FeedResItem): "healthy" | "warning" | "error" {
  if (feed.health_status === 2) return "error";
  if (feed.health_status === 1) return "warning";
  return "healthy";
}

interface SubscriptionToolbarProps {
  searchQuery: string;
  syncing?: boolean;
  onSearchChange: (query: string) => void;
  onAddFeed: () => void;
  onAddFolder: () => void;
  onSyncAll: () => void;
  onMarkAllRead: () => void;
}

function SubscriptionToolbar({
  searchQuery,
  syncing,
  onSearchChange,
  onAddFeed,
  onAddFolder,
  onSyncAll,
  onMarkAllRead,
}: SubscriptionToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="settings-subscriptions-toolbar">
      <input
        type="text"
        className="settings-subscriptions-search"
        value={searchQuery}
        placeholder={t("feeds.search_placeholder")}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <div className="settings-subscriptions-actions">
        <button type="button" className="settings-subscriptions-tool" onClick={onAddFeed}>
          <Plus size={13} />
          {t("feeds.add_feed")}
        </button>
        <button type="button" className="settings-subscriptions-tool" onClick={onAddFolder}>
          <FolderPlus size={13} />
          {t("feeds.add_folder")}
        </button>
        <div className="settings-subscriptions-divider" />
        <button
          type="button"
          className="settings-subscriptions-tool"
          onClick={onSyncAll}
          disabled={syncing}
        >
          <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
          {syncing ? t("Syncing...") : t("Sync All")}
        </button>
        <button type="button" className="settings-subscriptions-tool" onClick={onMarkAllRead}>
          <CheckCheck size={13} />
          {t("Mark all as read")}
        </button>
      </div>
    </div>
  );
}

interface SubscriptionFeedRowProps {
  feed: FeedResItem;
  onClick: (feed: FeedResItem) => void;
  onContextMenu: (e: React.MouseEvent, feed: FeedResItem) => void;
  onSync: (feed: FeedResItem) => void;
  onDelete: (feed: FeedResItem) => void;
}

function SubscriptionFeedRow({
  feed,
  onClick,
  onContextMenu,
  onSync,
  onDelete,
}: SubscriptionFeedRowProps) {
  const { t } = useTranslation();
  const health = getFeedHealth(feed);
  const syncTime = formatSyncTime(feed.last_sync_date);

  return (
    <div
      className="settings-subscriptions-row"
      onClick={() => onClick(feed)}
      onContextMenu={(e) => onContextMenu(e, feed)}
    >
      <GripVertical className="settings-subscriptions-drag" size={14} />
      <span className={`settings-subscriptions-health ${health}`} />
      <div className="settings-subscriptions-favicon">
        {feed.logo ? <img src={feed.logo} alt="" /> : <span>{feed.title?.charAt(0)?.toUpperCase() ?? "F"}</span>}
      </div>
      <div className="settings-subscriptions-feed-info">
        <div className="settings-subscriptions-feed-name">{feed.title}</div>
        <div className={`settings-subscriptions-feed-url ${health !== "healthy" ? "error" : ""}`}>
          {getFeedUrlLabel(feed)}
          {health !== "healthy" ? ` · ${t("settings.sources.health_broken")}` : ""}
        </div>
      </div>
      <div className="settings-subscriptions-feed-meta">
        {feed.unread > 0 && <span className="settings-subscriptions-unread">{feed.unread}</span>}
        <span className={`settings-subscriptions-sync ${health !== "healthy" ? "error" : ""}`}>
          {health !== "healthy" ? t("settings.sources.health_broken") : syncTime}
        </span>
      </div>
      <div className="settings-subscriptions-row-actions">
        <button
          type="button"
          className="settings-subscriptions-row-action"
          title={t("settings.sources.action_sync")}
          onClick={(e) => {
            e.stopPropagation();
            onSync(feed);
          }}
        >
          <RefreshCw size={13} />
        </button>
        <button
          type="button"
          className="settings-subscriptions-row-action danger"
          title={t("Delete")}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(feed);
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

interface SubscriptionFolderGroupProps {
  title: string;
  feeds: FeedResItem[];
  isCollapsed: boolean;
  onToggle: () => void;
  onFeedClick: (feed: FeedResItem) => void;
  onFeedContextMenu: (e: React.MouseEvent, feed: FeedResItem) => void;
  onFeedSync: (feed: FeedResItem) => void;
  onFeedDelete: (feed: FeedResItem) => void;
}

function SubscriptionFolderGroup({
  title,
  feeds,
  isCollapsed,
  onToggle,
  onFeedClick,
  onFeedContextMenu,
  onFeedSync,
  onFeedDelete,
}: SubscriptionFolderGroupProps) {
  const { t } = useTranslation();
  const unread = feeds.reduce((sum, feed) => sum + (feed.unread ?? 0), 0);

  return (
    <div className="settings-subscriptions-folder">
      <button type="button" className="settings-subscriptions-folder-header" onClick={onToggle}>
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        <span className="settings-subscriptions-folder-title">{title}</span>
        <span className="settings-subscriptions-folder-count">
          · {t("settings.subscriptions.folder_meta", { sources: feeds.length, unread })}
        </span>
      </button>
      {!isCollapsed && (
        <div className="settings-subscriptions-folder-body">
          {feeds.map((feed) => (
            <SubscriptionFeedRow
              key={feed.uuid}
              feed={feed}
              onClick={onFeedClick}
              onContextMenu={onFeedContextMenu}
              onSync={onFeedSync}
              onDelete={onFeedDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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
  const allVisibleFeeds = filteredItems.flatMap((item) =>
    item.item_type === "folder" ? item.children ?? [] : [item],
  );
  const unreadTotal = allVisibleFeeds.reduce((sum, feed) => sum + (feed.unread ?? 0), 0);
  const brokenTotal = allVisibleFeeds.filter((feed) => (feed.health_status ?? 0) > 0).length;

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

  const handleExportOPML = async () => {
    try {
      const opml = await dataAgent.exportOpml();
      const filePath = await save({
        defaultPath: "lettura-export.opml",
        filters: [{ name: "OPML", extensions: ["opml", "xml"] }],
      });
      if (filePath) {
        await writeTextFile(filePath, opml);
        toast.success(t("Export completed"));
      }
    } catch (error) {
      showErrorToast(error, t("Failed to export OPML file"));
    }
  };

  return (
    <div className="settings-panel settings-subscriptions-shell" data-testid="settings-subscriptions-shell">
      <SubscriptionToolbar
        searchQuery={store.feedsSearchQuery}
        onSearchChange={store.setFeedsSearchQuery}
        onAddFeed={() => addFeedTriggerRef.current?.click()}
        onAddFolder={() => setAddFolderDialogStatus(true)}
        onSyncAll={() => store.syncAllArticles()}
        onMarkAllRead={handleMarkAllRead}
        syncing={store.globalSyncStatus}
      />
      <div className="settings-subscriptions-kpi">
        <div className="card">
          <div className="settings-kpi-value">{allVisibleFeeds.length}</div>
          <div className="settings-kpi-label">{t("settings.subscriptions.kpi_feeds")}</div>
        </div>
        <div className="card">
          <div className="settings-kpi-value">{folderItems.length}</div>
          <div className="settings-kpi-label">{t("settings.subscriptions.kpi_folders")}</div>
        </div>
        <div className="card">
          <div className="settings-kpi-value">{unreadTotal}</div>
          <div className="settings-kpi-label">{t("settings.subscriptions.kpi_unread")}</div>
        </div>
        <div className="card">
          <div className="settings-kpi-value">{brokenTotal}</div>
          <div className="settings-kpi-label">{t("settings.subscriptions.kpi_broken")}</div>
        </div>
      </div>
      <div>
        {ungroupedFeeds.length > 0 && (
          <SubscriptionFolderGroup
            title={t("settings.subscriptions.ungrouped")}
            feeds={ungroupedFeeds}
            isCollapsed={collapsedFolders.has("__ungrouped__")}
            onToggle={() => handleToggleFolder("__ungrouped__")}
            onFeedClick={handleFeedClick}
            onFeedContextMenu={handleContextMenu}
            onFeedSync={handleFeedSync}
            onFeedDelete={handleFeedDelete}
          />
        )}
        {folderItems.map((folder) => (
          <SubscriptionFolderGroup
            key={folder.uuid}
            title={folder.title}
            feeds={folder.children ?? []}
            isCollapsed={collapsedFolders.has(folder.uuid)}
            onToggle={() => handleToggleFolder(folder.uuid)}
            onFeedClick={handleFeedClick}
            onFeedContextMenu={handleContextMenu}
            onFeedSync={handleFeedSync}
            onFeedDelete={handleFeedDelete}
          />
        ))}
        {filteredItems.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-[var(--gray-9)]">
            {store.feedsSearchQuery ? t("No feeds match your search") : t("No feeds yet")}
          </div>
        )}
      </div>
      <div className="settings-subscriptions-footer">
        <button className="settings-subscriptions-tool" onClick={handleImportOPML} disabled={importing}>
          {importing ? t("Importing...") : t("Import OPML")}
        </button>
        <button className="settings-subscriptions-tool" onClick={handleExportOPML}>
          {t("Export OPML")}
        </button>
        <span>{t("settings.subscriptions.context_hint")}</span>
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
