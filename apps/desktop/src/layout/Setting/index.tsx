import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Kbd } from "@astryxdesign/core/Kbd";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@astryxdesign/core/SegmentedControl";
import { Selector } from "@astryxdesign/core/Selector";
import { Slider } from "@astryxdesign/core/Slider";
import { Switch } from "@astryxdesign/core/Switch";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { invoke } from "@tauri-apps/api/core";
import {
  disable as disableAutostart,
  enable as enableAutostart,
} from "@tauri-apps/plugin-autostart";
import {
  open as openDialog,
  save as saveDialog,
} from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { thumbMonogram } from "@/components/ArticleItem";
import { EMAIL_SUBSCRIPTION_ENABLED, RouteConfig } from "@/config";
import type { SourceAccount } from "@/db";
import { busChannel } from "@/helpers/busChannel";
import { showErrorToast } from "@/helpers/errorHandler";
import { lastNavFrom } from "@/helpers/navHistory";
import { toast } from "@/helpers/toast";
import { HK } from "@/shortcuts";
import { useAppStore } from "@/stores";
import { ASTRYX_THEMES } from "@/themes";
import { SubscriptionsSection } from "./Subscriptions";

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

/** 设置第三视图：面板内校准台，左锚点导航 + 三段一页（settings.html 契约） */
export function SettingPage() {
  const { t, i18n } = useTranslation();
  // 文本类设置用草稿 + 失焦提交（其余控件即改即写；逐字符写 TOML 太重）
  const [routesDraft, setRoutesDraft] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const locationKey = location.pathname + location.search;
  const tabParam = new URLSearchParams(location.search).get("tab");

  const store = useAppStore(
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
  // 自绘锚点滚动动画的句柄（scrollIntoView smooth 在 WebKit 由主线程驱动且
  // 时长随距离增长，长页面上一卡一卡；固定时长 + easeOutCubic 手感稳定）
  const scrollAnim = useRef(0);

  // ── 来源账户（后端命令直连；失败静默为空列表）──
  const [accounts, setAccounts] = useState<SourceAccount[]>([]);
  // 添加邮箱账户对话框
  const [accDialogOpen, setAccDialogOpen] = useState(false);
  const [accProvider, setAccProvider] = useState<"mail" | "bilibili">("mail");
  const [accForm, setAccForm] = useState({
    host: "",
    port: "993",
    user: "",
    password: "",
    sessdata: "",
    label: "",
  });
  const [accTesting, setAccTesting] = useState(false);
  const [accSaving, setAccSaving] = useState(false);
  // 行内测试 / 删除确认
  const [testingUuid, setTestingUuid] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SourceAccount | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAccounts = () => {
    invoke<SourceAccount[]>("list_source_accounts")
      .then((list) => setAccounts(list || []))
      .catch(() => setAccounts([]));
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // 账户按 provider 分组展示：已知类型排前，未知类型兜底在后（新 provider 即插即用）
  const accountGroups = (() => {
    const groups = new Map<string, SourceAccount[]>();
    for (const account of accounts) {
      const list = groups.get(account.provider) ?? [];
      list.push(account);
      groups.set(account.provider, list);
    }
    const rank = (provider: string) => {
      const known = ["mail", "bilibili"];
      const index = known.indexOf(provider);
      return index === -1 ? known.length : index;
    };
    return [...groups.entries()].sort((a, b) => rank(a[0]) - rank(b[0]));
  })();

  // esc / 左上返回：回到进入设置前的页面（无足迹如启动直达时落回未读列表）
  const backTo = lastNavFrom(locationKey) ?? RouteConfig.LOCAL_ALL;
  useHotkeys(HK.escape, () => {
    if (document.body.classList.contains("fusion-context-menu-open")) return;
    if (useAppStore.getState().playerMode === "full") return; // 沉浸页优先收回条
    navigate(backTo);
  }, [backTo]);

  // 左锚点导航滚动：固定 320ms easeOutCubic；scrollIntoView smooth 交给浏览器
  // 的时长不可控（WebKit 主线程驱动、随距离变长），页面变高后点击明显发顿
  const scrollTo = (id: string) => {
    const el = bodyRef.current;
    if (!el) return;
    const node = el.querySelector(`#${id}`);
    if (!node) return;
    setActiveSec(id);
    cancelAnimationFrame(scrollAnim.current);
    const gap = parseFloat(getComputedStyle(node).scrollMarginTop) || 0;
    const from = el.scrollTop;
    const to =
      from +
      node.getBoundingClientRect().top -
      el.getBoundingClientRect().top -
      gap;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      Math.abs(to - from) < 2
    ) {
      el.scrollTop = to;
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / 320, 1);
      el.scrollTop = from + (to - from) * (1 - (1 - p) ** 3);
      if (p < 1) scrollAnim.current = requestAnimationFrame(step);
    };
    scrollAnim.current = requestAnimationFrame(step);
  };

  // 深链 ?tab=xxx（源队列 / 右键菜单的「管理订阅」入口）：进入后滚到对应区块
  useEffect(() => {
    if (tabParam) scrollTo(tabParam);
  }, [tabParam, scrollTo]);

  // 滚动侦测反向点亮锚点导航；末段在触底时兜底选中（settings.html 契约）。
  // 区块节点挂载时缓存一次——每帧 6 次 querySelector 在内联订阅区块后已能感知
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const sections = [
      "appearance",
      "sync",
      "sources",
      "system",
      "subscriptions",
    ];
    const nodes = sections
      .map((id) => el.querySelector(`#${id}`) as HTMLElement | null)
      .filter((n): n is HTMLElement => !!n);
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const box = el.getBoundingClientRect();
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
        const current = nodes.reduce<string | null>((acc, node) => {
          return node.getBoundingClientRect().top - box.top <= 72
            ? node.id
            : acc;
        }, null);
        setActiveSec(
          atBottom ? sections[sections.length - 1] : (current ?? sections[0]),
        );
      });
    };
    const stopAnim = () => cancelAnimationFrame(scrollAnim.current);
    el.addEventListener("scroll", onScroll, { passive: true });
    // 用户手动滚动时终止锚点动画，避免与滚轮抢滚动位置
    el.addEventListener("wheel", stopAnim, { passive: true });
    return () => {
      cancelAnimationFrame(scrollAnim.current);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", stopAnim);
    };
  }, []);

  // 校准台参数写入令牌
  useEffect(() => {
    const size = cfg?.customize_style?.font_size ?? 15.5;
    const lh = cfg?.customize_style?.line_height ?? 2;
    document.documentElement.style.setProperty("--read-size", `${size}px`);
    document.documentElement.style.setProperty("--read-lh", String(lh));
  }, [cfg?.customize_style?.font_size, cfg?.customize_style?.line_height]);

  // 列表密度令牌跟随配置（配置是唯一事实源；校准台预览行同吃这个令牌）。
  // App.tsx 只在首次拉取配置时写一次，这里的响应式写入是唯一随切换更新的通道
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--row-h",
      (cfg?.card_density ?? "comfortable") === "compact" ? "44px" : "52px",
    );
  }, [cfg?.card_density]);

  const applyScheme = (v: string) => {
    // body.dark-theme 与 Astryx mode 均由 App 从 userConfig.color_scheme 派生
    store.updateUserConfig({ ...cfg, color_scheme: v });
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
      const opml = await invoke<string>("export_opml");
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
        const result = await invoke<{ feed_count: number }>("import_opml", {
          opmlContent: content,
        });
        busChannel.emit("getChannels");
        if (result.feed_count > 0) {
          toast.success(
            t("Successfully imported {count} feeds", {
              count: result.feed_count,
            }),
          );
        }
      } catch (error) {
        showErrorToast(error, t("Failed to import OPML file"));
      }
    }
  };

  // ── 来源账户 ─────────────────────────────────────────────
  const providerLabel = (provider: string) => {
    if (provider === "mail") return t("settings.source_accounts.provider_mail");
    if (provider === "bilibili")
      return t("settings.source_accounts.provider_bilibili");
    return provider;
  };

  const testRowAccount = async (account: SourceAccount) => {
    setTestingUuid(account.uuid);
    // promise.catch 表达成败分支（编译器 1.0 不支持 try/catch 语句）
    await (async () => {
      const message = await invoke<string>("test_source_account", {
        provider: account.provider,
        settings: account.settings,
      });
      toast.success(message || t("settings.source_accounts.test_ok"));
    })().catch((error) => {
      showErrorToast(error, t("settings.source_accounts.test_fail"));
    });
    setTestingUuid(null);
  };

  const confirmDeleteAccount = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await (async () => {
      await invoke("delete_source_account", { uuid: deleteTarget.uuid });
      toast.success(t("settings.source_accounts.deleted"));
      setDeleteTarget(null);
      loadAccounts();
    })().catch((error) => {
      showErrorToast(error, t("settings.source_accounts.delete_fail"));
    });
    setDeleting(false);
  };

  const openAddAccount = (
    provider: "mail" | "bilibili" = EMAIL_SUBSCRIPTION_ENABLED
      ? "mail"
      : "bilibili",
  ) => {
    setAccProvider(provider);
    setAccForm({
      host: "",
      port: "993",
      user: "",
      password: "",
      sessdata: "",
      label: "",
    });
    setAccDialogOpen(true);
  };

  const accountSettingsJson = () =>
    accProvider === "bilibili"
      ? JSON.stringify({ sessdata: accForm.sessdata.trim() })
      : JSON.stringify({
          host: accForm.host.trim(),
          port: parseInt(accForm.port, 10) || 993,
          user: accForm.user.trim(),
          password: accForm.password,
        });

  const accFormReady =
    accProvider === "bilibili"
      ? accForm.sessdata.trim() !== ""
      : accForm.host.trim() !== "" &&
        accForm.user.trim() !== "" &&
        accForm.password !== "";

  const testNewAccount = async () => {
    setAccTesting(true);
    await (async () => {
      const message = await invoke<string>("test_source_account", {
        provider: accProvider,
        settings: accountSettingsJson(),
      });
      toast.success(message || t("settings.source_accounts.test_ok"));
    })().catch((error) => {
      showErrorToast(error, t("settings.source_accounts.test_fail"));
    });
    setAccTesting(false);
  };

  const saveNewAccount = async () => {
    if (!accFormReady) return;
    setAccSaving(true);
    await (async () => {
      // 名称默认取 host（邮箱）或固定名（B站），用户没填时
      await invoke("save_source_account", {
        provider: accProvider,
        label:
          accForm.label.trim() ||
          (accProvider === "mail"
            ? accForm.host.trim()
            : t("settings.source_accounts.provider_bilibili")),
        settings: accountSettingsJson(),
      });
      toast.success(t("settings.source_accounts.saved"));
      setAccDialogOpen(false);
      loadAccounts();
    })().catch((error) => {
      showErrorToast(error, t("settings.source_accounts.save_fail"));
    });
    setAccSaving(false);
  };

  const navItems = [
    { id: "appearance", label: t("settings.sec.appearance") },
    { id: "sync", label: t("settings.sec.sync") },
    { id: "sources", label: t("settings.sec.sources") },
    { id: "system", label: t("settings.sec.system") },
    // 内容长度随订阅数变化，放末尾让固定区块的锚点位置稳定
    { id: "subscriptions", label: t("settings.tab.subscriptions_title") },
  ];

  const previewRow = (
    title: string,
    src: string,
    read: boolean,
    badge: { link: string; feed_url: string },
  ) => (
    <div className={`prow ${read ? "is-read" : ""}`}>
      <span className="fusion-st">
        <span className="fusion-dot" />
      </span>
      <span className={`fusion-thumb ${badge.link ? "pod" : ""}`}>
        {!badge.link && <span className="tch">{thumbMonogram(src)}</span>}
      </span>
      <span className="fusion-title">{title}</span>
      <span className="fusion-src">
        <span className="fn">{src}</span>
      </span>
    </div>
  );

  return (
    <div className="fusion-set">
      <div className="fusion-dtop">
        <Button
          variant="ghost"
          size="sm"
          icon={<ChevronLeft size={12} />}
          label={t("article.view.back")}
          endContent={<Kbd keys="esc" />}
          onClick={() => navigate(backTo)}
        />
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
              aria-current={activeSec === n.id ? "true" : undefined}
              onClick={() => scrollTo(n.id)}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="fusion-set-body fusion-inset-tail" ref={bodyRef}>
          <div className="fusion-set-inner">
            {/* 外观与阅读 */}
            <div className="fusion-set-h" id="appearance">
              {t("settings.sec.appearance")}
            </div>
            <SRow label={t("Theme mode")} help={t("settings.theme_help")}>
              <SegmentedControl
                size="sm"
                label={t("Theme mode")}
                value={(cfg?.color_scheme ?? "system") as string}
                onChange={applyScheme}
              >
                <SegmentedControlItem value="light" label={t("Light")} />
                <SegmentedControlItem
                  value="system"
                  label={t("settings.follow_system")}
                />
                <SegmentedControlItem value="dark" label={t("Dark")} />
              </SegmentedControl>
            </SRow>
            <SRow
              label={t("settings.astryx_theme")}
              help={t("settings.astryx_theme_help")}
            >
              <Selector
                label={t("settings.astryx_theme")}
                isLabelHidden
                size="sm"
                value={cfg?.astryx_theme ?? "neutral"}
                options={ASTRYX_THEMES.map((t) => ({
                  value: t.value,
                  label: t.label,
                }))}
                onChange={(v) =>
                  store.updateUserConfig({
                    ...cfg,
                    astryx_theme: v,
                  })
                }
              />
            </SRow>
            <SRow label={t("Font size")} help={t("settings.font_help")}>
              <div className="fusion-sld">
                <Slider
                  label={t("Font size")}
                  isLabelHidden
                  min={14}
                  max={19}
                  step={0.5}
                  value={cfg?.customize_style?.font_size ?? 15.5}
                  valueDisplay="none"
                  width={140}
                  onChange={(v: number) => updateStyle({ font_size: v })}
                />
                <span className="fusion-chip">
                  {(cfg?.customize_style?.font_size ?? 15.5).toFixed(1)}px
                </span>
              </div>
            </SRow>
            <SRow label={t("Line height")} help={t("settings.lh_help")}>
              <div className="fusion-sld">
                <Slider
                  label={t("Line height")}
                  isLabelHidden
                  min={1.6}
                  max={2.4}
                  step={0.1}
                  value={cfg?.customize_style?.line_height ?? 2}
                  valueDisplay="none"
                  width={140}
                  onChange={(v: number) => updateStyle({ line_height: v })}
                />
                <span className="fusion-chip">
                  {(cfg?.customize_style?.line_height ?? 2).toFixed(1)}
                </span>
              </div>
            </SRow>
            <SRow label={t("Card density")} help={t("settings.density_help")}>
              <SegmentedControl
                size="sm"
                label={t("Card density")}
                value={(cfg?.card_density ?? "comfortable") as string}
                onChange={(v) =>
                  store.updateUserConfig({ ...cfg, card_density: v })
                }
              >
                <SegmentedControlItem
                  value="comfortable"
                  label={t("Comfortable")}
                />
                <SegmentedControlItem value="compact" label={t("Compact")} />
              </SegmentedControl>
            </SRow>

            {/* 校准台 */}
            <div className="fusion-prev">
              <div className="cap">
                <span>{t("settings.preview")}</span>
                <span className="live">{t("settings.preview_live")}</span>
              </div>
              {previewRow(t("settings.prev_row1"), "overreacted.io", false, {
                link: "",
                feed_url: "",
              })}
              {previewRow(t("settings.prev_row2"), "内核恐慌", true, {
                link: "https://www.example.com/ep.mp3?x=1",
                feed_url: "https://example.com/feed.xml",
              })}
              <p className="serif">{t("settings.prev_serif")}</p>
            </div>

            {/* 同步与来源 */}
            <div className="fusion-set-h" id="sync">
              {t("settings.sec.sync")}
            </div>
            <SRow
              label={t("Update Interval")}
              help={t("set the update interval")}
            >
              <Selector
                label={t("Update Interval")}
                isLabelHidden
                size="sm"
                value={String(cfg?.update_interval ?? 0)}
                options={INTERVALS.map((i) => ({
                  value: String(i.value),
                  label: t(i.labelKey),
                }))}
                onChange={(v) =>
                  store.updateUserConfig({
                    ...cfg,
                    update_interval: parseInt(v, 10),
                  })
                }
              />
            </SRow>
            <SRow
              label={t("Thread")}
              help={t("set the concurrent number of requests (from 1 to 5)")}
            >
              <div className="fusion-sld">
                <Slider
                  label={t("Thread")}
                  isLabelHidden
                  min={1}
                  max={5}
                  step={1}
                  value={cfg?.threads ?? 3}
                  valueDisplay="none"
                  width={140}
                  onChange={(v: number) =>
                    store.updateUserConfig({ ...cfg, threads: v })
                  }
                />
                <span className="fusion-chip">{cfg?.threads ?? 3} / 5</span>
              </div>
            </SRow>
            <SRow
              label={t("settings.generator_routes")}
              help={t("settings.generator_routes_help")}
            >
              <TextArea
                label={t("settings.generator_routes")}
                isLabelHidden
                value={routesDraft ?? (cfg?.generator_routes ?? []).join("\n")}
                onChange={(v) => setRoutesDraft(v)}
                onBlur={() => {
                  if (routesDraft === null) return;
                  store.updateUserConfig({
                    ...cfg,
                    generator_routes: routesDraft
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean),
                  });
                  setRoutesDraft(null);
                }}
              />
            </SRow>
            <SRow
              label={t("settings.subs_manage")}
              help={t("settings.subs_manage_help")}
            >
              <Button
                variant="ghost"
                size="sm"
                label={t("settings.subs_manage_btn")}
                endContent={<ChevronRight size={11} />}
                onClick={() => scrollTo("subscriptions")}
              />
            </SRow>

            {/* 来源账户 */}
            <div className="fusion-set-h" id="sources">
              {t("settings.sec.sources")}
            </div>
            <SRow
              label={t("settings.source_accounts.title")}
              help={t("settings.source_accounts.help")}
            >
              <Button
                variant="ghost"
                size="sm"
                icon={<Plus size={12} />}
                label={t("settings.source_accounts.add_account")}
                onClick={() => openAddAccount()}
              />
            </SRow>
            {accountGroups.map(([provider, list]) => (
              <div key={provider}>
                <div className="fusion-acct-h">
                  {providerLabel(provider)}
                  <span className="n">
                    {t("settings.source_accounts.count", {
                      count: list.length,
                    })}
                  </span>
                </div>
                {list.map((account) => (
                  <div className="fusion-srow" key={account.uuid}>
                    <div className="min-w-0">
                      <div
                        className="lb"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                        }}
                      >
                        <span
                          className="fusion-dot"
                          style={
                            account.status !== "ok"
                              ? { background: "var(--color-error)" }
                              : undefined
                          }
                        />
                        {account.label}
                      </div>
                      {account.status !== "ok" && (
                        <div className="hp">
                          {t("settings.source_accounts.status_abnormal", {
                            status: account.status,
                          })}
                        </div>
                      )}
                    </div>
                    <div className="ctl">
                      <Button
                        variant="ghost"
                        size="sm"
                        label={t("settings.source_accounts.test")}
                        isLoading={testingUuid === account.uuid}
                        onClick={() => testRowAccount(account)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={12} />}
                        label={t("settings.source_accounts.delete")}
                        onClick={() => setDeleteTarget(account)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* 行为与数据 */}
            <div className="fusion-set-h" id="system">
              {t("settings.sec.system")}
            </div>
            <SRow
              label={t("Launch at Login")}
              help={t("Start with system, but do not show window")}
            >
              <Switch
                size="sm"
                isLabelHidden
                label={t("Launch at Login")}
                value={!!cfg?.launch_at_login}
                onChange={async (val) => {
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
            <SRow
              label={t("Background Sync")}
              help={t("Continue syncing via tray after window is closed")}
            >
              <Switch
                size="sm"
                isLabelHidden
                label={t("Background Sync")}
                value={cfg?.background_sync !== false}
                onChange={(val) =>
                  store.updateUserConfig({ ...cfg, background_sync: val })
                }
              />
            </SRow>
            <SRow label={t("Language")} help={t("settings.lang_help")}>
              <Selector
                label={t("Language")}
                isLabelHidden
                size="sm"
                value={i18n.language?.startsWith("zh") ? "zh" : "en"}
                options={[
                  { value: "zh", label: "中文" },
                  { value: "en", label: "English" },
                ]}
                onChange={(v) => {
                  i18n.changeLanguage(v);
                  window.localStorage.setItem("lang", v);
                }}
              />
            </SRow>
            <SRow
              label={t("Data Retention")}
              help={t("Read articles and analysis metadata")}
            >
              <Selector
                label={t("Data Retention")}
                isLabelHidden
                size="sm"
                value={String(cfg?.purge_on_days ?? 90)}
                options={[
                  { value: "30", label: `30 ${t("days")}` },
                  { value: "90", label: `90 ${t("days")}` },
                  { value: "0", label: t("Keep forever") },
                ]}
                onChange={(v) =>
                  store.updateUserConfig({
                    ...cfg,
                    purge_on_days: parseInt(v, 10),
                  })
                }
              />
            </SRow>
            <SRow label={t("OPML")} help={t("settings.opml_help")}>
              <Button
                variant="ghost"
                size="sm"
                icon={<Upload size={12} />}
                label={t("Export")}
                onClick={handleExport}
              />
              <Button
                variant="ghost"
                size="sm"
                icon={<Download size={12} />}
                label={t("Import")}
                onClick={handleImport}
              />
            </SRow>

            {/* 订阅管理（内联区块：内容随订阅数变化，置于末尾同层滚动展示） */}
            <div className="fusion-set-h" id="subscriptions">
              {t("settings.tab.subscriptions_title")}
            </div>
            <SubscriptionsSection />
          </div>
        </div>
      </div>

      {/* 添加来源账户：类型切换 + 先测试连接，再落库 */}
      <Dialog
        isOpen={accDialogOpen}
        onOpenChange={setAccDialogOpen}
        width={420}
      >
        <Layout
          header={
            <DialogHeader
              title={
                accProvider === "mail"
                  ? t("settings.source_accounts.add_mail")
                  : t("settings.source_accounts.add_bilibili")
              }
            />
          }
          content={
            <LayoutContent isScrollable={false}>
              <div className="flex flex-col gap-3 py-2">
                {EMAIL_SUBSCRIPTION_ENABLED && (
                  <RadioList
                    label={t("settings.source_accounts.mode")}
                    isLabelHidden
                    value={accProvider}
                    onChange={(v) => setAccProvider(v as "mail" | "bilibili")}
                  >
                    <RadioListItem
                      value="mail"
                      label={t("settings.source_accounts.provider_mail")}
                      description={t(
                        "settings.source_accounts.provider_mail_desc",
                      )}
                    />
                    <RadioListItem
                      value="bilibili"
                      label={t("settings.source_accounts.provider_bilibili")}
                      description={t(
                        "settings.source_accounts.provider_bilibili_desc",
                      )}
                    />
                  </RadioList>
                )}
                {accProvider === "mail" ? (
                  <>
                    <TextInput
                      label={t("settings.source_accounts.fld_host")}
                      placeholder="imap.example.com"
                      value={accForm.host}
                      onChange={(v) => setAccForm((f) => ({ ...f, host: v }))}
                    />
                    <TextInput
                      label={t("settings.source_accounts.fld_port")}
                      value={accForm.port}
                      onChange={(v) =>
                        setAccForm((f) => ({
                          ...f,
                          port: v.replace(/\D/g, ""),
                        }))
                      }
                    />
                    <TextInput
                      label={t("settings.source_accounts.fld_user")}
                      autoComplete="off"
                      value={accForm.user}
                      onChange={(v) => setAccForm((f) => ({ ...f, user: v }))}
                    />
                    <TextInput
                      label={t("settings.source_accounts.fld_password")}
                      type="password"
                      autoComplete="new-password"
                      value={accForm.password}
                      onChange={(v) =>
                        setAccForm((f) => ({ ...f, password: v }))
                      }
                    />
                  </>
                ) : (
                  <TextInput
                    label={t("settings.source_accounts.fld_sessdata")}
                    type="password"
                    autoComplete="new-password"
                    description={t(
                      "settings.source_accounts.fld_sessdata_help",
                    )}
                    value={accForm.sessdata}
                    onChange={(v) => setAccForm((f) => ({ ...f, sessdata: v }))}
                  />
                )}
                <TextInput
                  label={t("settings.source_accounts.fld_label")}
                  description={
                    accProvider === "mail"
                      ? t("settings.source_accounts.fld_label_help")
                      : undefined
                  }
                  placeholder={
                    accProvider === "mail"
                      ? accForm.host
                      : t("settings.source_accounts.provider_bilibili")
                  }
                  value={accForm.label}
                  onChange={(v) => setAccForm((f) => ({ ...f, label: v }))}
                />
                <div className="flex justify-end gap-3 pt-1">
                  <Button
                    variant="secondary"
                    label={t("settings.source_accounts.test")}
                    isLoading={accTesting}
                    isDisabled={!accFormReady}
                    onClick={testNewAccount}
                  />
                  <Button
                    variant="primary"
                    label={t("Save")}
                    isLoading={accSaving}
                    isDisabled={!accFormReady}
                    onClick={saveNewAccount}
                  />
                </div>
              </div>
            </LayoutContent>
          }
        />
      </Dialog>

      {/* 删除账户确认（引用它的订阅会置回无账户，不删订阅） */}
      <Dialog
        isOpen={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        width={400}
      >
        <DialogHeader
          title={t("settings.source_accounts.delete_confirm_title")}
        />
        <div className="flex flex-col gap-4 py-2">
          <span style={{ fontSize: 13, color: "var(--fusion-ter)" }}>
            {t("settings.source_accounts.delete_confirm", {
              label: deleteTarget?.label ?? "",
            })}
          </span>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              label={t("Cancel")}
              onClick={() => setDeleteTarget(null)}
            />
            <Button
              variant="destructive"
              label={t("settings.source_accounts.delete")}
              isLoading={deleting}
              onClick={confirmDeleteAccount}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
