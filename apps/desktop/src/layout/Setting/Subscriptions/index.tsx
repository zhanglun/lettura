import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
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
import type { FeedResItem, FolderResItem } from "@/db";
import { DialogUnsubscribeFeed } from "@/layout/Setting/Content/DialogUnsubscribeFeed";
import { DialogDeleteFolder } from "@/layout/Setting/Content/DialogDeleteFolder";
import { AddFolder } from "@/components/AddFolder";
import { AddFeedChannel } from "@/components/AddFeed";
import { copyText } from "@/helpers/copyText";
import { open as openExternal } from "@tauri-apps/plugin-shell";
import {
  BookOpen,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Clipboard,
  ExternalLink,
  FileText,
  FolderPlus,
  FolderInput,
  GripVertical,
  Image,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

type SubscriptionFilter = "all" | "unread" | "broken" | "ungrouped";

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

function toFolderResItem(folder: FeedResItem | null): FolderResItem | null {
  if (!folder) return null;
  return {
    id: folder.id ?? 0,
    uuid: folder.uuid,
    title: folder.title,
    sort: folder.sort ?? 0,
    create_date:
      folder.create_date instanceof Date
        ? folder.create_date.toISOString()
        : (folder.create_date ?? ""),
    update_date:
      folder.update_date instanceof Date
        ? folder.update_date.toISOString()
        : (folder.update_date ?? ""),
  };
}

interface SubscriptionToolbarProps {
  searchQuery: string;
  syncing?: boolean;
  activeFilter: SubscriptionFilter;
  counts: Record<SubscriptionFilter, number>;
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: SubscriptionFilter) => void;
  onAddFeed: () => void;
  onAddFolder: () => void;
  onSyncAll: () => void;
  onMarkAllRead: () => void;
}

function SubscriptionToolbar({
  searchQuery,
  syncing,
  activeFilter,
  counts,
  onSearchChange,
  onFilterChange,
  onAddFeed,
  onAddFolder,
  onSyncAll,
  onMarkAllRead,
}: SubscriptionToolbarProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="settings-subscriptions-toolbar">
        <input
          type="text"
          className="settings-subscriptions-search"
          value={searchQuery}
          placeholder={t("settings.subscriptions.search_placeholder")}
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
      <div className="settings-subscriptions-filterbar">
        {(["all", "unread", "broken", "ungrouped"] as SubscriptionFilter[]).map((filter) => (
          <button
            key={filter}
            type="button"
            className={`settings-subscriptions-filter ${activeFilter === filter ? "active" : ""}`}
            onClick={() => onFilterChange(filter)}
          >
            {t(`settings.subscriptions.filter_${filter}`)} {counts[filter]}
          </button>
        ))}
      </div>
    </>
  );
}

interface SubscriptionFeedRowProps {
  feed: FeedResItem;
  selected: boolean;
  onSelect: (feed: FeedResItem) => void;
  onContextMenu: (e: React.MouseEvent, feed: FeedResItem) => void;
  onSync: (feed: FeedResItem) => void;
  onDelete: (feed: FeedResItem) => void;
  onMove: (feed: FeedResItem) => void;
}

