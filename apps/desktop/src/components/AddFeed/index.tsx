import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import * as dataAgent from "@/helpers/dataAgent";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { showErrorToast } from "@/helpers/errorHandler";
import { FeedResItem } from "@/db";

type Plat = "auto" | "rss" | "bil" | "zh" | "wb" | "nl";
type DetectKind = "rss" | "bil" | "zh" | "wb" | "nl";

/** 平台 URL 识别（add.html 契约；手动分段优先） */
function classifyUrl(url: string): DetectKind | null {
  if (/space\.bilibili\.com|bilibili\.com/i.test(url)) return "bil";
  if (/zhihu\.com/i.test(url)) return "zh";
  if (/weibo\.com/i.test(url)) return "wb";
  if (/substack|buttondown|beehiiv|kill-the-newsletter|newsletter/i.test(url)) return "nl";
  if (/\.(xml|rss)(\?|$)/i.test(url) || /\/feed\/?$|\/rss\/?$/i.test(url) || /feeds?\./i.test(url)) return "rss";
  return null;
}

/** 平台主页 → RSSHub / 原生 feed 地址（运维门槛挡在界面后面） */
function toFeedUrl(url: string, kind: DetectKind): string {
  if (kind === "rss") return url;
  let m: RegExpMatchArray | null;
  if (kind === "bil") {
    m = url.match(/space\.bilibili\.com\/(\d+)/);
    if (m) return `https://rsshub.app/bilibili/user/${m[1]}`;
  }
  if (kind === "zh") {
    m = url.match(/zhihu\.com\/people\/([\w-]+)/);
    if (m) return `https://rsshub.app/zhihu/people/activities/${m[1]}`;
    m = url.match(/zhihu\.com\/column\/([\w-]+)/);
    if (m) return `https://rsshub.app/zhihu/column/${m[1]}`;
  }
  if (kind === "wb") {
    m = url.match(/weibo\.com\/(?:u\/)?(\d+)/);
    if (m) return `https://rsshub.app/weibo/user/${m[1]}`;
  }
  if (kind === "nl") {
    m = url.match(/([\w-]+)\.substack\.com/i);
    if (m) return `https://${m[1]}.substack.com/feed`;
    m = url.match(/buttondown\.email\/([\w-]+)/i);
    if (m) return `https://rsshub.app/buttondown/${m[1]}`;
  }
  return url;
}

const KIND_TAG: Record<DetectKind, string> = {
  rss: "RSS",
  bil: "B",
  zh: "知",
  wb: "微",
  nl: "✉",
};

type Phase =
  | { s: "idle" }
  | { s: "trying" }
  | { s: "error"; message: string }
  | { s: "preview"; kind: DetectKind; feed: any; feedUrl: string }
  | { s: "subscribing" }
  | { s: "done"; title: string; folder: string };

function flattenFolders(items: FeedResItem[]): FeedResItem[] {
  return (items || []).filter((i) => i.item_type === "folder");
}

