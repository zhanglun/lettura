import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useHotkeys } from "react-hotkeys-hook";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import { toast } from "sonner";
import { showErrorToast } from "@/helpers/errorHandler";
import { RouteConfig } from "@/config";
import type { FeedResItem, FolderResItem } from "@/db";
import { DialogUnsubscribeFeed } from "@/layout/Setting/Content/DialogUnsubscribeFeed";
import { DialogDeleteFolder } from "@/layout/Setting/Content/DialogDeleteFolder";
import { AddFolder } from "@/components/AddFolder";
import { FeedIcon } from "@/components/FeedIcon";
import { getHostLabel, formatFeedTime } from "@/helpers/feedMeta";
import { copyText } from "@/helpers/copyText";
import { open as openExternal } from "@tauri-apps/plugin-shell";
import {
  BookOpen,
  CheckCheck,
  ChevronDown,
  Clipboard,
  ExternalLink,
  FolderInput,
  Pencil,
  Plus,
  RefreshCw,
  FolderPlus,
  Search,
  Trash2,
} from "lucide-react";

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

interface SubsRowProps {
  feed: FeedResItem;
  onOpen: (feed: FeedResItem) => void;
  onContextMenu: (e: React.MouseEvent, feed: FeedResItem) => void;
  onSync: (feed: FeedResItem) => void;
  onDelete: (feed: FeedResItem) => void;
}

/** 订阅行：44px，题 + 未读药丸 + 域名 + 时间 + 悬停动作（settings.html 契约） */
function SubsRow({ feed, onOpen, onContextMenu, onSync, onDelete }: SubsRowProps) {
  const { t } = useTranslation();
  const unread = feed.unread ?? 0;
  const broken = (feed.health_status ?? 0) > 0;

  return (
    <div
      className="fusion-subs-row"
      onClick={() => onOpen(feed)}
      onContextMenu={(e) => onContextMenu(e, feed)}
    >
      <FeedIcon feed={feed} />
      <span className="fusion-subs-ft">
        <span className="nm">{feed.title}</span>
        {unread > 0 && <span className="uc">{unread}</span>}
      </span>
      <span className={`fusion-subs-fh2 ${broken ? "is-fail" : ""}`}>
        {getHostLabel(feed)}
        {broken ? ` · ${t("settings.sources.health_broken")}` : ""}
      </span>
      <span className="fusion-subs-fd">
        {formatFeedTime(feed.last_sync_date) || "—"}
      </span>
      <span className="fusion-subs-fa">
        <button
          type="button"
          className="fusion-qa3"
          title={broken ? t("fusion.subs.retry") : t("feeds.ctx.sync")}
          onClick={(e) => {
            e.stopPropagation();
            onSync(feed);
          }}
        >
          <RefreshCw size={12} />
        </button>
        <button
          type="button"
          className="fusion-qa3 danger"
          title={t("Unsubscribe")}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(feed);
          }}
        >
          <Trash2 size={12} />
        </button>
      </span>
    </div>
  );
}

interface SubsGroupProps {
  uuid: string;
  title: string;
  feeds: FeedResItem[];
  folder?: FeedResItem | null;
  collapsed: boolean;
  onToggle: () => void;
  onFolderContextMenu?: (e: React.MouseEvent, folder: FeedResItem) => void;
  onFolderSync?: (folder: FeedResItem) => void;
  onFolderMarkAllRead?: (folder: FeedResItem) => void;
  onFolderEdit?: (folder: FeedResItem) => void;
  onFolderDelete?: (folder: FeedResItem) => void;
  onOpen: (feed: FeedResItem) => void;
  onFeedContextMenu: (e: React.MouseEvent, feed: FeedResItem) => void;
  onFeedSync: (feed: FeedResItem) => void;
  onFeedDelete: (feed: FeedResItem) => void;
}