function SubscriptionFeedRow({
  feed,
  selected,
  onSelect,
  onContextMenu,
  onSync,
  onDelete,
  onMove,
}: SubscriptionFeedRowProps) {
  const { t } = useTranslation();
  const health = getFeedHealth(feed);
  const syncTime = formatSyncTime(feed.last_sync_date);

  return (
    <div
      className={`settings-subscriptions-row ${selected ? "selected" : ""}`}
      onClick={() => onSelect(feed)}
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
          className="settings-subscriptions-row-action"
          title={t("feeds.ctx.move_to_folder")}
          onClick={(e) => {
            e.stopPropagation();
            onMove(feed);
          }}
        >
          <FolderInput size={13} />
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
  folder?: FeedResItem;
  title: string;
  feeds: FeedResItem[];
  isCollapsed: boolean;
  selectedFeedUuid?: string;
  onToggle: () => void;
  onFolderContextMenu?: (e: React.MouseEvent, folder: FeedResItem) => void;
  onFolderSync?: (folder: FeedResItem) => void;
  onFolderMarkAllRead?: (folder: FeedResItem) => void;
  onFolderEdit?: (folder: FeedResItem) => void;
  onFolderDelete?: (folder: FeedResItem) => void;
  onFeedSelect: (feed: FeedResItem) => void;
  onFeedContextMenu: (e: React.MouseEvent, feed: FeedResItem) => void;
  onFeedSync: (feed: FeedResItem) => void;
  onFeedDelete: (feed: FeedResItem) => void;
  onFeedMove: (feed: FeedResItem) => void;
}

function SubscriptionFolderGroup({
  folder,
  title,
  feeds,
  isCollapsed,
  selectedFeedUuid,
  onToggle,
  onFolderContextMenu,
  onFolderSync,
  onFolderMarkAllRead,
  onFolderEdit,
  onFolderDelete,
  onFeedSelect,
  onFeedContextMenu,
  onFeedSync,
  onFeedDelete,
  onFeedMove,
}: SubscriptionFolderGroupProps) {
  const { t } = useTranslation();
  const unread = feeds.reduce((sum, feed) => sum + (feed.unread ?? 0), 0);

  return (
    <div className="settings-subscriptions-folder">
      <div
        className="settings-subscriptions-folder-header"
        onContextMenu={(e) => {
          if (!folder || !onFolderContextMenu) return;
          onFolderContextMenu(e, folder);
        }}
      >
        <button type="button" className="settings-subscriptions-folder-toggle" onClick={onToggle}>
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          <span className="settings-subscriptions-folder-title">{title}</span>
          <span className="settings-subscriptions-folder-count">
            · {t("settings.subscriptions.folder_meta", { sources: feeds.length, unread })}
          </span>
        </button>
        {folder && (
          <div className="settings-subscriptions-folder-actions">
            <button type="button" className="settings-subscriptions-row-action" title={t("feeds.ctx.sync")} onClick={() => onFolderSync?.(folder)}>
              <RefreshCw size={13} />
            </button>
            <button type="button" className="settings-subscriptions-row-action" title={t("feeds.ctx.mark_all_read")} onClick={() => onFolderMarkAllRead?.(folder)}>
              <CheckCheck size={13} />
            </button>
            <button type="button" className="settings-subscriptions-row-action" title={t("Edit folder")} onClick={() => onFolderEdit?.(folder)}>
              <Pencil size={13} />
            </button>
            <button type="button" className="settings-subscriptions-row-action danger" title={t("Delete folder")} onClick={() => onFolderDelete?.(folder)}>
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
      {!isCollapsed && (
        <div className="settings-subscriptions-folder-body">
          {feeds.map((feed) => (
            <SubscriptionFeedRow
              key={feed.uuid}
              feed={feed}
              selected={selectedFeedUuid === feed.uuid}
              onSelect={onFeedSelect}
              onContextMenu={onFeedContextMenu}
              onSync={onFeedSync}
              onDelete={onFeedDelete}
              onMove={onFeedMove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SubscriptionContextMenuProps {
  target: FeedResItem | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onViewArticles: (feed: FeedResItem) => void;
  onSelectDetail: (feed: FeedResItem) => void;
  onSync: (feed: FeedResItem) => void;
  onMarkAllRead: (feed: FeedResItem) => void;
  onMove: (feed: FeedResItem) => void;
  onOpenHome: (feed: FeedResItem) => void;
  onCopyFeedUrl: (feed: FeedResItem) => void;
  onCopyHomeUrl: (feed: FeedResItem) => void;
  onReloadIcon: (feed: FeedResItem) => void;
  onDeleteFeed: (feed: FeedResItem) => void;
  onEditFolder: (folder: FeedResItem) => void;
  onDeleteFolder: (folder: FeedResItem) => void;
}

function SubscriptionContextMenu({
  target,
  position,
  onClose,
  onViewArticles,
  onSelectDetail,
  onSync,
  onMarkAllRead,
  onMove,
  onOpenHome,
  onCopyFeedUrl,
  onCopyHomeUrl,
  onReloadIcon,
  onDeleteFeed,
  onEditFolder,
  onDeleteFolder,
}: SubscriptionContextMenuProps) {
  const { t } = useTranslation();

  if (!target || !position) return null;

  const item = (
    key: string,
    icon: React.ReactNode,
    label: string,
    action: () => void,
    danger = false,
  ) => (
    <button
      key={key}
      type="button"
      className={`settings-subscriptions-menu-item ${danger ? "danger" : ""}`}
      onClick={() => {
        action();
        onClose();
      }}
    >
      {icon}
      {label}
    </button>
  );

  const isFolder = target.item_type === "folder";

  return (
    <div className="settings-subscriptions-menu-layer" onClick={onClose}>
      <div
        className="settings-subscriptions-menu"
        style={{ left: position.x, top: position.y }}
        onClick={(e) => e.stopPropagation()}
      >
        {isFolder ? (
          <>
            {item("sync", <RefreshCw size={14} />, t("feeds.ctx.sync"), () => onSync(target))}
            {item("read", <CheckCheck size={14} />, t("feeds.ctx.mark_all_read"), () => onMarkAllRead(target))}
            {item("edit-folder", <Pencil size={14} />, t("Edit folder"), () => onEditFolder(target))}
            <div className="settings-subscriptions-menu-separator" />
            {item("delete-folder", <Trash2 size={14} />, t("Delete folder"), () => onDeleteFolder(target), true)}
          </>
        ) : (
          <>
            {item("articles", <BookOpen size={14} />, t("feeds.ctx.view_articles"), () => onViewArticles(target))}
            {item("detail", <FileText size={14} />, t("settings.subscriptions.view_detail"), () => onSelectDetail(target))}
            {item("sync", <RefreshCw size={14} />, t("feeds.ctx.sync"), () => onSync(target))}
            {item("read", <CheckCheck size={14} />, t("feeds.ctx.mark_all_read"), () => onMarkAllRead(target))}
            {item("move", <FolderInput size={14} />, t("feeds.ctx.move_to_folder"), () => onMove(target))}
            <div className="settings-subscriptions-menu-separator" />
            {item("open", <ExternalLink size={14} />, t("Open home page"), () => onOpenHome(target))}
            {item("copy-feed", <Clipboard size={14} />, t("Copy feed URL"), () => onCopyFeedUrl(target))}
            {item("copy-home", <Clipboard size={14} />, t("Copy home page URL"), () => onCopyHomeUrl(target))}
            {item("icon", <Image size={14} />, t("Reload icon"), () => onReloadIcon(target))}
            <div className="settings-subscriptions-menu-separator" />
            {item("delete", <Trash2 size={14} />, t("feeds.ctx.delete"), () => onDeleteFeed(target), true)}
          </>
        )}
      </div>
    </div>
  );
}

interface MoveFeedDialogProps {
  feed: FeedResItem | null;
  folders: FeedResItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMove: (feed: FeedResItem, folderUuid: string) => void;
}

function MoveFeedDialog({ feed, folders, open, onOpenChange, onMove }: MoveFeedDialogProps) {
  const { t } = useTranslation();
  const [folderUuid, setFolderUuid] = useState("");

  useEffect(() => {
    if (open) setFolderUuid(feed?.folder_uuid ?? "");
  }, [open, feed?.folder_uuid]);

  if (!open || !feed) return null;

  return (
    <div className="settings-subscriptions-modal-layer" onClick={() => onOpenChange(false)}>
      <div className="settings-subscriptions-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-panel-title">{t("settings.subscriptions.move_title")}</div>
        <div className="settings-panel-desc">{feed.title}</div>
        <select
          className="settings-select mt-4 w-full"
          value={folderUuid}
          onChange={(e) => setFolderUuid(e.target.value)}
        >
          <option value="">{t("settings.subscriptions.ungrouped")}</option>
          {folders.map((folder) => (
            <option key={folder.uuid} value={folder.uuid}>
              {folder.title}
            </option>
          ))}
        </select>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={() => onOpenChange(false)}>
            {t("Cancel")}
          </button>
          <button type="button" className="btn-primary" onClick={() => onMove(feed, folderUuid)}>
            {t("Save")}
          </button>
        </div>
      </div>
    </div>
  );
}

interface SubscriptionDetailPanelProps {
  feed: FeedResItem | null;
  folders: FeedResItem[];
  onViewArticles: (feed: FeedResItem) => void;
  onSync: (feed: FeedResItem) => void;
  onMarkAllRead: (feed: FeedResItem) => void;
  onMove: (feed: FeedResItem) => void;
  onOpenHome: (feed: FeedResItem) => void;
  onCopyFeedUrl: (feed: FeedResItem) => void;
  onDelete: (feed: FeedResItem) => void;
}

function SubscriptionDetailPanel({
  feed,
  folders,
  onViewArticles,
  onSync,
  onMarkAllRead,
  onMove,
  onOpenHome,
  onCopyFeedUrl,
  onDelete,
}: SubscriptionDetailPanelProps) {
  const { t } = useTranslation();

  if (!feed) {
    return (
      <div className="settings-panel settings-subscriptions-detail">
        <div className="settings-section">
          <div className="settings-label">{t("settings.subscriptions.detail_empty_title")}</div>
          <div className="settings-help">{t("settings.subscriptions.detail_empty_help")}</div>
        </div>
      </div>
    );
  }

  const health = getFeedHealth(feed);
  const folder = folders.find((item) => item.uuid === feed.folder_uuid);
  const syncTime = formatSyncTime(feed.last_sync_date);

  return (
    <div className="settings-panel settings-subscriptions-detail">
      <div className="settings-section">
        <div className="settings-subscriptions-detail-head">
          <div className="settings-subscriptions-favicon detail">
            {feed.logo ? <img src={feed.logo} alt="" /> : <span>{feed.title?.charAt(0)?.toUpperCase() ?? "F"}</span>}
          </div>
          <div className="min-w-0">
            <div className="settings-panel-title truncate">{feed.title}</div>
            <div className="settings-help">
              {folder?.title ?? t("settings.subscriptions.ungrouped")} · {feed.unread ?? 0} {t("Unread")}
            </div>
          </div>
          <span className={`settings-tag ${health === "healthy" ? "settings-tag--green" : "settings-tag--amber"}`}>
            {health === "healthy" ? t("settings.sources.health_ok") : t("settings.sources.health_broken")}
          </span>
        </div>
      </div>
      <div className="settings-section">
        <div className="settings-label mb-2">{t("settings.subscriptions.detail_title")}</div>
        <div className="settings-subscriptions-detail-list">
          <div><span>{t("settings.subscriptions.home_url")}</span><strong>{feed.link || "-"}</strong></div>
          <div><span>{t("settings.subscriptions.feed_url")}</span><strong>{feed.feed_url || "-"}</strong></div>
          <div><span>{t("settings.subscriptions.last_sync")}</span><strong>{syncTime || "-"}</strong></div>
          <div><span>{t("settings.subscriptions.folder")}</span><strong>{folder?.title ?? t("settings.subscriptions.ungrouped")}</strong></div>
          {health !== "healthy" && (
            <div><span>{t("settings.subscriptions.failure_reason")}</span><strong>{feed.failure_reason || t("settings.sources.health_broken")}</strong></div>
          )}
        </div>
        {feed.description && <div className="settings-help mt-3">{feed.description}</div>}
      </div>
      <div className="settings-section">
        <div className="settings-label mb-2">{t("settings.subscriptions.management_actions")}</div>
        <div className="settings-subscriptions-detail-actions">
          <button type="button" className="settings-subscriptions-tool" onClick={() => onViewArticles(feed)}>{t("feeds.ctx.view_articles")}</button>
          <button type="button" className="settings-subscriptions-tool" onClick={() => onSync(feed)}>{t("feeds.ctx.sync")}</button>
          <button type="button" className="settings-subscriptions-tool" onClick={() => onMove(feed)}>{t("feeds.ctx.move_to_folder")}</button>
          <button type="button" className="settings-subscriptions-tool" onClick={() => onMarkAllRead(feed)}>{t("feeds.ctx.mark_all_read")}</button>
          <button type="button" className="settings-subscriptions-tool" onClick={() => onCopyFeedUrl(feed)}>{t("Copy feed URL")}</button>
          <button type="button" className="settings-subscriptions-tool" onClick={() => onOpenHome(feed)}>{t("Open home page")}</button>
        </div>
        <button type="button" className="settings-subscriptions-danger-button" onClick={() => onDelete(feed)}>
          {t("Unsubscribe")}
        </button>
      </div>
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
  const [editFolderDialogStatus, setEditFolderDialogStatus] = useState(false);
  const [deleteFolderDialogStatus, setDeleteFolderDialogStatus] = useState(false);
  const [deleteFeedDialogStatus, setDeleteFeedDialogStatus] = useState(false);
  const [moveFeedDialogStatus, setMoveFeedDialogStatus] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SubscriptionFilter>("all");
  const [selectedFeed, setSelectedFeed] = useState<FeedResItem | null>(null);
  const [moveFeed, setMoveFeed] = useState<FeedResItem | null>(null);
  const [deleteFeed, setDeleteFeed] = useState<FeedResItem | null>(null);
  const [folderTarget, setFolderTarget] = useState<FeedResItem | null>(null);
  const [importing, setImporting] = useState(false);

  const sourceItems = useMemo(() => store.subscribes, [store.subscribes]);
  const allFeeds = useMemo(
    () => sourceItems.flatMap((item) => (item.item_type === "folder" ? item.children ?? [] : [item])),
    [sourceItems],
  );
  const allFolderItems = sourceItems.filter((i) => i.item_type === "folder");
  const rootFeeds = sourceItems.filter((i) => i.item_type !== "folder");
  const counts = useMemo<Record<SubscriptionFilter, number>>(
    () => ({
      all: allFeeds.length,
      unread: allFeeds.filter((feed) => (feed.unread ?? 0) > 0).length,
      broken: allFeeds.filter((feed) => (feed.health_status ?? 0) > 0).length,
      ungrouped: rootFeeds.length,
    }),
    [allFeeds, rootFeeds.length],
  );

  const filteredItems = useMemo(() => {
    const query = store.feedsSearchQuery.toLowerCase();
    const matchesFeed = (feed: FeedResItem, isUngrouped: boolean) => {
      if (activeFilter === "unread" && (feed.unread ?? 0) <= 0) return false;
      if (activeFilter === "broken" && (feed.health_status ?? 0) <= 0) return false;
      if (activeFilter === "ungrouped" && !isUngrouped) return false;
      if (!query) return true;
      return (
        feed.title.toLowerCase().includes(query) ||
        (feed.link ?? "").toLowerCase().includes(query) ||
        (feed.feed_url ?? "").toLowerCase().includes(query)
      );
    };

    return sourceItems.flatMap((item) => {
      if (item.item_type === "folder") {
        if (store.folderFilter && item.uuid !== store.folderFilter) return [];
        const children = (item.children ?? []).filter((child) => matchesFeed(child, false));
        const matchFolder = item.title.toLowerCase().includes(query);
        if (activeFilter === "ungrouped") return [];
        if (children.length === 0 && !(query && matchFolder && activeFilter === "all")) return [];
        return [{ ...item, children: children.length > 0 ? children : item.children ?? [] }];
      }
      if (store.folderFilter) return [];
      return matchesFeed(item, true) ? [item] : [];
    });
  }, [activeFilter, sourceItems, store.feedsSearchQuery, store.folderFilter]);

  const visibleFolderItems = filteredItems.filter((i) => i.item_type === "folder");
  const ungroupedFeeds = filteredItems.filter((i) => i.item_type !== "folder");
  const allVisibleFeeds = filteredItems.flatMap((item) =>
    item.item_type === "folder" ? item.children ?? [] : [item],
  );
  const unreadTotal = allVisibleFeeds.reduce((sum, feed) => sum + (feed.unread ?? 0), 0);
  const brokenTotal = allVisibleFeeds.filter((feed) => (feed.health_status ?? 0) > 0).length;

  useEffect(() => {
    if (selectedFeed && allVisibleFeeds.some((feed) => feed.uuid === selectedFeed.uuid)) return;
    setSelectedFeed(allVisibleFeeds[0] ?? null);
  }, [allVisibleFeeds, selectedFeed]);

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

  const handleFeedSelect = (f: FeedResItem) => {
    setSelectedFeed(f);
  };

  const handleContextMenu = (e: React.MouseEvent, f: FeedResItem) => {
    e.preventDefault();
    store.setFeedContextMenuTarget(f);
    store.setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const handleFeedSync = (f: FeedResItem) => store.syncArticles(f).then(() => store.getSubscribes());

  const handleFeedDelete = (f: FeedResItem) => {
    setDeleteFeed(f);
    setDeleteFeedDialogStatus(true);
  };

  const handleAfterFeedDelete = () => {
    setSelectedFeed((prev) => (prev?.uuid === deleteFeed?.uuid ? null : prev));
    setDeleteFeed(null);
    store.getSubscribes();
  };

  const handleFolderDelete = (folder: FeedResItem) => {
    setFolderTarget(folder);
    setDeleteFolderDialogStatus(true);
  };

  const handleFolderEdit = (folder: FeedResItem) => {
    setFolderTarget(folder);
    setEditFolderDialogStatus(true);
  };

  const handleFeedMarkAllRead = (f: FeedResItem) => dataAgent.markAllRead({ uuid: f.uuid }).then(() => store.getSubscribes());

  const handleMarkAllRead = () => dataAgent.markAllRead({ isAll: true }).then(() => store.getSubscribes());

  const handleCloseContextMenu = () => {
    store.setContextMenuPosition(null);
    store.setFeedContextMenuTarget(null);
  };

  const handleMoveFeed = (feed: FeedResItem) => {
    setMoveFeed(feed);
    setMoveFeedDialogStatus(true);
  };

  const handleMoveFeedConfirm = (feed: FeedResItem, folderUuid: string) => {
    dataAgent
      .moveChannelIntoFolder(feed.uuid, folderUuid, feed.sort ?? 0)
      .then(() => {
        toast.success(t("settings.subscriptions.moved"));
        setMoveFeedDialogStatus(false);
        setMoveFeed(null);
        store.getSubscribes();
      })
      .catch((error) => showErrorToast(error, t("settings.subscriptions.move_failed")));
  };

  const handleOpenHome = (feed: FeedResItem) => {
    if (feed.link) openExternal(feed.link);
  };

  const handleCopyFeedUrl = (feed: FeedResItem) => {
    if (!feed.feed_url) return;
    copyText(feed.feed_url).then(() => toast.message(t("Current URL copied to clipboard")));
  };

  const handleCopyHomeUrl = (feed: FeedResItem) => {
    if (!feed.link) return;
    copyText(feed.link).then(() => toast.message(t("Current URL copied to clipboard")));
  };

  const handleReloadIcon = (feed: FeedResItem) => {
    dataAgent.updateIcon(feed.uuid, feed.link).then(() => store.getSubscribes());
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
    <div className="settings-subscriptions-admin" data-testid="settings-subscriptions-admin">
      <div className="settings-panel settings-subscriptions-shell" data-testid="settings-subscriptions-shell">
        <SubscriptionToolbar
          searchQuery={store.feedsSearchQuery}
          activeFilter={activeFilter}
          counts={counts}
          onSearchChange={store.setFeedsSearchQuery}
          onFilterChange={setActiveFilter}
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
            <div className="settings-kpi-value">{allFolderItems.length}</div>
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
              selectedFeedUuid={selectedFeed?.uuid}
              isCollapsed={collapsedFolders.has("__ungrouped__")}
              onToggle={() => handleToggleFolder("__ungrouped__")}
              onFeedSelect={handleFeedSelect}
              onFeedContextMenu={handleContextMenu}
              onFeedSync={handleFeedSync}
              onFeedDelete={handleFeedDelete}
              onFeedMove={handleMoveFeed}
            />
          )}
          {visibleFolderItems.map((folder) => (
            <SubscriptionFolderGroup
              key={folder.uuid}
              folder={folder}
              title={folder.title}
              feeds={folder.children ?? []}
              selectedFeedUuid={selectedFeed?.uuid}
              isCollapsed={collapsedFolders.has(folder.uuid)}
              onToggle={() => handleToggleFolder(folder.uuid)}
              onFolderContextMenu={handleContextMenu}
              onFolderSync={handleFeedSync}
              onFolderMarkAllRead={handleFeedMarkAllRead}
              onFolderEdit={handleFolderEdit}
              onFolderDelete={handleFolderDelete}
              onFeedSelect={handleFeedSelect}
              onFeedContextMenu={handleContextMenu}
              onFeedSync={handleFeedSync}
              onFeedDelete={handleFeedDelete}
              onFeedMove={handleMoveFeed}
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
      </div>

      <SubscriptionDetailPanel
        feed={selectedFeed}
        folders={allFolderItems}
        onViewArticles={handleFeedClick}
        onSync={handleFeedSync}
        onMarkAllRead={handleFeedMarkAllRead}
        onMove={handleMoveFeed}
        onOpenHome={handleOpenHome}
        onCopyFeedUrl={handleCopyFeedUrl}
        onDelete={handleFeedDelete}
      />

      <SubscriptionContextMenu
        target={store.feedContextMenuTarget}
        position={store.contextMenuPosition}
        onClose={handleCloseContextMenu}
        onViewArticles={handleFeedClick}
        onSelectDetail={handleFeedSelect}
        onSync={handleFeedSync}
        onMarkAllRead={handleFeedMarkAllRead}
        onMove={handleMoveFeed}
        onOpenHome={handleOpenHome}
        onCopyFeedUrl={handleCopyFeedUrl}
        onCopyHomeUrl={handleCopyHomeUrl}
        onReloadIcon={handleReloadIcon}
        onDeleteFeed={handleFeedDelete}
        onEditFolder={handleFolderEdit}
        onDeleteFolder={handleFolderDelete}
      />
      <MoveFeedDialog
        feed={moveFeed}
        folders={allFolderItems}
        open={moveFeedDialogStatus}
        onOpenChange={setMoveFeedDialogStatus}
        onMove={handleMoveFeedConfirm}
      />
      <DialogUnsubscribeFeed
        feed={deleteFeed}
        dialogStatus={deleteFeedDialogStatus}
        setDialogStatus={setDeleteFeedDialogStatus}
        afterConfirm={handleAfterFeedDelete}
        afterCancel={() => setDeleteFeed(null)}
      />
      <DialogDeleteFolder
        folder={toFolderResItem(folderTarget)}
        dialogStatus={deleteFolderDialogStatus}
        setDialogStatus={setDeleteFolderDialogStatus}
        afterConfirm={() => {
          setFolderTarget(null);
          store.getSubscribes();
        }}
        afterCancel={() => setFolderTarget(null)}
      />
      <AddFolder
        action="add"
        dialogStatus={addFolderDialogStatus}
        setDialogStatus={setAddFolderDialogStatus}
        afterConfirm={() => store.getSubscribes()}
      />
      <AddFolder
        action="edit"
        folder={toFolderResItem(folderTarget)}
        dialogStatus={editFolderDialogStatus}
        setDialogStatus={setEditFolderDialogStatus}
        afterConfirm={() => {
          setFolderTarget(null);
          store.getSubscribes();
        }}
        afterCancel={() => setFolderTarget(null)}
      />
      <AddFeedChannel>
        <span ref={addFeedTriggerRef} className="hidden" />
      </AddFeedChannel>
    </div>
  );
};
