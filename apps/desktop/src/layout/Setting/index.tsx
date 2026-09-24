import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { enable as enableAutostart, disable as disableAutostart } from "@tauri-apps/plugin-autostart";
import { useHotkeys } from "react-hotkeys-hook";
import * as dataAgent from "@/helpers/dataAgent";
import { showErrorToast } from "@/helpers/errorHandler";
import { busChannel } from "@/helpers/busChannel";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { RouteConfig } from "@/config";
import { Subscriptions } from "./Subscriptions";
import { ACCENTS, applyAccent } from "@/helpers/accent";

const INTERVALS = [
  { value: 0, labelKey: "Manual" },
  { value: 1, labelKey: "1 hour" },
  { value: 6, labelKey: "6 hours" },
  { value: 12, labelKey: "12 hours" },
  { value: 24, labelKey: "24 hours" },
];

function SRow({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fusion-srow">
      <div className="min-w-0">
        <div className="lb">{label}</div>
        {help && <div className="hp">{help}</div>}
      </div>
      <div className="ctl">{children}</div>
    </div>
  );
}

function Seg<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="fusion-seg">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className={value === o.value ? "on" : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** 设置第三视图：面板内校准台，左锚点导航 + 三段一页（settings.html 契约） */
export function SettingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const search = useLocation().search;
  const isSubscriptions =
    new URLSearchParams(search).get("tab") === "subscriptions";

  const store = useBearStore(
    useShallow((state) => ({
      userConfig: state.userConfig,
      updateUserConfig: state.updateUserConfig,
      syncAllArticles: state.syncAllArticles,
      subscribes: state.subscribes,
    })),
  );
  const cfg = store.userConfig;

  const [activeSec, setActiveSec] = useState("appearance");
  const bodyRef = useRef<HTMLDivElement>(null);

  // esc 一路退回未读列表
  useHotkeys("escape", () => {
    if (useBearStore.getState().playerMode === "full") return; // 沉浸页优先收回条
    if (!isSubscriptions) navigate(RouteConfig.LOCAL_ALL);
  });

  const scrollTo = (id: string) => {
    setActiveSec(id);
    bodyRef.current
      ?.querySelector(`#${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // 滚动侦测反向点亮锚点导航；末段在触底时兜底选中（settings.html 契约）
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const sections = ["appearance", "sync", "system"];
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const box = el.getBoundingClientRect();
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
        const current = sections
          .map((id) => el.querySelector(`#${id}`) as HTMLElement | null)
          .filter((n): n is HTMLElement => !!n)
          .reduce<string | null>((acc, node) => {
            return node.getBoundingClientRect().top - box.top <= 72 ? node.id : acc;
          }, null);
        setActiveSec(atBottom ? sections[sections.length - 1] : current ?? sections[0]);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // 校准台参数写入令牌
  useEffect(() => {
    const size = cfg?.customize_style?.font_size ?? 15.5;
    const lh = cfg?.customize_style?.line_height ?? 2;
    document.documentElement.style.setProperty("--read-size", `${size}px`);
    document.documentElement.style.setProperty("--read-lh", String(lh));
  }, [cfg?.customize_style?.font_size, cfg?.customize_style?.line_height]);

  if (isSubscriptions) {
    return <Subscriptions />;
  }

  const applyScheme = (v: string) => {
    store.updateUserConfig({ ...cfg, color_scheme: v });
    const mode =
      v === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : v;
    document.body.classList.toggle("dark-theme", mode === "dark");
  };

  const updateStyle = (patch: Partial<CustomizeStyle>) => {
    store.updateUserConfig({
      ...cfg,
      customize_style: {
        typeface: "serif",
        font_size: 15.5,
        line_height: 2,
        line_width: 640,
        ...cfg?.customize_style,
        ...patch,
      },
    });
  };

  const handleExport = async () => {
    try {
      const opml = await dataAgent.exportOpml();
      const filePath = await saveDialog({
        defaultPath: "lettura.opml",
        filters: [{ name: "OPML", extensions: ["opml"] }],
      });
      if (filePath) {
        await writeTextFile(filePath, opml);
        toast.success(t("Export completed"));
      }
    } catch (error) {
      showErrorToast(error, t("Failed to export OPML file"));
    }
  };

  const handleImport = async () => {
    const selected = await openDialog({
      multiple: false,
      filters: [{ name: "OPML", extensions: ["opml", "xml"] }],
    });
    if (selected && typeof selected === "string") {
      try {
        const content = await readTextFile(selected);
        const result = await dataAgent.importOpml(content);
        busChannel.emit("getChannels");
        if (result.feed_count > 0) {
          toast.success(
            t("Successfully imported {count} feeds", { count: result.feed_count }),
          );
        }
      } catch (error) {
        showErrorToast(error, t("Failed to import OPML file"));
      }
    }
  };

  const navItems = [
    { id: "appearance", label: t("settings.sec.appearance") },
    { id: "sync", label: t("settings.sec.sync") },
    { id: "system", label: t("settings.sec.system") },
  ];

  const previewRow = (title: string, src: string, read: boolean, badge: { link: string; feed_url: string }) => (
    <div className="prow">
      <span className="fusion-st">
        <span
          className="fusion-dot"
          style={read ? { background: "#CFD1D3" } : undefined}
        />
      </span>
      <span className={`fusion-thumb ${badge.link ? "pod" : ""}`} />
      <span
        className="fusion-title"
        style={read ? { color: "var(--fusion-ter)", fontWeight: 400 } : undefined}
      >
        {title}
      </span>
      <span className="fusion-src">
        <span className="fn">{src}</span>
      </span>
      <span />
    </div>
  );

  return (
    <div className="fusion-set">
      <div className="fusion-dtop">
        <button
          type="button"
          className="fusion-back"
          onClick={() => navigate(RouteConfig.LOCAL_ALL)}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M10 3 5 8l5 5" />
          </svg>
          {t("article.view.back")}
          <kbd className="fusion-kbd">esc</kbd>
        </button>
        <span className="d-src">{t("settings.dsrc")}</span>
        <span className="fusion-spring" />
        <span style={{ fontSize: 11, color: "var(--fusion-ter)" }}>
          {t("settings.instant")}
        </span>
      </div>

      <div className="fusion-set-shell">
        <nav className="fusion-set-nav">
          {navItems.map((n) => (
            <button
              key={n.id}
              type="button"
              className={`fusion-snav ${activeSec === n.id ? "on" : ""}`}
              onClick={() => scrollTo(n.id)}
            >
              {n.label}
            </button>
          ))}
          <button
            type="button"
            className="fusion-snav"
            style={{ marginTop: 10 }}
            onClick={() => navigate(`${RouteConfig.SETTINGS}?tab=subscriptions`)}
          >
            {t("settings.tab.subscriptions_title")}
            <svg
              width="11"
              height="11"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              style={{ marginLeft: "auto", color: "var(--fusion-ter)", flex: "none" }}
            >
              <path d="m6 3 5 5-5 5" />
            </svg>
          </button>
        </nav>

        <div className="fusion-set-body" ref={bodyRef}>
          <div className="fusion-set-inner">
            {/* 外观与阅读 */}
            <div className="fusion-set-h" id="appearance">
              {t("settings.sec.appearance")}
            </div>
            <SRow label={t("Theme mode")} help={t("settings.theme_help")}>
              <Seg
                value={(cfg?.color_scheme ?? "system") as string}
                options={[
                  { value: "light", label: t("Light") },
                  { value: "system", label: t("settings.follow_system") },
                  { value: "dark", label: t("Dark") },
                ]}
                onChange={applyScheme}
              />
            </SRow>
            <SRow label={t("Accent color")} help={t("settings.accent_help")}>
              <div className="fusion-swatches">
                {ACCENTS.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    title={t(`settings.accent.${a.key}`)}
                    aria-label={t(`settings.accent.${a.key}`)}
                    aria-pressed={(cfg?.accent_color ?? "indigo") === a.key}
                    className={`fusion-swatch ${
                      (cfg?.accent_color ?? "indigo") === a.key ? "on" : ""
                    }`}
                    style={{ background: a.hex }}
                    onClick={() => {
                      store.updateUserConfig({ ...cfg, accent_color: a.key });
                      applyAccent(a.key);
                    }}
                  />
                ))}
              </div>
            </SRow>
            <SRow label={t("Font size")} help={t("settings.font_help")}>
              <div className="fusion-sld">
                <input
                  type="range"
                  min={14}
                  max={19}
                  step={0.5}
                  value={cfg?.customize_style?.font_size ?? 15.5}
                  onChange={(e) => updateStyle({ font_size: parseFloat(e.target.value) })}
                />
                <span className="fusion-chip">
                  {(cfg?.customize_style?.font_size ?? 15.5).toFixed(1)}px
                </span>
              </div>
            </SRow>
            <SRow label={t("Line height")} help={t("settings.lh_help")}>
              <div className="fusion-sld">
                <input
                  type="range"
                  min={1.6}
                  max={2.4}
                  step={0.1}
                  value={cfg?.customize_style?.line_height ?? 2}
                  onChange={(e) => updateStyle({ line_height: parseFloat(e.target.value) })}
                />
                <span className="fusion-chip">
                  {(cfg?.customize_style?.line_height ?? 2).toFixed(1)}
                </span>
              </div>
            </SRow>
            <SRow label={t("Card density")} help={t("settings.density_help")}>
              <Seg
                value={(cfg?.card_density ?? "comfortable") as string}
                options={[
                  { value: "comfortable", label: t("Comfortable") },
                  { value: "compact", label: t("Compact") },
                ]}
                onChange={(v) => {
                  store.updateUserConfig({ ...cfg, card_density: v });
                  document.documentElement.style.setProperty(
                    "--row-h",
                    v === "compact" ? "44px" : "54px",
                  );
                }}
              />
            </SRow>

            {/* 校准台 */}
            <div className="fusion-prev">
              <div className="cap">
                <span>{t("settings.preview")}</span>
                <span className="live">{t("settings.preview_live")}</span>
              </div>
              {previewRow(
                t("settings.prev_row1"),
                "overreacted.io",
                false,
                { link: "", feed_url: "" },
              )}
              {previewRow(
                t("settings.prev_row2"),
                "内核恐慌",
                true,
                { link: "https://www.example.com/ep.mp3?x=1", feed_url: "https://example.com/feed.xml" },
              )}
              <p className="serif">{t("settings.prev_serif")}</p>
            </div>

            {/* 同步与来源 */}
            <div className="fusion-set-h" id="sync">
              {t("settings.sec.sync")}
            </div>
            <SRow label={t("Update Interval")} help={t("set the update interval")}>
              <select
                className="fusion-sel"
                value={String(cfg?.update_interval ?? 0)}
                onChange={(e) =>
                  store.updateUserConfig({
                    ...cfg,
                    update_interval: parseInt(e.target.value, 10),
                  })
                }
              >
                {INTERVALS.map((i) => (
                  <option key={i.value} value={i.value}>
                    {t(i.labelKey)}
                  </option>
                ))}
              </select>
            </SRow>
            <SRow label={t("Thread")} help={t("set the concurrent number of requests (from 1 to 5)")}>
              <div className="fusion-sld">
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={cfg?.threads ?? 3}
                  onChange={(e) =>
                    store.updateUserConfig({ ...cfg, threads: parseInt(e.target.value, 10) })
                  }
                />
                <span className="fusion-chip">{cfg?.threads ?? 3} / 5</span>
              </div>
            </SRow>
            <SRow label={t("settings.subs_manage")} help={t("settings.subs_manage_help")}>
              <button
                type="button"
                className="fusion-btn-gh"
                onClick={() => navigate(`${RouteConfig.SETTINGS}?tab=subscriptions`)}
              >
                {t("settings.subs_manage_btn")}
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <path d="m6 3 5 5-5 5" />
                </svg>
              </button>
            </SRow>

            {/* 行为与数据 */}
            <div className="fusion-set-h" id="system">
              {t("settings.sec.system")}
            </div>
            <SRow label={t("Launch at Login")} help={t("Start with system, but do not show window")}>
              <button
                type="button"
                className={`fusion-sw ${cfg?.launch_at_login ? "on" : ""}`}
                aria-label={t("Launch at Login")}
                onClick={async () => {
                  const val = !cfg?.launch_at_login;
                  store.updateUserConfig({ ...cfg, launch_at_login: val });
                  try {
                    if (val) {
                      await enableAutostart();
                    } else {
                      await disableAutostart();
                    }
                  } catch (error) {
                    showErrorToast(error, "autostart");
                  }
                }}
              />
            </SRow>
            <SRow label={t("Background Sync")} help={t("Continue syncing via tray after window is closed")}>
              <button
                type="button"
                className={`fusion-sw ${cfg?.background_sync !== false ? "on" : ""}`}
                aria-label={t("Background Sync")}
                onClick={() =>
                  store.updateUserConfig({ ...cfg, background_sync: !cfg?.background_sync })
                }
              />
            </SRow>
            <SRow label={t("Notifications")} help={t("Only notify on high-signal changes")}>
              <Seg
                value={(cfg?.notification_enabled ? "high" : "off") as string}
                options={[
                  { value: "off", label: t("Off") },
                  { value: "high", label: t("High-signal only") },
                ]}
                onChange={(v) =>
                  store.updateUserConfig({ ...cfg, notification_enabled: v === "high" })
                }
              />
            </SRow>
            <SRow label={t("Language")} help={t("settings.lang_help")}>
              <select
                className="fusion-sel"
                value={i18n.language?.startsWith("zh") ? "zh" : "en"}
                onChange={(e) => {
                  i18n.changeLanguage(e.target.value);
                  window.localStorage.setItem("lang", e.target.value);
                }}
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </SRow>
            <SRow label={t("Data Retention")} help={t("Read articles and analysis metadata")}>
              <select
                className="fusion-sel"
                value={String(cfg?.purge_on_days ?? 90)}
                onChange={(e) =>
                  store.updateUserConfig({ ...cfg, purge_on_days: parseInt(e.target.value, 10) })
                }
              >
                <option value="30">30 {t("days")}</option>
                <option value="90">90 {t("days")}</option>
                <option value="0">{t("Keep forever")}</option>
              </select>
            </SRow>
            <SRow label={t("OPML")} help={t("settings.opml_help")}>
              <button type="button" className="fusion-btn-gh" onClick={handleExport}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M8 11V2.5M5 5.5 8 2.5l3 3M3 11v2.5h10V11" />
                </svg>
                {t("Export")}
              </button>
              <button type="button" className="fusion-btn-gh" onClick={handleImport}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M8 2.5V11M5 8l3 3 3-3M3 11v2.5h10V11" />
                </svg>
                {t("Import")}
              </button>
            </SRow>
          </div>
        </div>
      </div>
    </div>
  );
}
