import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { Select } from "@radix-ui/themes";
import { useBearStore } from "@/stores";
import * as dataAgent from "@/helpers/dataAgent";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-dialog";
import { busChannel } from "@/helpers/busChannel";
import { toast } from "sonner";
import { showErrorToast } from "@/helpers/errorHandler";

export const Sources = () => {
  const { t } = useTranslation();
  const store = useBearStore((state) => ({
    userConfig: state.userConfig,
    updateUserConfig: state.updateUserConfig,
    subscribes: state.subscribes,
    syncAllArticles: state.syncAllArticles,
  }));

  const [importing, setImporting] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
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

  const allFeeds = store.subscribes.filter(
    (f) => f.item_type === "channel",
  );
  const brokenFeeds = allFeeds.filter((f) => f.health_status === 1);
  const healthyFeeds = allFeeds.filter((f) => f.health_status !== 1);

  const threads = store.userConfig.threads ?? 3;
  const healthyRate =
    allFeeds.length > 0
      ? Math.round((healthyFeeds.length / allFeeds.length) * 100)
      : 100;

  const handleImportOPML = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: "OPML", extensions: ["opml", "xml"] }],
    });

    if (selected && typeof selected === "string") {
      setImporting(true);
      try {
        const opmlContent = await readTextFile(selected);
        const result = await dataAgent.importOpml(opmlContent);

        busChannel.emit("getChannels");

        if (result.feed_count > 0) {
          toast.success(
            t("Successfully imported {count} feeds", {
              count: result.feed_count,
            }),
          );
        }

        if (result.folder_count > 0) {
          toast.success(
            t("Successfully created {count} folders", {
              count: result.folder_count,
            }),
          );
        }

        if (result.failed_count > 0) {
          toast.warning(
            t("Failed to import {count} feeds", {
              count: result.failed_count,
            }),
          );
        }
      } catch (error) {
        showErrorToast(error, t("Failed to import OPML file"));
      } finally {
        setImporting(false);
      }
    }
  };

  return (
    <div className="settings-grid-wide">
      <div className="settings-panel">
        <div className="settings-panel-header">
          <div>
            <div className="settings-panel-title">
              {t("settings.sources.sources_title")}
            </div>
            <div className="settings-panel-desc">
              {t("settings.sources.sources_desc")}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost" onClick={handleImportOPML} disabled={importing}>
              {importing ? t("Importing...") : t("Import OPML")}
            </button>
            <button
              className="btn-primary"
              disabled={syncingAll}
              onClick={async () => {
                setSyncingAll(true);
                try {
                  await store.syncAllArticles();
                } finally {
                  setSyncingAll(false);
                }
              }}
            >
              {syncingAll ? t("Syncing...") : t("Sync All")}
            </button>
          </div>
        </div>

        <div className="settings-section">
          <div className="flex items-center justify-between mb-2">
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

        <div className="settings-section">
          <div className="settings-label mb-1">{t("settings.sources.health_title")}</div>
          <div className="settings-health-row" style={{ fontSize: "11px", color: "var(--gray-9)", textTransform: "uppercase" }}>
            <span>{t("settings.sources.col_source")}</span>
            <span>{t("settings.sources.col_health")}</span>
            <span>{t("settings.sources.col_last_sync")}</span>
            <span></span>
          </div>
          {brokenFeeds.slice(0, 5).map((feed) => (
            <div key={feed.uuid} className="settings-health-row">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="truncate text-[var(--gray-12)]">{feed.title}</span>
                <span className="settings-help truncate">{feed.failure_reason?.slice(0, 40)}</span>
              </div>
              <span className="settings-tag settings-tag--amber">{t("settings.sources.health_broken")}</span>
              <span className="text-[var(--gray-9)]">—</span>
               <button className="btn-ghost" onClick={async () => {
                  await dataAgent.syncFeed("channel", feed.uuid);
                  busChannel.emit("getChannels");
                }}>{t("settings.sources.action_retry")}</button>
            </div>
          ))}
          {healthyFeeds.slice(0, 3).map((feed) => (
            <div key={feed.uuid} className="settings-health-row">
              <span className="truncate text-[var(--gray-12)]">{feed.title}</span>
              <span className="settings-tag settings-tag--green">{t("settings.sources.health_ok")}</span>
              <span className="text-[var(--gray-9)]">{feed.last_sync_date ?? "—"}</span>
              <button className="btn-ghost" onClick={async () => {
                await dataAgent.syncFeed("channel", feed.uuid);
                busChannel.emit("getChannels");
              }}>{t("settings.sources.action_sync")}</button>
            </div>
          ))}
        </div>

        <div className="settings-section">
          <div className="settings-row">
            <div>
              <div className="settings-label">{t("settings.sources.sync_frequency")}</div>
            </div>
            <Select.Root
              value={store.userConfig.update_interval?.toString()}
              onValueChange={(v: string) => {
                store.updateUserConfig({
                  ...store.userConfig,
                  update_interval: parseInt(v, 10),
                });
              }}
            >
              <Select.Trigger className="settings-select" />
              <Select.Content>
                <Select.Group>
                  {intervalOptions.map((opt) => (
                    <Select.Item key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </Select.Item>
                  ))}
                </Select.Group>
              </Select.Content>
            </Select.Root>
            <div></div>
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-label">{t("settings.sources.concurrent_requests")}</div>
            </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={threads}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    store.updateUserConfig({
                      ...store.userConfig,
                      threads: val,
                    });
                  }}
                  className="settings-slider-input flex-1"
                />
                <span className="settings-tag settings-tag--blue">
                  {threads} / 5
                </span>
              </div>
            <div></div>
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-label">{t("settings.sources.request_timeout")}</div>
            </div>
            <Select.Root
              value={reqTimeout}
              onValueChange={(v) => setReqTimeout(v)}
            >
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

      <div className="flex flex-col gap-[14px]">
        <div className="settings-panel">
          <div className="settings-section">
            <div className="settings-label">{t("settings.sources.input_quality")}</div>
            <div className="settings-help mb-3">{t("settings.sources.input_quality_desc")}</div>
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
        </div>

        <div className="settings-panel">
          <div className="settings-section">
            <div className="settings-label">{t("settings.sources.broken_advice_title")}</div>
            <div className="settings-help mt-1">{t("settings.sources.broken_advice_help")}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
