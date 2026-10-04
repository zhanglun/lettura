import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { IconButton } from "@astryxdesign/core/IconButton";
import { TextInput } from "@astryxdesign/core/TextInput";
import { open as openExternal } from "@tauri-apps/plugin-shell";
import clsx from "clsx";
import {
  CheckCheck,
  ChevronDown,
  Clipboard,
  ExternalLink,
  Folder as FolderIcon,
  FolderInput,
  Pencil,
  RefreshCw,
  Rss,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { FeedIcon } from "@/components/FeedIcon";
import type { FeedResItem } from "@/db";
import { busChannel } from "@/helpers/busChannel";
import { copyText } from "@/helpers/copyText";
import { showErrorToast } from "@/helpers/errorHandler";
import { formatFeedTime, getHostLabel } from "@/helpers/feedMeta";
import { apiPost } from "@/helpers/http";
import { getFeedCarrier, originRoute } from "@/helpers/mediaType";
import { toast } from "@/helpers/toast";
import { DialogUnsubscribeFeed } from "@/layout/Setting/Content/DialogUnsubscribeFeed";
import { useAppStore } from "@/stores";

/** 收起态会话级记住：浏览多个源时不用反复收起 */
let profileCollapsed = false;

/** 源描述可能带 HTML：读纯文本，避免渲染远程标记 */
function plainText(html?: string): string {
  const div = document.createElement("div");
  div.innerHTML = html ?? "";
  return (div.textContent ?? "").replace(/\s+/g, " ").trim();
}

/**
 * 订阅详情的源头卡（feeds.html 契约扩展）：源标识 + 简介/来源 + 统计健康 + 动作，
 * 可收起为单行。材质只用发丝线与现有 token，不引入新容器类型。
 */
export function FeedProfile({
  feed,
  total,
  syncing,
  onSync,
  onMarkAllRead,
  onUnsubscribed,
}: {
  feed: FeedResItem;
  total: number;
  syncing: boolean;
  onSync: () => void;
  onMarkAllRead: () => void;
  /** 取消订阅成功后的善后（详情页跳回订阅列表） */
  onUnsubscribed: () => void;
}) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(profileCollapsed);
  const [descOpen, setDescOpen] = useState(false);
  const [unsubDialog, setUnsubDialog] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const folders = useAppStore(
    useShallow((s) =>
      (s.subscribes || []).filter((i) => i.item_type === "folder"),
    ),
  );

  const move = (folderUuid: string) => {
    apiPost("/update-feed-sort", [
      {
        item_type: feed.item_type,
        uuid: feed.uuid,
        folder_uuid: folderUuid,
        sort: feed.sort ?? 0,
      },
    ])
      .then(() => {
        toast.success(t("settings.subscriptions.moved"));
        busChannel.emit("getChannels");
      })
      .catch((error) =>
        showErrorToast(error, t("settings.subscriptions.move_failed")),
      );
  };

  const toggle = () => {
    const next = !collapsed;
    profileCollapsed = next;
    setCollapsed(next);
  };

  const description = plainText(feed.description);
  const host = getHostLabel(feed);
  const unread = feed.unread ?? 0;
  const broken = (feed.health_status ?? 0) > 0;
  const route = originRoute(feed.origin);
  const carrier = getFeedCarrier(feed);
  const lastSync = formatFeedTime(feed.last_sync_date);
  const subscribed = formatFeedTime(feed.create_date as unknown as string);

  const rename = () => {
    const title = renameValue.trim();
    if (!title || title === feed.title) {
      setRenameOpen(false);
      return;
    }
    apiPost("/api/rename-feed", { uuid: feed.uuid, title })
      .then(() => {
        busChannel.emit("getChannels");
        setRenameOpen(false);
      })
      .catch((error) => showErrorToast(error, t("Ops! Something wrong~")));
  };

  const actionBtn = (
    key: string,
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    danger = false,
  ) => (
    <Button
      key={key}
      variant="ghost"
      size="sm"
      icon={icon}
      label={label}
      onClick={onClick}
      isDisabled={key === "sync" && syncing}
      className={clsx(danger && "is-danger")}
    />
  );

  return (
    <section className={clsx("fusion-fp", collapsed && "is-collapsed")}>
      {collapsed ? (
        /* 收起态：单行，只留核心标识 + 展开钮 */
        <div className="fusion-fp-bar">
          <FeedIcon feed={feed} />
          <span className="fusion-fp-name">{feed.title}</span>
          <span className="fusion-fp-host">{host}</span>
          <span className={clsx("fusion-fp-pill", broken && "is-bad")}>
            {broken
              ? t("fusion.profile.health_broken")
              : t("fusion.profile.health_ok")}
          </span>
          <span className="fusion-fp-bar-unread">
            {t("fusion.profile.unread_count", { count: unread })}
          </span>
          <IconButton
            size="sm"
            variant="ghost"
            icon={<ChevronDown size={13} />}
            label={t("fusion.profile.expand")}
            onClick={toggle}
          />
        </div>
      ) : (
        <div className="fusion-fp-body">
          <div className="fusion-fp-head">
            <span className="fusion-fp-logo">
              <FeedIcon feed={feed} />
            </span>
            <div className="fusion-fp-id">
              <h2 className="fusion-fp-title">{feed.title}</h2>
              <div className="fusion-fp-tags">
                <span className="fusion-fp-tag">
                  <Rss size={10.5} />
                  {host}
                </span>
                {route ? (
                  <span className="fusion-fp-tag">
                    {t("fusion.profile.via", {
                      route: route.charAt(0).toUpperCase() + route.slice(1),
                    })}
                  </span>
                ) : (
                  <span className="fusion-fp-tag">
                    {t(
                      `fusion.filter.${carrier === "email" ? "email" : carrier === "audio" ? "podcast" : carrier === "video" ? "video" : "article"}`,
                    )}
                  </span>
                )}
                {feed.folder_name && (
                  <span className="fusion-fp-tag">
                    <FolderIcon size={10.5} />
                    {feed.folder_name}
                  </span>
                )}
                {subscribed && (
                  <span className="fusion-fp-tag is-soft">
                    {t("fusion.profile.subscribed", { time: subscribed })}
                  </span>
                )}
              </div>
            </div>
            <IconButton
              size="sm"
              variant="ghost"
              icon={<ChevronDown size={14} />}
              label={t("fusion.profile.collapse")}
              onClick={toggle}
            />
          </div>

          {description && (
            <p className={clsx("fusion-fp-desc", descOpen && "is-open")}>
              {description}
              {description.length > 140 && (
                <Button
                  variant="ghost"
                  size="sm"
                  label={
                    descOpen
                      ? t("fusion.profile.desc_less")
                      : t("fusion.profile.desc_more")
                  }
                  onClick={() => setDescOpen((v) => !v)}
                />
              )}
            </p>
          )}

          <div className="fusion-fp-stats">
            <span className="fusion-fp-stat">
              <b>{total}</b>
              <i>{t("fusion.profile.stat_articles")}</i>
            </span>
            <span className="fusion-fp-stat">
              <b className={unread > 0 ? "is-accent" : ""}>{unread}</b>
              <i>{t("fusion.profile.stat_unread")}</i>
            </span>
            <span className="fusion-fp-stat">
              <b>{lastSync || "—"}</b>
              <i>{t("fusion.profile.stat_sync")}</i>
            </span>
            <span className={clsx("fusion-fp-stat", broken && "is-broken")}>
              <b>
                {broken
                  ? t("fusion.profile.health_broken")
                  : t("fusion.profile.health_ok")}
              </b>
              <i>{t("fusion.profile.stat_health")}</i>
            </span>
          </div>
          {broken && feed.failure_reason && (
            <p className="fusion-fp-reason">{feed.failure_reason}</p>
          )}

          <div className="fusion-fp-actions">
            {actionBtn(
              "home",
              <ExternalLink size={12.5} />,
              t("fusion.profile.open_home"),
              () => feed.link && openExternal(feed.link),
            )}
            {actionBtn(
              "copy",
              <Clipboard size={12.5} />,
              t("fusion.profile.copy_url"),
              () =>
                copyText(feed.feed_url).then(() =>
                  toast.message(t("Current URL copied to clipboard")),
                ),
            )}
            {actionBtn(
              "sync",
              <RefreshCw
                size={12.5}
                className={syncing ? "animate-spin" : ""}
              />,
              t("fusion.profile.sync_now"),
              onSync,
            )}
            {actionBtn(
              "read",
              <CheckCheck size={12.5} />,
              t("fusion.profile.mark_read"),
              onMarkAllRead,
            )}
            <DropdownMenu
              items={[
                {
                  id: "ungrouped",
                  label: t("settings.subscriptions.ungrouped"),
                  onClick: () => move(""),
                },
                ...folders.map((folder) => ({
                  id: folder.uuid,
                  label: folder.title,
                  onClick: () => move(folder.uuid),
                })),
              ]}
              button={{
                variant: "ghost",
                size: "sm",
                icon: <FolderInput size={12.5} />,
                label: t("feeds.ctx.move_to_folder"),
              }}
            />
            {actionBtn(
              "rename",
              <Pencil size={12.5} />,
              t("fusion.profile.rename"),
              () => {
                setRenameValue(feed.title);
                setRenameOpen(true);
              },
            )}
            {actionBtn(
              "unsubscribe",
              <Trash2 size={12.5} />,
              t("Unsubscribe"),
              () => setUnsubDialog(true),
              true,
            )}
          </div>
        </div>
      )}

      <DialogUnsubscribeFeed
        feed={feed}
        dialogStatus={unsubDialog}
        setDialogStatus={setUnsubDialog}
        afterConfirm={onUnsubscribed}
        afterCancel={() => setUnsubDialog(false)}
      />

      <Dialog isOpen={renameOpen} onOpenChange={setRenameOpen} width={420}>
        <DialogHeader title={t("fusion.profile.rename")} />
        <div className="flex flex-col gap-4 pt-2">
          <TextInput
            label={t("fusion.profile.rename")}
            isLabelHidden
            size="sm"
            value={renameValue}
            onChange={setRenameValue}
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              label={t("Cancel")}
              onClick={() => setRenameOpen(false)}
            />
            <Button
              variant="primary"
              label={t("Save")}
              onClick={rename}
              isDisabled={!renameValue.trim()}
            />
          </div>
        </div>
      </Dialog>
    </section>
  );
}
