import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { RouteConfig } from "@/config";
import type { FeedResItem } from "@/db";
import { getHostLabel } from "@/helpers/feedMeta";
import { useBearStore } from "@/stores";

function flattenFeeds(items: FeedResItem[]): FeedResItem[] {
  return items.flatMap((item) =>
    item.item_type === "folder" ? flattenFeeds(item.children || []) : [item],
  );
}

/** 源棱镜（list-prism.html 契约）：过滤条右端的源漏斗。
 *  默认露出最近更新的源图标当引力点；点开轻量源清单（搜索 + 分组 + 徽标），
 *  选源 = 透镜态（onSelect）。不常驻导航，268 源时列表仍占满宽度。 */
export function FeedPrism({ selectedUuid }: { selectedUuid?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const store = useBearStore(
    useShallow((state) => ({
      subscribes: state.subscribes,
    })),
  );

  // 外点关闭 + esc 收起（全局 esc 退回已在列表热键里处理，这里 stopPropagation）
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const feeds = useMemo(
    () => flattenFeeds(store.subscribes || []),
    [store.subscribes],
  );

  // 最近更新的 3 个源（按源内最新文章时间近似：用 last_sync_date 代替——
  // 同步越近越可能有新内容，且零额外查询）
  const recentFeeds = useMemo(
    () =>
      [...feeds]
        .sort((a, b) =>
          String(b.last_sync_date ?? "").localeCompare(
            String(a.last_sync_date ?? ""),
          ),
        )
        .slice(0, 3),
    [feeds],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return feeds;
    return feeds.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        (f.feed_url ?? "").toLowerCase().includes(q),
    );
  }, [feeds, query]);

  const folders = useMemo(
    () => (store.subscribes || []).filter((i) => i.item_type === "folder"),
    [store.subscribes],
  );

  const selectFeed = (f: FeedResItem) => {
    setOpen(false);
    setQuery("");
    navigate(
      `${RouteConfig.LOCAL_FEED.replace(/:uuid/, f.uuid)}?feedUuid=${f.uuid}&feedUrl=${encodeURIComponent(f.feed_url)}&type=${f.item_type}`,
    );
  };

  const initials = (f: FeedResItem) =>
    f.logo ? (
      <img src={f.logo} alt="" loading="lazy" />
    ) : (
      (f.title?.charAt(0)?.toUpperCase() ?? "F")
    );

  return (
    <span className="fusion-prism" ref={rootRef}>
      <button
        type="button"
        className={`fusion-prism-btn${open || selectedUuid ? " on" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={t("fusion.prism.open")}
        title={t("fusion.prism.open")}
      >
        <span className="ficons">
          {recentFeeds.map((f) => (
            <span className="fmini" key={f.uuid}>
              {initials(f)}
            </span>
          ))}
        </span>
        {t("fusion.prism.label")} <span className="n">{feeds.length}</span>
        <span className="chev">▾</span>
      </button>

      {open && (
        <div className="fusion-prism-pop">
          <div className="fusion-prism-search">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("fusion.prism.search_placeholder")}
            />
          </div>
          <div className="fusion-prism-scroll">
            <button
              type="button"
              className="fusion-prism-scope"
              onClick={() => {
                setOpen(false);
                setQuery("");
                navigate(RouteConfig.LOCAL_ALL);
              }}
            >
              <span className="ic">
                <i />
              </span>
              {t("fusion.prism.all")}
            </button>

            {folders.length > 0 && (
              <>
                <div className="fusion-prism-h">
                  {t("feeds.ungrouped_folder_hint") ?? t("fusion.prism.groups")}
                </div>
                {folders.map((folder) => (
                  <div key={folder.uuid}>
                    <div className="fusion-prism-h">{folder.title}</div>
                    {(folder.children ?? [])
                      .filter(matchesPrism(query))
                      .map((f) => (
                        <PrismRow
                          key={f.uuid}
                          feed={f}
                          onSelect={selectFeed}
                          initials={initials}
                        />
                      ))}
                  </div>
                ))}
                {rootFeeds(filtered, store.subscribes).length > 0 && (
                  <div className="fusion-prism-h">{t("feeds.ungrouped")}</div>
                )}
                {rootFeeds(filtered, store.subscribes).map((f) => (
                  <PrismRow
                    key={f.uuid}
                    feed={f}
                    onSelect={selectFeed}
                    initials={initials}
                  />
                ))}
              </>
            )}

            {folders.length === 0 &&
              filtered.map((f) => (
                <PrismRow
                  key={f.uuid}
                  feed={f}
                  onSelect={selectFeed}
                  initials={initials}
                />
              ))}

            {filtered.length === 0 && folders.length === 0 && (
              <div className="fusion-prism-h">{t("fusion.prism.empty")}</div>
            )}
          </div>
          <div className="fusion-prism-foot">
            <span>
              <b>esc</b> {t("fusion.prism.esc_close")}
            </span>
          </div>
        </div>
      )}
    </span>
  );
}

function matchesPrism(q: string) {
  const query = q.trim().toLowerCase();
  return (f: FeedResItem) =>
    !query ||
    f.title.toLowerCase().includes(query) ||
    (f.feed_url ?? "").toLowerCase().includes(query);
}

function rootFeeds(filtered: FeedResItem[], all: FeedResItem[]): FeedResItem[] {
  const root = all.filter((i) => i.item_type !== "folder");
  const ids = new Set(root.map((f) => f.uuid));
  return filtered.filter((f) => ids.has(f.uuid));
}

function PrismRow({
  feed,
  onSelect,
  initials,
}: {
  feed: FeedResItem;
  onSelect: (f: FeedResItem) => void;
  initials: (f: FeedResItem) => React.ReactNode;
}) {
  const unread = feed.unread ?? 0;
  return (
    <button
      type="button"
      className="fusion-prism-f"
      onClick={() => onSelect(feed)}
      title={getHostLabel(feed)}
    >
      <span className="ficon">{initials(feed)}</span>
      <span className="nm">{feed.title}</span>
      {unread > 0 && <span className="b">{unread}</span>}
    </button>
  );
}
