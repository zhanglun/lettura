import { ChevronLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Kbd } from "@astryxdesign/core/Kbd";
import type React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useHotkeys } from "react-hotkeys-hook";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import * as dataAgent from "@/helpers/dataAgent";
import { RouteConfig } from "@/config";
import type { FeedResItem, FolderResItem } from "@/db";
import { DialogUnsubscribeFeed } from "@/layout/Setting/Content/DialogUnsubscribeFeed";
import { DialogDeleteFolder } from "@/layout/Setting/Content/DialogDeleteFolder";
import { AddFolder } from "@/components/AddFolder";
import { FeedIcon } from "@/components/FeedIcon";
import { FeedCtxMenu } from "@/components/FeedCtxMenu";
import { getHostLabel, formatFeedTime } from "@/helpers/feedMeta";
import {
  CheckCheck,
  ChevronDown,
  FolderPlus,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { IconButton } from "@astryxdesign/core/IconButton";

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
  onSync: (feed: FeedResItem) => void;
  onDelete: (feed: FeedResItem) => void;
  onEditFolder: (folder: FeedResItem) => void;
  onDeleteFolder: (folder: FeedResItem) => void;
}

/** 订阅行：44px，题 + 未读药丸 + 域名 + 时间 + 悬停动作（settings.html 契约） */
function SubsRow({
  feed,
  onOpen,
  onSync,
  onDelete,
  onEditFolder,
  onDeleteFolder,
}: SubsRowProps) {
  const { t } = useTranslation();
  const unread = feed.unread ?? 0;
  const broken = (feed.health_status ?? 0) > 0;

  return (
    <FeedCtxMenu
      feed={feed}
      onUnsubscribe={onDelete}
      onEditFolder={onEditFolder}
      onDeleteFolder={onDeleteFolder}
    >
      <div className="fusion-subs-row" onClick={() => onOpen(feed)}>
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
          <IconButton
            size="sm"
            variant="ghost"
            icon={<RefreshCw size={12} />}
            label={broken ? t("fusion.subs.retry") : t("feeds.ctx.sync")}
            onClick={(e) => {
              e.stopPropagation();
              onSync(feed);
            }}
          />
          <IconButton
            size="sm"
            variant="destructive"
            icon={<Trash2 size={12} />}
            label={t("Unsubscribe")}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(feed);
            }}
          />
        </span>
      </div>
    </FeedCtxMenu>
  );
}

interface SubsGroupProps {
  uuid: string;
  title: string;
  feeds: FeedResItem[];
  folder?: FeedResItem | null;
  collapsed: boolean;
  onToggle: () => void;
  onFolderSync?: (folder: FeedResItem) => void;
  onFolderMarkAllRead?: (folder: FeedResItem) => void;
  onFolderEdit?: (folder: FeedResItem) => void;
  onFolderDelete?: (folder: FeedResItem) => void;
  onOpen: (feed: FeedResItem) => void;
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
  onFolderSync,
  onFolderMarkAllRead,
  onFolderEdit,
  onFolderDelete,
  onOpen,
  onFeedSync,
  onFeedDelete,
}: SubsGroupProps) {
  const { t } = useTranslation();
  const unread = feeds.reduce((sum, f) => sum + (f.unread ?? 0), 0);

  const header = (
    <div className="fusion-subs-fh">
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
          <IconButton
            size="sm"
            variant="ghost"
            icon={<RefreshCw size={13} />}
            label={t("feeds.ctx.sync")}
            onClick={() => onFolderSync?.(folder)}
          />
          <IconButton
            size="sm"
            variant="ghost"
            icon={<CheckCheck size={13} />}
            label={t("feeds.ctx.mark_all_read")}
            onClick={() => onFolderMarkAllRead?.(folder)}
          />
          <IconButton
            size="sm"
            variant="ghost"
            icon={<Pencil size={13} />}
            label={t("Edit folder")}
            onClick={() => onFolderEdit?.(folder)}
          />
          <IconButton
            size="sm"
            variant="destructive"
            icon={<Trash2 size={13} />}
            label={t("Delete folder")}
            onClick={() => onFolderDelete?.(folder)}
          />
        </span>
      )}
    </div>
  );

  return (
    <div className={`fusion-b-folder ${collapsed ? "closed" : ""}`}>
      {folder ? (
        <FeedCtxMenu
          feed={folder}
          onEditFolder={onFolderEdit}
          onDeleteFolder={onFolderDelete}
        >
          {header}
        </FeedCtxMenu>
      ) : (
        header
      )}
      {!collapsed && (
        <div className="fusion-b-feeds">
          {feeds.map((feed) => (
            <SubsRow
              key={feed.uuid}
              feed={feed}
              onOpen={onOpen}
              onSync={onFeedSync}
              onDelete={onFeedDelete}
              onEditFolder={onFolderEdit!}
              onDeleteFolder={onFolderDelete!}
            />
          ))}
        </div>
      )}
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
  const [deleteFeed, setDeleteFeed] = useState<FeedResItem | null>(null);
  const [folderTarget, setFolderTarget] = useState<FeedResItem | null>(null);

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

  const handleSync = (f: FeedResItem) =>
    store.syncArticles(f).then(() => store.getSubscribes());

  const handleMarkAllRead = (f: FeedResItem) =>
    dataAgent.markAllRead({ uuid: f.uuid }).then(() => store.getSubscribes());

  return (
    <div className="fusion-set">
      <div className="fusion-dtop">
        <Button
          variant="ghost"
          size="sm"
          icon={<ChevronLeft size={12} />}
          label={t("fusion.nav.settings")}
          endContent={<Kbd keys="esc" />}
          onClick={() => navigate(RouteConfig.SETTINGS)}
        />
        <span className="d-src">{t("settings.tab.subscriptions_title")}</span>
        <span className="fusion-spring" />
        <span className="fusion-subs-fd">
          {t("fusion.subs.meta", { sources: totalFeeds, folders: folderItems.length })}
        </span>
      </div>

      <div className="fusion-set-body">
        <div className="fusion-set-inner wide">
          <div className="fusion-subs-bar">
            <TextInput
              className="fusion-subs-search"
              size="sm"
              isLabelHidden
              label={t("settings.subscriptions.search_placeholder")}
              startIcon={<Search size={12} />}
              placeholder={t("settings.subscriptions.search_placeholder")}
              value={store.feedsSearchQuery}
              onChange={(v) => store.setFeedsSearchQuery(v)}
            />
            <Button
              variant="ghost"
              size="sm"
              icon={<FolderPlus size={12} />}
              label={t("feeds.add_folder")}
              onClick={() => setFolderDialog("add")}
            />
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={12} />}
              label={t("feeds.add_feed")}
              onClick={() => store.setAddFeedModalOpen(true)}
            />
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
