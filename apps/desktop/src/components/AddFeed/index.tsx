import { useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate } from "react-router-dom";
import * as dataAgent from "@/helpers/dataAgent";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { toast } from "@/helpers/toast";
import { useTranslation } from "react-i18next";
import { showErrorToast } from "@/helpers/errorHandler";
import { FeedResItem } from "@/db";
import { RouteConfig } from "@/config";
import {
  BUILTIN_GENERATORS,
  DEFAULT_RSSHUB_INSTANCE,
  FeedGenerator,
  generateFeedUrl,
  matchGenerator,
  parseUserGenerators,
} from "@/helpers/feedGenerators";
import { CARRIER_BADGE_CLS, Carrier, getFeedCarrier } from "@/helpers/mediaType";

interface PreviewEntry {
  title: string;
  link: string;
  pub_date: string;
  duration: number | null;
}

interface Preview {
  feed: any;
  /** 真正生效的 feed 地址（粘网页时 != 输入） */
  resolvedUrl: string;
  /** 探测试过的候选地址（多个让用户换） */
  candidates: string[];
  entries: PreviewEntry[];
  /** 用了生成器时：落库的来源 generator:<route> 与声明的载体 */
  origin?: string;
  carrierHint?: Carrier;
  /** 生成器文案/路由/实例（可编辑重试） */
  generatorLabel?: string;
  route?: string;
  instance?: string;
}

type Phase =
  | { s: "idle" }
  | { s: "trying" }
  | { s: "error"; message: string; route: string }
  | { s: "preview"; preview: Preview }
  | { s: "subscribing" };

const CARRIER_TAG: Record<Carrier, string> = {
  text: "RSS",
  audio: "播",
  video: "视",
  email: "邮",
};

function flattenFolders(items: FeedResItem[]): FeedResItem[] {
  return (items || []).filter((i) => i.item_type === "folder");
}

function entryMeta(entry: PreviewEntry, formatTime: (s: number) => string, locale: string) {
  if (entry.duration) return formatTime(entry.duration);
  if (!entry.pub_date) return "";
  const date = new Date(entry.pub_date);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(locale, { month: "numeric", day: "numeric" });
}

/**
 * 渐进式订阅面板（add.html 契约，2026-09-25 重梳理）：
 * 一个输入框 → **后端发现优先**（网页里声明的 `<link rel=alternate>`、常见路径）→ 预览卡（源信息 +
 * 最近条目 + 生成地址 + 分组）→ 订阅 → 跳到该订阅的源队列。
 * 平台生成器是**可扩展的数据表**（内置便利匹配 + 设置里的自定义路由 + 面板内手填），不写死清单。
 */
