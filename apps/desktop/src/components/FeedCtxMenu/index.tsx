import type React from "react";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import { toast } from "@/helpers/toast";
import {
  BookOpen,
  CheckCheck,
  Clipboard,
  ExternalLink,
  FolderInput,
  Pencil,
  RefreshCw,
  Settings,
  Trash2,
} from "lucide-react";
import { RouteConfig } from "@/config";
import { useBearStore } from "@/stores";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import { copyText } from "@/helpers/copyText";
import { showErrorToast } from "@/helpers/errorHandler";
import { open as openExternal } from "@tauri-apps/plugin-shell";
import { ContextMenu } from "@astryxdesign/core/ContextMenu";
import type { ContextMenuOption } from "@astryxdesign/core/ContextMenu";
import type { FeedResItem } from "@/db";

export interface FeedCtxMenuProps {
  /** 右键目标（源或分组） */
  feed: FeedResItem;
  children: React.ReactNode;
  /** 动作完成后回调（默认已刷新订阅列表） */
  onAfterAction?: () => void;
  /** 分组编辑/删除（订阅管理页提供；浏览帧不提供则显示「去管理」入口） */
  onEditFolder?: (folder: FeedResItem) => void;
  onDeleteFolder?: (folder: FeedResItem) => void;
  /** 退订源（订阅管理页提供确认弹窗） */
  onUnsubscribe?: (feed: FeedResItem) => void;
}

/**
 * 源/分组右键菜单（Astryx ContextMenu，声明式包裹目标行）：
 * 源 = 查看/同步/已读/移动分组（悬停子菜单）/主页/复制/退订；
 * 分组 = 同步/已读 +（管理页：编辑/删除｜浏览帧：去管理页）。
 */
export function FeedCtxMenu({
  feed,
  children,
  onAfterAction,
  onEditFolder,
  onDeleteFolder,
  onUnsubscribe,
}: FeedCtxMenuProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const store = useBearStore(
    useShallow((state) => ({
      subscribes: state.subscribes,
      getSubscribes: state.getSubscribes,
      syncArticles: state.syncArticles,
      setFeed: state.setFeed,
    })),
  );

  const refresh = () => {
    store.getSubscribes();
    onAfterAction?.();
  };

  const openQueue = (f: FeedResItem) => {
    store.setFeed(f);
    navigate(
      `${RouteConfig.LOCAL_FEED.replace(/:uuid/, f.uuid)}?feedUuid=${f.uuid}&feedUrl=${encodeURIComponent(f.feed_url)}&type=${f.item_type}`,
    );
  };

  const sync = (f: FeedResItem) => {
    store
      .syncArticles(f)
      .then(() => {
        busChannel.emit("getChannels");
        store.getSubscribes();
      })
      .finally(() => onAfterAction?.());
  };

  const markAllRead = (f: FeedResItem) => {
    dataAgent.markAllRead({ uuid: f.uuid }).then(() => {
      busChannel.emit("getChannels");
      refresh();
    });
  };

  const move = (f: FeedResItem, folderUuid: string) => {
    dataAgent
      .moveChannelIntoFolder(f.uuid, folderUuid, f.sort ?? 0)
      .then(() => {
        toast.success(t("settings.subscriptions.moved"));
        busChannel.emit("getChannels");
        refresh();
      })
      .catch((error) =>
        showErrorToast(error, t("settings.subscriptions.move_failed")),
      );
  };

  const openHome = (f: FeedResItem) => {
    if (f.link) openExternal(f.link);
  };

  const copyUrl = (f: FeedResItem) => {
    if (!f.feed_url) return;
    copyText(f.feed_url).then(() =>
      toast.message(t("Current URL copied to clipboard")),
    );
  };

  const isFolder = feed.item_type === "folder";
  const folders = (store.subscribes || []).filter(
    (i) => i.item_type === "folder",
  );

  let items: ContextMenuOption[];

  if (isFolder) {
    items = [
      {
        id: "sync",
        label: t("feeds.ctx.sync"),
        icon: <RefreshCw size={13} />,
        onClick: () => sync(feed),
      },
      {
        id: "read",
        label: t("feeds.ctx.mark_all_read"),
        icon: <CheckCheck size={13} />,
        onClick: () => markAllRead(feed),
      },
    ];
    if (onEditFolder && onDeleteFolder) {
      items.push(
        { type: "divider" },
        {
          id: "edit",
          label: t("Edit folder"),
          icon: <Pencil size={13} />,
          onClick: () => onEditFolder(feed),
        },
        {
          id: "delete",
          label: t("Delete folder"),
          icon: <Trash2 size={13} />,
          variant: "destructive",
          onClick: () => onDeleteFolder(feed),
        },
      );
    } else {
      items.push(
        { type: "divider" },
        {
          id: "manage",
          label: t("fusion.queue.manage"),
          icon: <Settings size={13} />,
          onClick: () =>
            navigate(`${RouteConfig.SETTINGS}?tab=subscriptions`),
        },
      );
    }
  } else {
    items = [
      {
        id: "open",
        label: t("feeds.ctx.view_articles"),
        icon: <BookOpen size={13} />,
        onClick: () => openQueue(feed),
      },
      {
        id: "sync",
        label: t("feeds.ctx.sync"),
        icon: <RefreshCw size={13} />,
        onClick: () => sync(feed),
      },
      {
        id: "read",
        label: t("feeds.ctx.mark_all_read"),
        icon: <CheckCheck size={13} />,
        onClick: () => markAllRead(feed),
      },
      {
        id: "move",
        label: t("feeds.ctx.move_to_folder"),
        icon: <FolderInput size={13} />,
        items: [
          {
            id: "ungrouped",
            label: t("settings.subscriptions.ungrouped"),
            onClick: () => move(feed, ""),
          },
          ...folders.map((folder) => ({
            id: folder.uuid,
            label: folder.title,
            onClick: () => move(feed, folder.uuid),
          })),
        ],
      },
      { type: "divider" },
      {
        id: "home",
        label: t("Open home page"),
        icon: <ExternalLink size={13} />,
        onClick: () => openHome(feed),
      },
      {
        id: "copy",
        label: t("Copy feed URL"),
        icon: <Clipboard size={13} />,
        onClick: () => copyUrl(feed),
      },
      { type: "divider" },
      {
        id: "unsubscribe",
        label: t("Unsubscribe"),
        icon: <Trash2 size={13} />,
        variant: "destructive",
        onClick: () =>
          onUnsubscribe
            ? onUnsubscribe(feed)
            : navigate(`${RouteConfig.SETTINGS}?tab=subscriptions`),
      },
    ];
  }

  return (
    <ContextMenu items={items} size="sm" menuWidth={200}>
      {children}
    </ContextMenu>
  );
}
