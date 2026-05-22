import { useMemo, useRef, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import i18next from "i18next";
import { Select } from "@radix-ui/themes";
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

export const Sources = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const addFeedTriggerRef = useRef<HTMLSpanElement>(null);

  const store = useBearStore(
    useShallow((state) => ({
      userConfig: state.userConfig,
      updateUserConfig: state.updateUserConfig,
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
    })),
  );

  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [addFolderDialogStatus, setAddFolderDialogStatus] = useState(false);
  const [importing, setImporting] = useState(false);
  const [reqTimeout, setReqTimeout] = useState("30");

  const intervalOptions = useMemo(
    () => [
      { value: 0, label: i18next.t("Manual") },
      { value: 1, label: `1 ${i18next.t("hour")}` },
      { value: 6, label: `6 ${i18next.t("hours")}` },
      { value: 12, label: `12 ${i18next.t("hours")}` },
      { value: 24, label: `24 ${i18next.t("hours")}` },
    ],
    [t],
  );

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

  const folderItems = useMemo(() => filteredItems.filter((i) => i.item_type === "folder"), [filteredItems]);
  const ungroupedFeeds = useMemo(() => filteredItems.filter((i) => i.item_type !== "folder"), [filteredItems]);

  const allFeeds = store.subscribes.filter((f) => f.item_type === "channel");
  const brokenFeeds = allFeeds.filter((f) => f.health_status === 1);
  const healthyFeeds = allFeeds.filter((f) => f.health_status !== 1);
  const threads = store.userConfig.threads ?? 3;
  const healthyRate = allFeeds.length > 0 ? Math.round((healthyFeeds.length / allFeeds.length) * 100) : 100;

  const handleToggleFolder = useCallback((uuid: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      next.has(uuid) ? next.delete(uuid) : next.add(uuid);
      return next;
    });
  }, []);

  const handleFeedClick = useCallback(
    (f: FeedResItem) => navigate(`${RouteConfig.LOCAL_FEEDS}/${f.uuid}`),
    [navigate],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, f: FeedResItem) => {
      e.preventDefault();
      store.setFeedContextMenuTarget(f);
      store.setContextMenuPosition({ x: e.clientX, y: e.clientY });
    },
    [store],
  );

  const handleFeedSync = useCallback(
    (f: FeedResItem) => store.syncArticles(f).then(() => store.getSubscribes()),
    [store],
  );

  const handleFeedDelete = useCallback(
    (f: FeedResItem) => dataAgent.deleteChannel(f.uuid).then(() => store.getSubscribes()),
    [store],
  );

  const handleFeedMarkAllRead = useCallback(
    (f: FeedResItem) => dataAgent.markAllRead({ uuid: f.uuid }).then(() => store.getSubscribes()),
    [store],
  );

  const handleMarkAllRead = useCallback(
    () => dataAgent.markAllRead({ isAll: true }).then(() => store.getSubscribes()),
    [store],
  );

  const handleCloseContextMenu = useCallback(() => {
    store.setContextMenuPosition(null);
    store.setFeedContextMenuTarget(null);
  }, [store]);

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
    <div className="flex flex-col gap-4">
      {/* Feed list management */}
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
        <div className="max-h-[420px] overflow-y-auto">
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
      </div>

      {/* Health overview + Sync settings */}
      <div className="grid grid-cols-[1fr_260px] gap-4 items-start">
        {/* Sync settings */}
        <div className="settings-panel">
          <div className="settings-section">
            <div className="settings-row">
              <div>
                <div className="settings-label">{t("settings.sources.sync_frequency")}</div>
              </div>
              <Select.Root
                value={store.userConfig.update_interval?.toString()}
                onValueChange={(v: string) => {
                  store.updateUserConfig({ ...store.userConfig, update_interval: parseInt(v, 10) });
                }}
              >
                <Select.Trigger className="settings-select" />
                <Select.Content>
                  <Select.Group>
                    {intervalOptions.map((opt) => (
                      <Select.Item key={opt.value} value={opt.value.toString()}>{opt.label}</Select.Item>
                    ))}
                  </Select.Group>
                </Select.Content>
              </Select.Root>
              <div />
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-label">{t("settings.sources.concurrent_requests")}</div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range" min={1} max={5} value={threads}
                  onChange={(e) => store.updateUserConfig({ ...store.userConfig, threads: parseInt(e.target.value) })}
                  className="settings-slider-input flex-1"
                />
                <span className="settings-tag settings-tag--blue">{threads} / 5</span>
              </div>
              <div />
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-label">{t("settings.sources.request_timeout")}</div>
              </div>
              <Select.Root value={reqTimeout} onValueChange={setReqTimeout}>
                <Select.Trigger className="settings-select" />
                <Select.Content>
                  <Select.Group>
                    <Select.Item value="15">15s</Select.Item>
                    <Select.Item value="30">30s</Select.Item>
                    <Select.Item value="60">60s</Select.Item>
                  </Select.Group>
                </Select.Content>
              </Select.Root>
              <button className="btn-ghost" onClick={() => setReqTimeout("30")}>{t("settings.sources.reset")}</button>
            </div>
          </div>
        </div>

        {/* Health KPIs */}
        <div className="settings-panel">
          <div className="settings-section">
            <div className="settings-label mb-3">{t("settings.sources.input_quality")}</div>
            <div className="settings-kpi">
              <div className="card">
                <div className="settings-kpi-value">{allFeeds.length}</div>
                <div className="settings-kpi-label">{t("settings.sources.kpi_active_sources")}</div>
              </div>
              <div className="card">
                <div className="settings-kpi-value">{healthyRate}%</div>
                <div className="settings-kpi-label">{t("settings.sources.kpi_sync_rate")}</div>
              </div>
              <div className="card">
                <div className="settings-kpi-value">{brokenFeeds.length}</div>
                <div className="settings-kpi-label">{t("settings.sources.kpi_needs_check")}</div>
              </div>
            </div>
          </div>
          {brokenFeeds.length > 0 && (
            <div className="settings-section">
              <div className="settings-label mb-2">{t("settings.sources.broken_advice_title")}</div>
              {brokenFeeds.slice(0, 3).map((feed) => (
                <div key={feed.uuid} className="flex items-center justify-between gap-2 py-1.5 text-xs border-b border-[var(--gray-a5)] last:border-0">
                  <span className="truncate text-[var(--gray-12)] flex-1">{feed.title}</span>
                  <button
                    className="btn-ghost text-[11px] py-0.5"
                    onClick={async () => {
                      await dataAgent.syncFeed("channel", feed.uuid);
                      busChannel.emit("getChannels");
                    }}
                  >
                    {t("settings.sources.action_retry")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Starter packs */}
      <div className="settings-panel">
        <div className="settings-section">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="settings-label">{t("settings.sources.packs_title")}</div>
              <div className="settings-help">{t("settings.sources.packs_help")}</div>
            </div>
            <button className="btn-ghost">{t("settings.sources.browse_packs")}</button>
          </div>
          <div className="settings-choice-grid">
            <div className="settings-choice active">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--gray-12)]">AI Starter Pack</span>
                <span className="settings-tag settings-tag--green">{t("settings.sources.tag_installed")}</span>
              </div>
              <div className="settings-help mt-1">GPT, Claude, Gemini, HN, Lobsters</div>
            </div>
            <div className="settings-choice">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--gray-12)]">Developer Pack</span>
                <span className="settings-tag settings-tag--amber">{t("settings.sources.tag_needs_maintenance")}</span>
              </div>
              <div className="settings-help mt-1">GitHub Trending, DevTo, CSS-Tricks</div>
            </div>
            <div className="settings-choice">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--gray-12)]">Product Pack</span>
                <span className="settings-tag settings-tag--blue">{t("settings.sources.tag_installable")}</span>
              </div>
              <div className="settings-help mt-1">IndieHackers, ProductHunt, TLDR</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
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