/** 渐进式订阅面板（add.html 契约）：一个输入框，检测即显影，面板向下长出预览卡 */
export const AddFeedChannel = (props: any) => {
  const { t } = useTranslation();
  const store = useBearStore(
    useShallow((state) => ({
      subscribes: state.subscribes,
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

  const [plat, setPlat] = useState<Plat>("auto");
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>({ s: "idle" });
  const [folderUuid, setFolderUuid] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRef = useRef(open);
  openRef.current = open;

  const folders = flattenFolders(store.subscribes);

  useHotkeys("c", () => {
    setOpen(true);
  });

  useEffect(() => {
    if (open) {
      setUrl("");
      setPlat("auto");
      setPhase({ s: "idle" });
      setFolderUuid("");
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

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

  const detect = (raw: string, manualPlat: Plat) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const text = raw.trim();
    if (!text) {
      setPhase({ s: "idle" });
      return;
    }
    setPhase({ s: "trying" });
    timerRef.current = setTimeout(() => {
      let kind = classifyUrl(text);
      if (manualPlat !== "auto" && kind !== manualPlat) kind = manualPlat;
      if (!kind) {
        setPhase({ s: "error", message: t("fusion.add.err_no_feed") });
        return;
      }
      const feedUrl = toFeedUrl(text, kind);
      dataAgent
        .fetchFeed(feedUrl)
        .then(([feed, message]) => {
          if (!openRef.current) return;
          if (!feed) {
            setPhase({ s: "error", message: message || t("fusion.add.err_no_feed") });
            return;
          }
          setPhase({ s: "preview", kind, feed, feedUrl });
        })
        .catch((error) => {
          showErrorToast(error, t("fusion.add.err_no_feed"));
          setPhase({ s: "error", message: t("fusion.add.err_no_feed") });
        });
    }, 500);
  };

  const doSubscribe = () => {
    if (phase.s !== "preview") return;
    setPhase({ s: "subscribing" });
    const { feedUrl, feed } = phase;
    dataAgent
      .subscribeFeed(feedUrl)
      .then(async (res) => {
        if (res[2] !== "") {
          toast.error(t("Unable to subscribe"), { description: res[2], duration: 2000 });
          setPhase({ s: "error", message: res[2] });
          return;
        }
        // 分组（选了文件夹则移动）
        let folderTitle = "";
        if (folderUuid) {
          const folder = folders.find((f) => f.uuid === folderUuid);
          folderTitle = folder?.title ?? "";
          await dataAgent
            .moveChannelIntoFolder(res[0].uuid, folderUuid, 0)
            .catch(() => {});
        }
        res[0].children = [];
        res[0].unread = res[1];
        res[0].folder_uuid = folderUuid || null;
        store.addNewFeed(res[0]);
        store.getSubscribes();
        store.initCollectionMetas();
        setPhase({ s: "done", title: feed.title, folder: folderTitle });
        setTimeout(() => setOpen(false), 900);
      })
      .catch((error) => {
        showErrorToast(error, t("Failed to subscribe to feed"));
        setPhase({ s: "error", message: t("Failed to subscribe to feed") });
      });
  };

  if (!open) return <>{props.children}</>;

  const placeholders: Record<Plat, string> = {
    auto: t("fusion.add.ph_auto"),
    rss: t("fusion.add.ph_rss"),
    bil: t("fusion.add.ph_bil"),
    zh: t("fusion.add.ph_zh"),
    wb: t("fusion.add.ph_wb"),
    nl: t("fusion.add.ph_nl"),
  };

  const segs: { key: Plat; label: string }[] = [
    { key: "auto", label: t("fusion.add.seg_auto") },
    { key: "rss", label: t("fusion.add.seg_rss") },
    { key: "bil", label: t("fusion.add.seg_bil") },
    { key: "zh", label: t("fusion.add.seg_zh") },
    { key: "wb", label: t("fusion.add.seg_wb") },
    { key: "nl", label: t("fusion.add.seg_nl") },
  ];

  return (
    <>
      <div className="fusion-veil" onClick={() => setOpen(false)} />
      <section className="fusion-float fusion-add" role="dialog" aria-label={t("Create new subscribe")}>
        <div className="fusion-add-in">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--fusion-ter)" strokeWidth="1.7">
            <circle cx="7" cy="7" r="4.8" />
            <path d="m11.2 11.2 3 3" />
          </svg>
          <input
            ref={inputRef}
            value={url}
            placeholder={placeholders[plat]}
            autoComplete="off"
            onChange={(e) => {
              setUrl(e.target.value);
              detect(e.target.value, plat);
            }}
          />
          {phase.s === "preview" && (
            <span className={`fusion-badge ${phase.kind === "bil" ? "b-bil" : phase.kind === "rss" ? "b-art" : "b-pod"}`}>
              {KIND_TAG[phase.kind]}
            </span>
          )}
          <kbd className="fusion-kbd">esc</kbd>
        </div>

        <div className="fusion-aseg">
          {segs.map((s) => (
            <button
              key={s.key}
              type="button"
              className={plat === s.key ? "on" : ""}
              onClick={() => {
                setPlat(s.key);
                if (url) detect(url, s.key);
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {phase.s !== "idle" && (
          <div className="fusion-abody">
            {phase.s === "trying" && (
              <div className="fusion-trying">
                <span className="fusion-spin" />
                {t("fusion.add.detecting")}
              </div>
            )}
            {phase.s === "error" && (
              <div className="fusion-aerr">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <circle cx="8" cy="8" r="6.2" />
                  <path d="M8 4.8v3.6M8 10.8v.4" />
                </svg>
                {phase.message}
                <button type="button" onClick={() => detect(url, plat)}>
                  {t("Retry")}
                </button>
              </div>
            )}
            {phase.s === "subscribing" && (
              <div className="fusion-trying">
                <span className="fusion-spin" />
                {t("Subscribing")}
              </div>
            )}
            {phase.s === "done" && (
              <div className="fusion-adone">
                <span className="ok">
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="m3.5 8.5 3 3 6-6.5" />
                  </svg>
                </span>
                {t("fusion.add.done", {
                  title: phase.title,
                  folder: phase.folder || t("fusion.add.ungrouped"),
                })}
              </div>
            )}
            {phase.s === "preview" && (
              <div className="fusion-card">
                <div className="c-head">
                  <span className={`c-ic ${phase.kind === "bil" ? "b-bil" : ""}`}>
                    {phase.feed.logo ? (
                      <img src={phase.feed.logo} alt="" />
                    ) : (
                      KIND_TAG[phase.kind]
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="c-t">{phase.feed.title}</div>
                    <div className="c-d">
                      {phase.feed.description?.slice(0, 80) || phase.feedUrl}
                    </div>
                  </div>
                </div>

                {phase.kind !== "rss" && (
                  <div className="gen">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                      <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5V5h-2.5" />
                    </svg>
                    <code>{phase.feedUrl}</code>
                    <span>{t("fusion.add.gen_hint")}</span>
                  </div>
                )}

                <div className="c-foot">
                  <select
                    className="fusion-sel"
                    value={folderUuid}
                    onChange={(e) => setFolderUuid(e.target.value)}
                  >
                    <option value="">{t("fusion.add.ungrouped")}</option>
                    {folders.map((f) => (
                      <option key={f.uuid} value={f.uuid}>
                        {f.title}
                      </option>
                    ))}
                  </select>
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
          <span>{t("fusion.add.foot_rsshub")}</span>
        </div>
      </section>
      {props.children}
    </>
  );
};
