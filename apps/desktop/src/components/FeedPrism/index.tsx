import { Popover } from "@astryxdesign/core/Popover";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { RouteConfig } from "@/config";
import type { FeedResItem } from "@/db";
import { getHostLabel } from "@/helpers/feedMeta";
import { useAppStore } from "@/stores";

function flattenFeeds(items: FeedResItem[]): FeedResItem[] {
  return items.flatMap((item) =>
    item.item_type === "folder" ? flattenFeeds(item.children || []) : [item],
  );
}

/** 源棱镜（list-prism.html 契约，2026-09-30 二次改版）：过滤条右端的源漏斗。
 *  点击弹出源清单（Astryx Popover，搜索 + 分组 + 徽标；用户拍板：hover 误触
 *  频繁，点击才是明确意图）；选源 = 当前列表原地过滤（onSelect），不再跳转
 *  源详情——未读流的队列身份不因筛选改变。 */
export function FeedPrism({
  selectedUuid,
  onSelect,
}: {
  selectedUuid?: string;
  onSelect?: (f: FeedResItem | null) => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Popover 非受控（click 归库管）；open 仅镜像状态用于聚焦搜索框，
  // 选中后 bump key 重挂载即收卡。
  const [open, setOpen] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const store = useAppStore(
    useShallow((state) => ({
      subscribes: state.subscribes,
    })),
  );

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // 派生序列由 React Compiler 自动记忆化（等价于原 5 个 useMemo，依赖不变不重算）
  const feeds = flattenFeeds(store.subscribes || []);

  const selectedFeed = feeds.find((f) => f.uuid === selectedUuid) ?? null;

  // 最近更新的 3 个源（按源内最新文章时间近似：用 last_sync_date 代替——
  // 同步越近越可能有新内容，且零额外查询）
  const recentFeeds = [...feeds]
    .sort((a, b) =>
      String(b.last_sync_date ?? "").localeCompare(
        String(a.last_sync_date ?? ""),
      ),
    )
    .slice(0, 3);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? feeds.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          (f.feed_url ?? "").toLowerCase().includes(q),
      )
    : feeds;

  const folders = (store.subscribes || []).filter(
    (i) => i.item_type === "folder",
  );

  const selectFeed = (f: FeedResItem | null) => {
    if (onSelect) {
      // 原地过滤：只改当前列表的 feed_uuid 条件，不动路由
      onSelect(f);
      setQuery("");
      setCardKey((k) => k + 1); // 重挂载收卡
      return;
    }
    setQuery("");
    setCardKey((k) => k + 1);
    navigate(
      `${RouteConfig.LOCAL_FEED.replace(/:uuid/, f!.uuid)}?feedUuid=${f!.uuid}&feedUrl=${encodeURIComponent(f!.feed_url)}&type=${f!.item_type}`,
    );
  };

  const initials = (f: FeedResItem) =>
    f.logo ? (
      <img src={f.logo} alt="" loading="lazy" />
    ) : (
      (f.title?.charAt(0)?.toUpperCase() ?? "F")
    );

  const listContent = (
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
          onClick={() => selectFeed(null)}
        >
          <span className="ic">
            <i />
          </span>
          {t("fusion.prism.all")}
        </button>

        {folders.length > 0 && (
          <>
            <div className="fusion-prism-h">{t("fusion.prism.groups")}</div>
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
                      active={f.uuid === selectedUuid}
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
                active={f.uuid === selectedUuid}
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
              active={f.uuid === selectedUuid}
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
  );

  return (
    <span className="fusion-prism">
      <Popover
        key={cardKey}
        onOpenChange={setOpen}
        placement="below"
        alignment="end"
        label={t("fusion.prism.open")}
        role="none"
        content={listContent}
      >
        <button
          type="button"
          className={`fusion-prism-btn${selectedUuid ? " on" : ""}`}
          aria-label={t("fusion.prism.open")}
        >
          {selectedFeed ? (
            <span className="sel">{selectedFeed.title}</span>
          ) : (
            <>
              <span className="ficons">
                {recentFeeds.map((f) => (
                  <span className="fmini" key={f.uuid}>
                    {initials(f)}
                  </span>
                ))}
              </span>
              {t("fusion.prism.label")}{" "}
              <span className="n">{feeds.length}</span>
            </>
          )}
          <span className="chev">▾</span>
        </button>
      </Popover>
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
  active,
}: {
  feed: FeedResItem;
  onSelect: (f: FeedResItem | null) => void;
  initials: (f: FeedResItem) => React.ReactNode;
  active?: boolean;
}) {
  const unread = feed.unread ?? 0;
  return (
    <button
      type="button"
      className={`fusion-prism-f${active ? " on" : ""}`}
      onClick={() => onSelect(feed)}
      title={getHostLabel(feed)}
    >
      <span className="ficon">{initials(feed)}</span>
      <span className="nm">{feed.title}</span>
      {unread > 0 && <span className="b">{unread}</span>}
    </button>
  );
}
