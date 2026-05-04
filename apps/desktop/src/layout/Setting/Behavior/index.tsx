import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { Select, Switch } from "@radix-ui/themes";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import { toast } from "sonner";
import * as dataAgent from "@/helpers/dataAgent";
import { useBearStore } from "@/stores";

export const Behavior = () => {
  const { t, i18n } = useTranslation();
  const store = useBearStore((state) => ({
    userConfig: state.userConfig,
    updateUserConfig: state.updateUserConfig,
  }));

  const cfg = store.userConfig;

  const [lang, setLang] = useState(i18n.language || navigator.language);
  const [launchAtLogin, setLaunchAtLogin] = useState(cfg.launch_at_login);
  const [backgroundSync, setBackgroundSync] = useState(cfg.background_sync);
  const [notifications, setNotifications] = useState(cfg.notification_level);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    cfg.notification_enabled,
  );
  const [cacheRetention, setCacheRetention] = useState(
    String(cfg.cache_retention_days),
  );
  const [dataRetention, setDataRetention] = useState(
    cfg.data_retention_days === 0 ? "forever" : String(cfg.data_retention_days),
  );

  const langs: { [key: string]: { nativeName: string } } = useMemo(() => {
    return {
      en: { nativeName: "English" },
      zh: { nativeName: "中文" },
    };
  }, []);

  const purgeOptions = useMemo(
    () => [
      { value: 0, label: i18next.t("Never") },
      { value: 1, label: i18next.t("today") },
      { value: 7, label: i18next.t("one week") },
      { value: 14, label: i18next.t("two weeks") },
      { value: 30, label: i18next.t("a month") },
      { value: 180, label: i18next.t("six month") },
      { value: 360, label: i18next.t("one year") },
    ],
    [lang],
  );

  const handleLaunchAtLogin = async (val: boolean) => {
    try {
      if (val) {
        await enable();
      } else {
        await disable();
      }
      setLaunchAtLogin(val);
      store.updateUserConfig({ ...cfg, launch_at_login: val });
    } catch {
      const current = await isEnabled().catch(() => false);
      setLaunchAtLogin(current);
      toast.error(t("Failed to toggle launch at login"));
    }
  };

  const handleBackgroundSync = (val: boolean) => {
    setBackgroundSync(val);
    store.updateUserConfig({ ...cfg, background_sync: val });
  };

  const handleNotificationLevel = (v: string) => {
    setNotifications(v);
    store.updateUserConfig({ ...cfg, notification_level: v });
  };

  const handleNotificationEnabled = (val: boolean) => {
    setNotificationsEnabled(val);
    store.updateUserConfig({ ...cfg, notification_enabled: val });
  };

  const handleCacheRetention = (v: string) => {
    setCacheRetention(v);
    store.updateUserConfig({ ...cfg, cache_retention_days: parseInt(v, 10) });
  };

  const handleDataRetention = (v: string) => {
    setDataRetention(v);
    store.updateUserConfig({
      ...cfg,
      data_retention_days: v === "forever" ? 0 : parseInt(v, 10),
    });
  };

  return (
    <div className="settings-grid-wide">
      <div className="settings-panel">
        <div className="settings-panel-header">
          <div>
            <div className="settings-panel-title">{t("Behavior")}</div>
            <div className="settings-panel-desc">
              {t("Control Lettura behavior in background, notifications and local data.")}
            </div>
          </div>
        </div>
        <div className="settings-section">
          <div className="settings-row">
            <div>
              <div className="settings-label">{t("Launch at Login")}</div>
              <div className="settings-help">{t("Start with system, but do not show window")}</div>
            </div>
            <div />
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--gray-9)]">
                {launchAtLogin ? t("Enabled") : t("Currently off")}
              </span>
              <Switch
                checked={launchAtLogin}
                onCheckedChange={handleLaunchAtLogin}
              />
            </div>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-label">{t("Background Sync")}</div>
              <div className="settings-help">{t("Continue syncing via tray after window is closed")}</div>
            </div>
            <div />
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--gray-9)]">
                {backgroundSync ? t("Every 30 minutes") : t("Currently off")}
              </span>
              <Switch
                checked={backgroundSync}
                onCheckedChange={handleBackgroundSync}
              />
            </div>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-label">{t("Notifications")}</div>
              <div className="settings-help">{t("Only notify on high-signal changes")}</div>
            </div>
            <div className="flex items-center gap-2">
              <Select.Root
                value={notifications}
                onValueChange={handleNotificationLevel}
              >
                <Select.Trigger className="settings-select" />
                <Select.Content>
                  <Select.Item value="off">{t("Off")}</Select.Item>
                  <Select.Item value="high-signal">{t("High-signal only")}</Select.Item>
                </Select.Content>
              </Select.Root>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleNotificationEnabled}
            />
          </div>
        </div>
        <div className="settings-section">
          <div className="settings-row">
            <div>
              <div className="settings-label">{t("Cache Retention")}</div>
              <div className="settings-help">{t("Images, parsed results and temp content")}</div>
            </div>
            <div className="flex items-center gap-2">
              <Select.Root
                value={cacheRetention}
                onValueChange={handleCacheRetention}
              >
                <Select.Trigger className="settings-select" />
                <Select.Content>
                  <Select.Item value="7">{t("7 days")}</Select.Item>
                  <Select.Item value="30">{t("30 days")}</Select.Item>
                  <Select.Item value="90">{t("90 days")}</Select.Item>
                </Select.Content>
              </Select.Root>
            </div>
            <button
              className="btn-ghost"
              onClick={() => toast.success(t("Cache cleaned"))}
            >
              {t("Clean")}
            </button>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-label">{t("Data Retention")}</div>
              <div className="settings-help">{t("Read articles and analysis metadata")}</div>
            </div>
            <div className="flex items-center gap-2">
              <Select.Root
                value={dataRetention}
                onValueChange={handleDataRetention}
              >
                <Select.Trigger className="settings-select" />
                <Select.Content>
                  <Select.Item value="90">{t("90 days")}</Select.Item>
                  <Select.Item value="forever">{t("Keep forever")}</Select.Item>
                </Select.Content>
              </Select.Root>
            </div>
            <button
              className="btn-ghost"
              onClick={async () => {
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
                } catch (e) {
                  toast.error(String(e));
                }
              }}
            >
              {t("Export")}
            </button>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-label">{t("Purge articles older than")}</div>
              <div className="settings-help">{t("save your disk")}</div>
            </div>
            <div className="flex items-center gap-2">
              <Select.Root
                value={store.userConfig.purge_on_days?.toString()}
                onValueChange={(v: string) =>
                  store.updateUserConfig({
                    ...cfg,
                    purge_on_days: parseInt(v, 10),
                  })
                }
              >
                <Select.Trigger className="settings-select" />
                <Select.Content>
                  {purgeOptions.map((opt) => (
                    <Select.Item key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </div>
            <Switch
              checked={store.userConfig.purge_unread_articles}
              onCheckedChange={(val: boolean) => {
                store.updateUserConfig({
                  ...cfg,
                  purge_unread_articles: val,
                });
              }}
            />
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-label">{t("Language")}</div>
              <div className="settings-help">{t("Interface language")}</div>
            </div>
            <div className="flex items-center gap-2">
              <Select.Root
                value={lang}
                onValueChange={(v: string) => {
                  i18n.changeLanguage(v);
                  window.localStorage.setItem("lang", v);
                  setLang(v);
                }}
              >
                <Select.Trigger className="settings-select" />
                <Select.Content>
                  {Object.keys(langs).map((key: string) => (
                    <Select.Item key={key} value={key}>
                      {langs[key].nativeName}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </div>
            <div />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="settings-panel">
          <div className="settings-panel-header">
            <div>
              <div className="settings-panel-title">{t("Local Storage")}</div>
              <div className="settings-panel-desc">
                {t("Let users know where data is stored")}
              </div>
            </div>
          </div>
          <div className="settings-section">
            <div className="settings-pack-row">
              <div>
                <div className="settings-label">SQLite {t("Database")}</div>
                <div className="settings-help">~/.lettura/lettura.db</div>
              </div>
              <span className="settings-tag settings-tag--green">{t("Normal")}</span>
            </div>
            <div className="settings-pack-row">
              <div>
                <div className="settings-label">{t("User Config")}</div>
                <div className="settings-help">~/.lettura/lettura.toml</div>
              </div>
              <span className="settings-tag settings-tag--green">{t("Normal")}</span>
            </div>
            <div className="settings-pack-row">
              <div>
                <div className="settings-label">Podcast {t("Cache")}</div>
                <div className="settings-help">IndexedDB / Browser storage</div>
              </div>
              <span className="settings-tag settings-tag--blue">{t("Independent")}</span>
            </div>
          </div>
        </div>
        <div className="settings-panel">
          <div className="settings-section">
            <div className="settings-label">{t("Exit Behavior")}</div>
            <div className="settings-help" style={{ marginTop: 8 }}>
              {t("Closing the main window hides to system tray; truly exit via tray menu to avoid interrupting background sync.")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
