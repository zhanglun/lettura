import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { Select } from "@radix-ui/themes";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";

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

  const allFeeds = store.subscribes.filter((f) => f.item_type === "channel");
  const brokenFeeds = allFeeds.filter((f) => f.health_status === 1);
  const healthyFeeds = allFeeds.filter((f) => f.health_status !== 1);
  const threads = store.userConfig.threads ?? 3;
  const healthyRate = allFeeds.length > 0 ? Math.round((healthyFeeds.length / allFeeds.length) * 100) : 100;

  return (
    <div className="flex flex-col gap-4">
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
    </div>
  );
};