function SubsGroup({
  uuid,
  title,
  feeds,
  folder,
  collapsed,
  onToggle,
  onFolderContextMenu,
  onFolderSync,
  onFolderMarkAllRead,
  onFolderEdit,
  onFolderDelete,
  onOpen,
  onFeedContextMenu,
  onFeedSync,
  onFeedDelete,
}: SubsGroupProps) {
  const { t } = useTranslation();
  const unread = feeds.reduce((sum, f) => sum + (f.unread ?? 0), 0);

  return (
    <div className={`fusion-b-folder ${collapsed ? "closed" : ""}`}>
      <div
        className="fusion-subs-fh"
        onContextMenu={(e) => {
          if (!(folder && onFolderContextMenu)) return;
          onFolderContextMenu(e, folder);
        }}
      >
        <button type="button" className="fusion-b-head" onClick={onToggle}>
          <span className="fusion-b-chev">
            <ChevronDown size={12} />
          </span>
          <span className="fusion-b-title">{title}</span>
          <span className="fusion-b-count">
            · {t("settings.subscriptions.folder_meta", { sources: feeds.length, unread })}
          </span>
        </button>
        {folder && (
          <span className="fusion-subs-fa">
            <button
              type="button"
              className="fusion-qa2"
              title={t("feeds.ctx.sync")}
              onClick={() => onFolderSync?.(folder)}
            >
              <RefreshCw size={13} />
            </button>
            <button
              type="button"
              className="fusion-qa2"
              title={t("feeds.ctx.mark_all_read")}
              onClick={() => onFolderMarkAllRead?.(folder)}
            >
              <CheckCheck size={13} />
            </button>
            <button
              type="button"
              className="fusion-qa2"
              title={t("Edit folder")}
              onClick={() => onFolderEdit?.(folder)}
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              className="fusion-qa2 danger"
              title={t("Delete folder")}
              onClick={() => onFolderDelete?.(folder)}
            >
              <Trash2 size={13} />
            </button>
          </span>
        )}
      </div>
      {!collapsed && (
        <div className="fusion-b-feeds">
          {feeds.map((feed) => (
            <SubsRow
              key={feed.uuid}
              feed={feed}
              onOpen={onOpen}
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

interface CtxMenuProps {
  target: FeedResItem | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onOpen: (feed: FeedResItem) => void;
  onSync: (feed: FeedResItem) => void;
  onMarkAllRead: (feed: FeedResItem) => void;
  onMove: (feed: FeedResItem) => void;
  onOpenHome: (feed: FeedResItem) => void;
  onCopyFeedUrl: (feed: FeedResItem) => void;
  onDelete: (feed: FeedResItem) => void;
  onEditFolder: (folder: FeedResItem) => void;
  onDeleteFolder: (folder: FeedResItem) => void;
}

/** 右键菜单＝命令面板浮层语法（settings.html 契约） */
function CtxMenu({
  target,
  position,
  onClose,
  onOpen,
  onSync,
  onMarkAllRead,
  onMove,
  onOpenHome,
  onCopyFeedUrl,
  onDelete,
  onEditFolder,
  onDeleteFolder,
}: CtxMenuProps) {
  const { t } = useTranslation();
  if (!(target && position)) return null;

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
      className={`mi ${danger ? "danger" : ""}`}
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
    <div
      className="fusion-ctx"
      style={{ left: position.x, top: position.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{ position: "fixed", inset: 0, zIndex: -1 }}
        onClick={onClose}
      />
      {isFolder ? (
        <>
          {item("sync", <RefreshCw size={13} />, t("feeds.ctx.sync"), () => onSync(target))}
          {item("read", <CheckCheck size={13} />, t("feeds.ctx.mark_all_read"), () => onMarkAllRead(target))}
          {item("edit", <Pencil size={13} />, t("Edit folder"), () => onEditFolder(target))}
          <hr />
          {item("delete", <Trash2 size={13} />, t("Delete folder"), () => onDeleteFolder(target), true)}
        </>
      ) : (
        <>
          {item("open", <BookOpen size={13} />, t("feeds.ctx.view_articles"), () => onOpen(target))}
          {item("sync", <RefreshCw size={13} />, t("feeds.ctx.sync"), () => onSync(target))}
          {item("read", <CheckCheck size={13} />, t("feeds.ctx.mark_all_read"), () => onMarkAllRead(target))}
          {item("move", <FolderInput size={13} />, t("feeds.ctx.move_to_folder"), () => onMove(target))}
          <hr />
          {item("home", <ExternalLink size={13} />, t("Open home page"), () => onOpenHome(target))}
          {item("copy", <Clipboard size={13} />, t("Copy feed URL"), () => onCopyFeedUrl(target))}
          <hr />
          {item("delete", <Trash2 size={13} />, t("feeds.ctx.delete"), () => onDelete(target), true)}
        </>
      )}
    </div>
  );
}

interface MoveDialogProps {
  feed: FeedResItem | null;
  folders: FeedResItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMove: (feed: FeedResItem, folderUuid: string) => void;
}

function MoveDialog({ feed, folders, open, onOpenChange, onMove }: MoveDialogProps) {
  const { t } = useTranslation();
  const [folderUuid, setFolderUuid] = useState("");

  useEffect(() => {
    if (open) setFolderUuid(feed?.folder_uuid ?? "");
  }, [open, feed?.folder_uuid]);

  if (!(open && feed)) return null;

  return (
    <div className="fusion-veil" onClick={() => onOpenChange(false)}>
      <div
        className="fusion-float fusion-add"
        style={{ top: 160 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fusion-abody">
          <div className="fusion-next-h">{t("settings.subscriptions.move_title")}</div>
          <div className="fusion-subs-ft" style={{ padding: "8px 0 4px" }}>
            <span className="nm">{feed.title}</span>
          </div>
          <select
            className="fusion-sel"
            style={{ width: "100%", maxWidth: "none", marginTop: 10 }}
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
            <button type="button" className="fusion-btn-gh" onClick={() => onOpenChange(false)}>
              {t("Cancel")}
            </button>
            <button
              type="button"
              className="fusion-btn-ink-sm"
              onClick={() => onMove(feed, folderUuid)}
            >
              {t("Save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 订阅管理：分组折叠 + 44px 订阅行 + 右键菜单（settings.html ?view=subs 契约） */
export const Subscriptions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const store = useBearStore(
    useShallow((state) => ({
      subscribes: state.subscribes,
      feedsSearchQuery: state.feedsSearchQuery,
      setFeedsSearchQuery: state.setFeedsSearchQuery,
      syncArticles: state.syncArticles,
      getSubscribes: state.getSubscribes,
      setFeed: state.setFeed,
      setAddFeedModalOpen: state.setAddFeedModalOpen,
    })),
  );

  useEffect(() => {
    store.getSubscribes();
  }, []);

  // esc 逐级退回：订阅管理 → 设置（DESIGN 键盘模型契约；沉浸页优先）
  useHotkeys("escape", () => {
    if (useBearStore.getState().playerMode === "full") return;
    navigate(RouteConfig.SETTINGS);
  });

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [folderDialog, setFolderDialog] = useState<"add" | "edit" | null>(null);
  const [deleteFolderDialog, setDeleteFolderDialog] = useState(false);
  const [deleteFeedDialog, setDeleteFeedDialog] = useState(false);
  const [moveDialog, setMoveDialog] = useState(false);
  const [moveFeed, setMoveFeed] = useState<FeedResItem | null>(null);
  const [deleteFeed, setDeleteFeed] = useState<FeedResItem | null>(null);
  const [folderTarget, setFolderTarget] = useState<FeedResItem | null>(null);
  const [ctxTarget, setCtxTarget] = useState<FeedResItem | null>(null);
  const [ctxPos, setCtxPos] = useState<{ x: number; y: number } | null>(null);

  const sourceItems = store.subscribes;
  const folderItems = sourceItems.filter((i) => i.item_type === "folder");
  const rootFeeds = sourceItems.filter((i) => i.item_type !== "folder");

  const matches = (feed: FeedResItem) => {
    const q = store.feedsSearchQuery.toLowerCase();
    if (!q) return true;
    return (
      feed.title.toLowerCase().includes(q) ||
      (feed.link ?? "").toLowerCase().includes(q) ||
      (feed.feed_url ?? "").toLowerCase().includes(q)
    );
  };

  const groups = useMemo(() => {
    const list: { uuid: string; title: string; feeds: FeedResItem[]; folder: FeedResItem | null }[] = [];
    const ungrouped = rootFeeds.filter(matches);
    if (ungrouped.length > 0) {
      list.push({ uuid: "__ungrouped__", title: t("feeds.ungrouped"), feeds: ungrouped, folder: null });
    }
    for (const folder of folderItems) {
      const feeds = (folder.children ?? []).filter(matches);
      if (feeds.length > 0) {
        list.push({ uuid: folder.uuid, title: folder.title, feeds, folder });
      }
    }
    return list;
  }, [sourceItems, store.feedsSearchQuery, t]);

  const totalFeeds = groups.reduce((sum, g) => sum + g.feeds.length, 0);

  const closeCtx = () => {
    setCtxPos(null);
    setCtxTarget(null);
  };

  const handleToggle = (uuid: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  };

  const handleOpen = (f: FeedResItem) => {
    store.setFeed(f);
    navigate(
      `${RouteConfig.LOCAL_FEED.replace(/:uuid/, f.uuid)}?feedUuid=${f.uuid}&feedUrl=${encodeURIComponent(f.feed_url)}&type=${f.item_type}`,
    );
  };

  const handleCtx = (e: React.MouseEvent, f: FeedResItem) => {
    e.preventDefault();
    setCtxTarget(f);
    setCtxPos({ x: e.clientX, y: e.clientY });
  };

  const handleSync = (f: FeedResItem) =>
    store.syncArticles(f).then(() => store.getSubscribes());

  const handleMarkAllRead = (f: FeedResItem) =>
    dataAgent.markAllRead({ uuid: f.uuid }).then(() => store.getSubscribes());

  const handleMove = (feed: FeedResItem) => {
    setMoveFeed(feed);
    setMoveDialog(true);
  };

  const handleMoveConfirm = (feed: FeedResItem, folderUuid: string) => {
    dataAgent
      .moveChannelIntoFolder(feed.uuid, folderUuid, feed.sort ?? 0)
      .then(() => {
        toast.success(t("settings.subscriptions.moved"));
        setMoveDialog(false);
        setMoveFeed(null);
        store.getSubscribes();
        busChannel.emit("getChannels");
      })
      .catch((error) => showErrorToast(error, t("settings.subscriptions.move_failed")));
  };

  const handleOpenHome = (feed: FeedResItem) => {
    if (feed.link) openExternal(feed.link);
  };

  const handleCopyFeedUrl = (feed: FeedResItem) => {
    if (!feed.feed_url) return;
    copyText(feed.feed_url).then(() =>
      toast.message(t("Current URL copied to clipboard")),
    );
  };

  return (
    <div className="fusion-set">
      <div className="fusion-dtop">
        <button
          type="button"
          className="fusion-back"
          onClick={() => navigate(RouteConfig.SETTINGS)}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M10 3 5 8l5 5" />
          </svg>
          {t("fusion.nav.settings")}
          <kbd className="fusion-kbd">esc</kbd>
        </button>
        <span className="d-src">{t("settings.tab.subscriptions_title")}</span>
        <span className="fusion-spring" />
        <span className="fusion-subs-fd">
          {t("fusion.subs.meta", { sources: totalFeeds, folders: folderItems.length })}
        </span>
      </div>

      <div className="fusion-set-body">
        <div className="fusion-set-inner">
          <div className="fusion-subs-bar">
            <span className="fusion-subs-search">
              <Search size={12} />
              <input
                placeholder={t("settings.subscriptions.search_placeholder")}
                value={store.feedsSearchQuery}
                onChange={(e) => store.setFeedsSearchQuery(e.target.value)}
              />
            </span>
            <button
              type="button"
              className="fusion-btn-gh"
              onClick={() => setFolderDialog("add")}
            >
              <FolderPlus size={12} />
              {t("feeds.add_folder")}
            </button>
            <button
              type="button"
              className="fusion-btn-ink-sm"
              onClick={() => store.setAddFeedModalOpen(true)}
            >
              <Plus size={12} />
              {t("feeds.add_feed")}
            </button>
          </div>

          {groups.map((group) => (
            <SubsGroup
              key={group.uuid}
              uuid={group.uuid}
              title={group.title}
              feeds={group.feeds}
              folder={group.folder}
              collapsed={collapsed.has(group.uuid)}
              onToggle={() => handleToggle(group.uuid)}
              onFolderContextMenu={handleCtx}
              onFolderSync={handleSync}
              onFolderMarkAllRead={handleMarkAllRead}
              onFolderEdit={(f) => {
                setFolderTarget(f);
                setFolderDialog("edit");
              }}
              onFolderDelete={(f) => {
                setFolderTarget(f);
                setDeleteFolderDialog(true);
              }}
              onOpen={handleOpen}
              onFeedContextMenu={handleCtx}
              onFeedSync={handleSync}
              onFeedDelete={(f) => {
                setDeleteFeed(f);
                setDeleteFeedDialog(true);
              }}
            />
          ))}

          {groups.length === 0 && (
            <div className="py-10 text-center text-[13px] text-[var(--fusion-ter)]">
              {store.feedsSearchQuery
                ? t("No feeds match your search")
                : t("No feeds yet")}
            </div>
          )}
        </div>
      </div>

      <CtxMenu
        target={ctxTarget}
        position={ctxPos}
        onClose={closeCtx}
        onOpen={handleOpen}
        onSync={handleSync}
        onMarkAllRead={handleMarkAllRead}
        onMove={handleMove}
        onOpenHome={handleOpenHome}
        onCopyFeedUrl={handleCopyFeedUrl}
        onDelete={(f) => {
          setDeleteFeed(f);
          setDeleteFeedDialog(true);
        }}
        onEditFolder={(f) => {
          setFolderTarget(f);
          setFolderDialog("edit");
        }}
        onDeleteFolder={(f) => {
          setFolderTarget(f);
          setDeleteFolderDialog(true);
        }}
      />

      <MoveDialog
        feed={moveFeed}
        folders={folderItems}
        open={moveDialog}
        onOpenChange={setMoveDialog}
        onMove={handleMoveConfirm}
      />
      <DialogUnsubscribeFeed
        feed={deleteFeed}
        dialogStatus={deleteFeedDialog}
        setDialogStatus={setDeleteFeedDialog}
        afterConfirm={() => {
          setDeleteFeed(null);
          store.getSubscribes();
        }}
        afterCancel={() => setDeleteFeed(null)}
      />
      <DialogDeleteFolder
        folder={toFolderResItem(folderTarget)}
        dialogStatus={deleteFolderDialog}
        setDialogStatus={setDeleteFolderDialog}
        afterConfirm={() => {
          setFolderTarget(null);
          store.getSubscribes();
        }}
        afterCancel={() => setFolderTarget(null)}
      />
      <AddFolder
        action="add"
        dialogStatus={folderDialog === "add"}
        setDialogStatus={(v) => setFolderDialog(v ? "add" : null)}
        afterConfirm={() => store.getSubscribes()}
      />
      <AddFolder
        action="edit"
        folder={toFolderResItem(folderTarget)}
        dialogStatus={folderDialog === "edit"}
        setDialogStatus={(v) => setFolderDialog(v ? "edit" : null)}
        afterConfirm={() => {
          setFolderTarget(null);
          store.getSubscribes();
        }}
        afterCancel={() => setFolderTarget(null)}
      />
    </div>
  );
};