export const AddFeedChannel = (props: any) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const store = useBearStore(
    useShallow((state) => ({
      subscribes: state.subscribes,
      userConfig: state.userConfig,
      initCollectionMetas: state.initCollectionMetas,
      addNewFeed: state.addNewFeed,
      getSubscribes: state.getSubscribes,
    })),
  );

  const isControlled = typeof props.open === "boolean";
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? !!props.open : internalOpen;
  const setOpen = (v: boolean) => {
    props.onOpenChange?.(v);
    if (!isControlled) setInternalOpen(v);
  };

  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>({ s: "idle" });
  const [manualRoute, setManualRoute] = useState("");
  const [folderUuid, setFolderUuid] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  /** 探测请求令牌：慢响应回来时若已被新输入取代，直接丢弃 */
  const probeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRef = useRef(open);
  openRef.current = open;

  const folders = flattenFolders(store.subscribes);
  const instance: string =
    store.userConfig?.rsshub_instance || DEFAULT_RSSHUB_INSTANCE;
  const generators: FeedGenerator[] = useMemo(
    () => parseUserGenerators(store.userConfig?.generator_routes),
    [store.userConfig?.generator_routes],
  );

  useHotkeys("c", () => {
    setOpen(true);
  });

  useEffect(() => {
    if (open) {
      setUrl("");
      setPhase({ s: "idle" });
      setManualRoute("");
      setFolderUuid("");
      setCreatingFolder(false);
      setFolderName("");
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // 选「新建分组…」后才出现输入框：出现即聚焦（与面板输入一致，用 ref 而非 autoFocus）
  useEffect(() => {
    if (!creatingFolder) return;
    setTimeout(() => folderInputRef.current?.focus(), 20);
  }, [creatingFolder]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
      if (e.key === "Enter" && phase.s === "preview") {
        e.preventDefault();
        doSubscribe();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, phase]);

  /** 真正去探测并进入预览（target 可以是用户输入、生成器地址，或候选/手填路由） */
  const previewUrl = (
    feedUrl: string,
    meta: Partial<
      Pick<Preview, "origin" | "carrierHint" | "generatorLabel" | "route" | "instance">
    > = {},
  ) => {
    const token = ++probeRef.current;
    setPhase({ s: "trying" });
    dataAgent
      .fetchFeed(feedUrl, meta.origin, meta.carrierHint)
      .then((res: any) => {
        if (!openRef.current || token !== probeRef.current) return;
        if (!res?.feed) {
          setPhase({
            s: "error",
            message: res?.message || t("fusion.add.err_no_feed"),
            route: meta.route || "",
          });
          return;
        }
        setPhase({
          s: "preview",
          preview: {
            feed: res.feed,
            resolvedUrl: res.resolved_url || feedUrl,
            candidates: res.candidates || [],
            entries: res.entries || [],
            ...meta,
          },
        });
      })
      .catch((error) => {
        if (!openRef.current || token !== probeRef.current) return;
        showErrorToast(error, t("fusion.add.err_no_feed"));
        setPhase({ s: "error", message: t("fusion.add.err_no_feed"), route: meta.route || "" });
      });
  };

  /** 输入 → 防抖 → 发现（发现失败再退回生成器表，命中就自动生成并预览） */
  const detect = (raw: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const text = raw.trim();
    setManualRoute("");
    if (!text) {
      setPhase({ s: "idle" });
      return;
    }

    setPhase({ s: "trying" });
    timerRef.current = setTimeout(() => {
      // 生成器快通道：已知平台主页（B站空间/知乎/微博/YouTube/Substack…）**直接生成并预览**，
      // 不再先花一轮"发现"（对这类地址，常见路径探测几乎必然全空，纯属浪费用户的等待）。
      const hit = matchGenerator(text, [...generators, ...BUILTIN_GENERATORS]);
      if (hit && !hit.generator.nativeFeed) {
        const generated = generateFeedUrl(hit, instance);
        previewUrl(generated, {
          origin: `generator:${hit.generator.key}`,
          carrierHint: hit.generator.carrier,
          generatorLabel: hit.generator.label,
          route: hit.route,
          instance,
        });
        return;
      }

      const token = ++probeRef.current;
      dataAgent
        .fetchFeed(text)
        .then((res: any) => {
          if (!openRef.current || token !== probeRef.current) return;
          if (res?.feed) {
            setPhase({
              s: "preview",
              preview: {
                feed: res.feed,
                resolvedUrl: res.resolved_url || text,
                candidates: res.candidates || [],
                entries: res.entries || [],
              },
            });
            return;
          }

          // 兜底只对"站点自带 feed"的生成器（YouTube/Substack…）有效：它们才走了发现层。
          // 其余生成器（B站/知乎/微博）是快通道直达，这里再兜一次就会拿着同一个地址
          // 无限重试——所以必须用 nativeFeed 收口。
          const fallback = matchGenerator(text, [...generators, ...BUILTIN_GENERATORS]);
          if (fallback?.generator.nativeFeed) {
            previewUrl(generateFeedUrl(fallback, instance), {
              origin: `generator:${fallback.generator.key}`,
              carrierHint: fallback.generator.carrier,
              generatorLabel: fallback.generator.label,
              route: fallback.route,
              instance,
            });
            return;
          }

          setPhase({
            s: "error",
            message: res?.message || t("fusion.add.err_no_feed"),
            // 失败时也把命中的路由填回去：用户可以直接改这行再试（也是"换实例"提示的依据）
            route: hit?.route || "",
          });
        })
        .catch((error) => {
          if (!openRef.current || token !== probeRef.current) return;
          showErrorToast(error, t("fusion.add.err_no_feed"));
          setPhase({ s: "error", message: t("fusion.add.err_no_feed"), route: "" });
        });
    }, 400);
  };

  /** 手填/改路由 → 生成地址并预览（用户输入不可控时的出口） */
  const applyRoute = (route: string) => {
    // 支持三段式：`<route> => <carrier>`（用户在设置/面板里声明这条路由产出什么载体）
    const [rawRoute, rawCarrier] = route.split("=>").map((part) => part.trim());
    const trimmed = (rawRoute || "").trim();
    if (!trimmed) return;
    const carrierHint: Carrier =
      rawCarrier === "video" || rawCarrier === "audio" || rawCarrier === "email"
        ? rawCarrier
        : "text";
    const isAbsolute = /^https?:\/\//i.test(trimmed);
    const feedUrl = isAbsolute
      ? trimmed
      : `${instance.replace(/\/+$/, "")}/${trimmed.replace(/^\/+/, "")}`;
    previewUrl(feedUrl, {
      origin: isAbsolute ? undefined : `generator:${trimmed.split("/")[0] || "custom"}`,
      carrierHint,
      generatorLabel: t("fusion.add.gen_local"),
      route: trimmed,
      instance,
    });
  };

  const createFolderAndSelect = async () => {
    const name = folderName.trim();
    if (!name) return;
    await dataAgent.createFolder(name);
    await store.getSubscribes();
    const created = flattenFolders(useBearStore.getState().subscribes).find(
      (f) => f.title === name,
    );
    if (created) setFolderUuid(created.uuid);
    setCreatingFolder(false);
    setFolderName("");
  };

  const doSubscribe = () => {
    if (phase.s !== "preview") return;
    const { preview } = phase;
    setPhase({ s: "subscribing" });

    dataAgent
      .subscribeFeed(preview.resolvedUrl, preview.origin, preview.carrierHint)
      .then(async (res: any) => {
        if (res[2] !== "") {
          toast.error(`${t("Unable to subscribe")}：${res[2]}`);
          setPhase({ s: "error", message: res[2], route: preview.route || "" });
          return;
        }

        const feed = res[0];
        const count: number = res[1] ?? 0;

        let folderTitle = "";
        if (folderUuid) {
          folderTitle =
            folders.find((f) => f.uuid === folderUuid)?.title ?? "";
          await dataAgent.moveChannelIntoFolder(feed.uuid, folderUuid, 0).catch(() => {});
        }

        feed.children = [];
        feed.unread = count;
        feed.folder_uuid = folderUuid || null;
        feed.origin = preview.origin || feed.origin || "native";
        feed.carrier = preview.carrierHint || feed.carrier || "text";
        store.addNewFeed(feed);
        await store.getSubscribes();
        store.initCollectionMetas();

        // 完成即走：不再停在面板上（用户 2026-09-25：不要"再加一个"循环，直接去读）
        toast.success(
          t("fusion.add.done_toast", { title: feed.title, count, folder: folderTitle }),
        );
        setOpen(false);
        navigate(
          `${RouteConfig.LOCAL_FEED.replace(/:uuid/, feed.uuid)}?feedUuid=${feed.uuid}&feedUrl=${encodeURIComponent(feed.feed_url)}&type=channel`,
        );
      })
      .catch((error) => {
        showErrorToast(error, t("Failed to subscribe to feed"));
        setPhase({ s: "error", message: t("Failed to subscribe to feed"), route: preview.route || "" });
      });
  };

  if (!open) return <>{props.children}</>;

  const preview = phase.s === "preview" ? phase.preview : null;
  const carrierOfPreview = preview
    ? getFeedCarrier({ carrier: preview.feed?.carrier, origin: preview.feed?.origin })
    : null;

  /** 地址走的是路由/实例、却被 401/403 拒绝：最常见是公共 RSSHub 实例限流 → 提示换实例 */
  const instanceRefused =
    phase.s === "error" && !!phase.route && /\b(401|403)\b/.test(phase.message);

  return (
    <>
      <div className="fusion-veil" onClick={() => setOpen(false)} />
      <section
        className="fusion-float fusion-add"
        role="dialog"
        aria-label={t("Create new subscribe")}
      >
        <div className="fusion-add-in">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--fusion-ter)" strokeWidth="1.7">
            <circle cx="7" cy="7" r="4.8" />
            <path d="m11.2 11.2 3 3" />
          </svg>
          <input
            ref={inputRef}
            value={url}
            placeholder={t("fusion.add.ph_any")}
            autoComplete="off"
            onChange={(e) => {
              setUrl(e.target.value);
              detect(e.target.value);
            }}
          />
          {preview && carrierOfPreview && (
            <span className={`fusion-badge ${CARRIER_BADGE_CLS[carrierOfPreview]}`}>
              {CARRIER_TAG[carrierOfPreview]}
            </span>
          )}
          <kbd className="fusion-kbd">esc</kbd>
        </div>

        {phase.s !== "idle" && (
          <div className="fusion-abody">
            {phase.s === "trying" && (
              <div className="fusion-trying">
                <span className="fusion-spin" />
                {t("fusion.add.detecting")}
              </div>
            )}
            {phase.s === "subscribing" && (
              <div className="fusion-trying">
                <span className="fusion-spin" />
                {t("Subscribing")}
              </div>
            )}
            {phase.s === "error" && (
              <div className="fusion-aerr">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <circle cx="8" cy="8" r="6.2" />
                  <path d="M8 4.8v3.6M8 10.8v.4" />
                </svg>
                <span className="fusion-aerr-msg">{phase.message}</span>

                <button type="button" onClick={() => detect(url)}>
                  {t("Retry")}
                </button>
              </div>
            )}
            {phase.s === "error" && (
              <div className="fusion-gen">
                <span className="lb">{t("fusion.add.gen_local")}</span>
                <input
                  value={phase.route || manualRoute}
                  placeholder={t("fusion.add.gen_route_ph")}
                  onChange={(e) => setManualRoute(e.target.value)}
                  spellCheck={false}
                />
                <button type="button" onClick={() => applyRoute(manualRoute || phase.route)}>
                  {t("fusion.add.gen_apply")}
                </button>
                <span className="hp">
                  {instanceRefused
                    ? t("fusion.add.gen_refused")
                    : t("fusion.add.gen_instance", { instance })}
                </span>
              </div>
            )}
            {preview && (
              <div className="fusion-card">
                <div className="c-head">
                  <span className={`c-ic ${carrierOfPreview === "video" ? "b-bil" : ""}`}>
                    {preview.feed.logo ? (
                      <img src={preview.feed.logo} alt="" />
                    ) : (
                      CARRIER_TAG[carrierOfPreview ?? "text"]
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="c-t">{preview.feed.title}</div>
                    <div className="c-d">
                      {preview.feed.description?.slice(0, 80) || preview.resolvedUrl}
                    </div>
                  </div>
                </div>

                {preview.entries.length > 0 && (
                  <>
                    <div className="c-h">{t("fusion.add.recent")}</div>
                    {preview.entries.map((entry, index) => (
                      <div className="c-row" key={`${entry.link}-${index}`}>
                        <span className="rt">{entry.title}</span>
                        <span className="rd">
                          {entryMeta(entry, formatDuration, i18n.language)}
                        </span>
                      </div>
                    ))}
                  </>
                )}

                {preview.candidates.length > 1 && (
                  <div className="fusion-cands">
                    <span className="lb">
                      {t("fusion.add.candidates", { count: preview.candidates.length })}
                    </span>
                    {preview.candidates.slice(0, 6).map((candidate) => (
                      <button
                        type="button"
                        key={candidate}
                        className={candidate === preview.resolvedUrl ? "on" : ""}
                        onClick={() => previewUrl(candidate)}
                        title={candidate}
                      >
                        {candidate.replace(/^https?:\/\//, "").slice(0, 34)}
                      </button>
                    ))}
                  </div>
                )}

                {preview.generatorLabel && (
                  <div className="gen">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                      <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5V5h-2.5" />
                    </svg>
                    {preview.generatorLabel}
                    <code>{preview.route || preview.resolvedUrl}</code>
                    <span>{t("fusion.add.gen_instance", { instance: preview.instance || instance })}</span>
                  </div>
                )}

                <div className="c-foot">
                  {creatingFolder ? (
                    <>
                      <input
                        ref={folderInputRef}
                        className="fusion-in-sm"
                        value={folderName}
                        placeholder={t("fusion.add.new_folder_ph")}
                        onChange={(e) => setFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.stopPropagation();
                            createFolderAndSelect();
                          }
                        }}
                      />
                      <button type="button" className="fusion-btn-gh" onClick={createFolderAndSelect}>
                        {t("fusion.add.create")}
                      </button>
                    </>
                  ) : (
                    <select
                      className="fusion-sel"
                      value={folderUuid}
                      onChange={(e) => {
                        if (e.target.value === "__new__") {
                          setCreatingFolder(true);
                          return;
                        }
                        setFolderUuid(e.target.value);
                      }}
                    >
                      <option value="">{t("fusion.add.ungrouped")}</option>
                      {folders.map((f) => (
                        <option key={f.uuid} value={f.uuid}>
                          {f.title}
                        </option>
                      ))}
                      <option value="__new__">{t("fusion.add.new_folder")}</option>
                    </select>
                  )}
                  <span className="fusion-spring" />
                  <button type="button" className="fusion-btn-gh" onClick={() => setOpen(false)}>
                    {t("Cancel")}
                  </button>
                  <button type="button" className="fusion-btn-ink-sm" onClick={doSubscribe}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M8 3v10M3 8h10" />
                    </svg>
                    {t("Subscribe")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="fusion-float-foot">
          <span>⏎ {t("Subscribe")}</span>
          <span>esc {t("Cancel")}</span>
          <span className="fusion-spring" />
          <span>{t("fusion.add.foot_hint", { instance })}</span>
        </div>
      </section>
      {props.children}
    </>
  );
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}
