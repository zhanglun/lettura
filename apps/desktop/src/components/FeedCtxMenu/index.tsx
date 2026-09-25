import { useEffect, useState } from "react";
import type React from "react";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
} from "lucide-react";import { RouteConfig } from "@/config";
import { useBearStore } from "@/stores";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import { copyText } from "@/helpers/copyText";
import { showErrorToast } from "@/helpers/errorHandler";
import { open as openExternal } from "@tauri-apps/plugin-shell";
import { DialogUnsubscribeFeed } from "@/layout/Setting/Content/DialogUnsubscribeFeed";
import type { FeedResItem } from "@/db";

export interface FeedCtxMenuProps {
  target: FeedResItem | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  /** 动作完成后的额外回调（默认已刷新订阅列表） */
  onAfterAction?: () => void;
  /** 分组编辑/删除（订阅管理页提供；浏览帧不提供则显示「去管理」入口） */
  onEditFolder?: (folder: FeedResItem) => void;
  onDeleteFolder?: (folder: FeedResItem) => void;
}

/**
 * 源右键菜单（feeds.html / settings.html 契约共用）：
 * 源 = 查看/同步/已读/移动分组（悬停子菜单）/主页/复制/退订；
 * 分组 = 同步/已读 +（管理页：编辑/删除｜浏览帧：去管理页）。退订确认内置。
 */
export function FeedCtxMenu({
  target,
  position,
  onClose,
  onAfterAction,
  onEditFolder,
  onDeleteFolder,
}: FeedCtxMenuProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [unsubscribeOpen, setUnsubscribeOpen] = useState(false);
  const [targetUuid, setTargetUuid] = useState<string | null>(null);

  const store = useBearStore(
    useShallow((state) => ({
      subscribes: state.subscribes,
      getSubscribes: state.getSubscribes,
      syncArticles: state.syncArticles,
      setFeed: state.setFeed,
    })),
  );

  useEffect(() => {
    if (target) setTargetUuid(target.uuid);
  }, [target]);

  // 菜单关闭（target 置空）后退订确认仍需持有目标，用 subscribes 兜底找回
  const dialogFeed =
    target ?? (store.subscribes || []).find((i) => i.uuid === targetUuid) ?? null;

  if (!dialogFeed) return null;

  const showMenu = !!(target && position);
  const isFolder = dialogFeed.item_type === "folder";
  const folders = (store.subscribes || []).filter((i) => i.item_type === "folder");

  const refresh = () => {
    store.getSubscribes();
    onAfterAction?.();
  };

  const openQueue = (f: FeedResItem) => {
    onClose();
    store.setFeed(f);
    navigate(
      `${RouteConfig.LOCAL_FEED.replace(/:uuid/, f.uuid)}?feedUuid=${f.uuid}&feedUrl=${encodeURIComponent(f.feed_url)}&type=${f.item_type}`,
    );
  };

  const sync = (f: FeedResItem) => {
    onClose();
    store
      .syncArticles(f)
      .then(() => {
        busChannel.emit("getChannels");
        store.getSubscribes();
      })
      .finally(() => onAfterAction?.());
  };

  const markAllRead = (f: FeedResItem) => {
    onClose();
    dataAgent.markAllRead({ uuid: f.uuid }).then(() => {
      busChannel.emit("getChannels");
      refresh();
    });
  };

  const move = (f: FeedResItem, folderUuid: string) => {
    onClose();
    dataAgent
      .moveChannelIntoFolder(f.uuid, folderUuid, f.sort ?? 0)
      .then(() => {
        toast.success(t("settings.subscriptions.moved"));
        busChannel.emit("getChannels");
        refresh();
      })
      .catch((error) => showErrorToast(error, t("settings.subscriptions.move_failed")));
  };

  const openHome = (f: FeedResItem) => {
    onClose();
    if (f.link) openExternal(f.link);
  };

  const copyUrl = (f: FeedResItem) => {
    onClose();
    if (!f.feed_url) return;
    copyText(f.feed_url).then(() => toast.message(t("Current URL copied to clipboard")));
  };

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
      }}
    >
      {icon}
      {label}
    </button>
  );

  // 贴边回收：菜单不溢出窗口右缘/下缘
  const left = position ? Math.min(position.x, window.innerWidth - 200) : 0;
  const top = position
    ? Math.min(position.y, window.innerHeight - (isFolder ? 150 : 260))
    : 0;

  const menuTarget = dialogFeed;

  return (
    <>
      {showMenu && (
        <div
          className="fusion-ctx"
          style={{ left, top }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{ position: "fixed", inset: 0, zIndex: -1 }}
            onClick={onClose}
          />
          {isFolder ? (
            <>
              {item("sync", <RefreshCw size={13} />, t("feeds.ctx.sync"), () => sync(menuTarget))}
              {item("read", <CheckCheck size={13} />, t("feeds.ctx.mark_all_read"), () => markAllRead(menuTarget))}
              {onEditFolder && (
                <hr />
              )}
              {onEditFolder &&
                item("edit", <Pencil size={13} />, t("Edit folder"), () => {
                  onEditFolder(menuTarget);
                  onClose();
                })}
              {onDeleteFolder &&
                item("delete", <Trash2 size={13} />, t("Delete folder"), () => {
                  onDeleteFolder(menuTarget);
                  onClose();
                }, true)}
              {!onEditFolder && (
                <>
                  <hr />
                  {item("manage", <Settings size={13} />, t("fusion.queue.manage"), () => {
                    onClose();
                    navigate(`${RouteConfig.SETTINGS}?tab=subscriptions`);
                  })}
                </>
              )}
            </>
          ) : (
            <>
              {item("open", <BookOpen size={13} />, t("feeds.ctx.view_articles"), () => openQueue(menuTarget))}
              {item("sync", <RefreshCw size={13} />, t("feeds.ctx.sync"), () => sync(menuTarget))}
              {item("read", <CheckCheck size={13} />, t("feeds.ctx.mark_all_read"), () => markAllRead(menuTarget))}
              <div className="mi has-sub">
                <FolderInput size={13} />
                {t("feeds.ctx.move_to_folder")}
                <svg
                  className="caret"
                  width="11"
                  height="11"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                >
                  <path d="m6 3 5 5-5 5" />
                </svg>
                <div className="sub" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="mi"
                    onClick={() => move(menuTarget, "")}
                  >
                    {t("settings.subscriptions.ungrouped")}
                  </button>
                  {folders.map((folder) => (
                    <button
                      key={folder.uuid}
                      type="button"
                      className="mi"
                      onClick={() => move(menuTarget, folder.uuid)}
                    >
                      {folder.title}
                    </button>
                  ))}
                </div>
              </div>
              <hr />
              {item("home", <ExternalLink size={13} />, t("Open home page"), () => openHome(menuTarget))}
              {item("copy", <Clipboard size={13} />, t("Copy feed URL"), () => copyUrl(menuTarget))}
              <hr />
              {item(
                "delete",
                <Trash2 size={13} />,
                t("Unsubscribe"),
                () => {
                  onClose();
                  setUnsubscribeOpen(true);
                },
                true,
              )}
            </>
          )}
        </div>
      )}

      <DialogUnsubscribeFeed
        feed={dialogFeed}
        dialogStatus={unsubscribeOpen}
        setDialogStatus={setUnsubscribeOpen}
        afterConfirm={() => {
          refresh();
        }}
        afterCancel={() => {
          setUnsubscribeOpen(false);
        }}
      />
    </>
  );
}
