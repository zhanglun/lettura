import { useEffect, useMemo, useRef, useState } from "react";
import { Kbd } from "@astryxdesign/core/Kbd";
import { Button } from "@astryxdesign/core/Button";
import { Selector } from "@astryxdesign/core/Selector";
import { TextInput } from "@astryxdesign/core/TextInput";
import { ToggleButton } from "@astryxdesign/core/ToggleButton";
import { Plus, Search } from "lucide-react";
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
  FeedGenerator,
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
  /** 真正生效的 feed 地址 */
  resolvedUrl: string;
  /** 探测试过的候选地址（多个让用户换） */
  candidates: string[];
  entries: PreviewEntry[];
  /** 来源键（`generator:newsletter` 等）＋ 声明的载体 */
  origin?: string;
  carrierHint?: Carrier;
}

type Phase =
  | { s: "idle" }
  | { s: "trying" }
  | { s: "error"; message: string }
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

  /** 真正去探测并进入预览（target 可以是用户输入、生成器地址或候选地址） */
  const previewUrl = (
    feedUrl: string,
    meta: Partial<Pick<Preview, "origin" | "carrierHint">> = {},
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
        setPhase({ s: "error", message: t("fusion.add.err_no_feed") });
      });
  };

  /** 输入 → 防抖 → 发现（发现失败再退回生成器表，命中就自动生成并预览） */
  const detect = (raw: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const text = raw.trim();
    if (!text) {
      setPhase({ s: "idle" });
      return;
    }

    setPhase({ s: "trying" });
    timerRef.current = setTimeout(() => {
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

          // 兜底：站点自带 feed 的生成器（Newsletter…）在发现层失败时，用生成的地址直接抓
          const fallback = matchGenerator(text, [...generators, ...BUILTIN_GENERATORS]);
          if (fallback) {
            previewUrl(fallback.route, {
              origin: `generator:${fallback.generator.key}`,
              carrierHint: fallback.generator.carrier,
            });
            return;
          }

          setPhase({
            s: "error",
            message: res?.message || t("fusion.add.err_no_feed"),
          });
        })
        .catch((error) => {
          if (!openRef.current || token !== probeRef.current) return;
          showErrorToast(error, t("fusion.add.err_no_feed"));
          setPhase({ s: "error", message: t("fusion.add.err_no_feed") });
        });
    }, 400);
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
          setPhase({ s: "error", message: res[2] });
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
        setPhase({ s: "error", message: t("Failed to subscribe to feed") });
      });
  };

  if (!open) return <>{props.children}</>;

  const preview = phase.s === "preview" ? phase.preview : null;
  const carrierOfPreview = preview
    ? getFeedCarrier({ carrier: preview.feed?.carrier, origin: preview.feed?.origin })
    : null;

  return (
    <>
      <div className="fusion-veil" onClick={() => setOpen(false)} />
      <section
        className="fusion-float fusion-add"
        role="dialog"
        aria-label={t("Create new subscribe")}
      >
        <div className="fusion-add-in">
          <TextInput
            ref={inputRef}
            label={t("fusion.add.ph_any")}
            isLabelHidden
            placeholder={t("fusion.add.ph_any")}
            autoComplete="off"
            value={url}
            onChange={(v) => {
              setUrl(v);
              detect(v);
            }}
            startIcon={<Search size={14} />}
          />
          {preview && carrierOfPreview && (
            <span className={`fusion-badge ${CARRIER_BADGE_CLS[carrierOfPreview]}`}>
              {CARRIER_TAG[carrierOfPreview]}
            </span>
          )}
          <Kbd keys="esc" />
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

                <Button variant="ghost" size="sm" label={t("Retry")} onClick={() => detect(url)} />
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
                      <ToggleButton
                        key={candidate}
                        size="sm"
                        label={candidate.replace(/^https?:\/\//, "").slice(0, 34)}
                        isPressed={candidate === preview.resolvedUrl}
                        onPressedChange={() => previewUrl(candidate)}
                      />
                    ))}
                  </div>
                )}

                <div className="c-foot">
                  {creatingFolder ? (
                    <>
                      <TextInput
                        ref={folderInputRef}
                        size="sm"
                        isLabelHidden
                        label={t("fusion.add.new_folder_ph")}
                        placeholder={t("fusion.add.new_folder_ph")}
                        value={folderName}
                        onChange={(v) => setFolderName(v)}
                        onEnter={createFolderAndSelect}
                      />
                      <Button variant="ghost" size="sm" label={t("fusion.add.create")} onClick={createFolderAndSelect} />
                    </>
                  ) : (
                    <Selector
                      size="sm"
                      label={t("fusion.add.new_folder")}
                      isLabelHidden
                      value={folderUuid}
                      options={[
                        { value: "", label: t("fusion.add.ungrouped") },
                        ...folders.map((f) => ({ value: f.uuid, label: f.title })),
                        { value: "__new__", label: t("fusion.add.new_folder") },
                      ]}
                      onChange={(v) => {
                        if (v === "__new__") {
                          setCreatingFolder(true);
                          return;
                        }
                        setFolderUuid(v);
                      }}
                    />
                  )}
                  <span className="fusion-spring" />
                  <Button variant="ghost" size="sm" label={t("Cancel")} onClick={() => setOpen(false)} />
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus size={12} />}
                    label={t("Subscribe")}
                    onClick={doSubscribe}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="fusion-float-foot">
          <span>⏎ {t("Subscribe")}</span>
          <span>esc {t("Cancel")}</span>
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
