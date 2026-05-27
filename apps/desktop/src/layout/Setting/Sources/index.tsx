import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { Select } from "@radix-ui/themes";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import { RouteConfig } from "@/config";

export const Sources = () => {
  const { t } = useTranslation();

  const store = useBearStore(
    useShallow((state) => ({
      userConfig: state.userConfig,
      updateUserConfig: state.updateUserConfig,
      subscribes: state.subscribes,
      syncAllArticles: state.syncAllArticles,
    })),
  );

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

  const allFeeds = useMemo(
    () =>
      store.subscribes.flatMap((item) =>
        item.item_type === "folder" ? item.children ?? [] : [item],
      ).filter((f) => f.item_type === "channel"),
    [store.subscribes],
  );
  const brokenFeeds = allFeeds.filter((f) => (f.health_status ?? 0) > 0);
  const healthyFeeds = allFeeds.filter((f) => (f.health_status ?? 0) === 0);
  const recentHealthyFeeds = healthyFeeds.slice(0, 3);
  const threads = store.userConfig.threads ?? 3;
  const healthyRate = allFeeds.length > 0 ? Math.round((healthyFeeds.length / allFeeds.length) * 100) : 100;

  const getSourceHost = (feed: { link?: string; feed_url?: string }) => {
    try {
      return new URL(feed.link || feed.feed_url || "").host;
    } catch {
      return feed.link || feed.feed_url || "";
    }
  };

  const openSubscriptionManagement = () => {
    window.history.pushState({}, "", `${RouteConfig.SETTINGS}?tab=subscriptions`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="settings-sources-layout">
      {/* Health overview + Sync settings */}
      <div className="settings-grid-wide">
        {/* Sync settings */}
        <div className="settings-panel settings-sources-sync-panel">
          <div className="settings-section">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="settings-label">{t("settings.sources.sync_strategy_title")}</div>
                <div className="settings-help">{t("settings.sources.sync_strategy_help")}</div>
              </div>
              <span className="settings-tag settings-tag--blue">{intervalOptions.find((opt) => opt.value === store.userConfig.update_interval)?.label ?? i18next.t("Manual")}</span>
            </div>
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
        <div className="settings-panel settings-sources-health-panel">
          <div className="settings-section">
            <div className="settings-sources-panel-head">
              <div>
                <div className="settings-label mb-1">{t("settings.sources.health_center_title")}</div>
                <div className="settings-help">{t("settings.sources.health_center_help")}</div>
              </div>
              <button className="btn-ghost" type="button" onClick={openSubscriptionManagement}>
                {t("settings.sources.open_subscription_management")}
              </button>
            </div>
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
            <div className="settings-help mt-3">
              {t("settings.sources.health_summary", {
                healthy: healthyFeeds.length,
                broken: brokenFeeds.length,
                unread: allFeeds.reduce((sum, feed) => sum + (feed.unread ?? 0), 0),
              })}
            </div>
          </div>
          {brokenFeeds.length > 0 && (
            <div className="settings-section">
              <div className="settings-label mb-2">{t("settings.sources.broken_queue_title")}</div>
              <div className="settings-mini-list settings-sources-broken-list">
                {brokenFeeds.slice(0, 3).map((feed) => (
                  <div key={feed.uuid} className="settings-mini-row">
                    <div className="min-w-0">
                      <div className="settings-label truncate">{feed.title}</div>
                      <div className="settings-help truncate">
                        {getSourceHost(feed) || t("settings.sources.health_broken")}
                      </div>
                    </div>
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
              <div className="settings-help mt-3">{t("settings.sources.broken_queue_help")}</div>
            </div>
          )}
        </div>
      </div>

      {recentHealthyFeeds.length > 0 && (
        <div className="settings-panel">
          <div className="settings-section">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="settings-label">{t("settings.sources.recent_healthy_title")}</div>
                <div className="settings-help">{t("settings.sources.recent_healthy_help")}</div>
              </div>
            </div>
            <div className="settings-choice-grid">
              {recentHealthyFeeds.map((feed, index) => (
                <div key={feed.uuid} className={index === 0 ? "settings-choice active" : "settings-choice"}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-[var(--gray-12)]">{feed.title}</span>
                    <span className="settings-tag settings-tag--green">{t("settings.sources.health_ok")}</span>
                  </div>
                  <div className="settings-help mt-1 truncate">
                    {getSourceHost(feed)}
                    {feed.last_sync_date ? ` · ${feed.last_sync_date}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Starter packs */}
      <div className="settings-panel settings-sources-packs-panel">
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
    </div>
  );
};
