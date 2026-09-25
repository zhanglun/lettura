import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useHotkeys } from "react-hotkeys-hook";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import { ArticleView } from "@/layout/Article/ArticleView";
import { RouteConfig } from "@/config";
import { useBearStore } from "@/stores";
import { FeedIcon } from "@/components/FeedIcon";
import { getHostLabel, formatFeedTime } from "@/helpers/feedMeta";
import type { FeedResItem } from "@/db";

const FILTER_UNREAD = { id: 1, title: "Unread" };

/** 浏览帧的会话记忆：从源队列 esc 退回时，焦点与分组位置保留（feeds.html 契约） */
const browseMemory: {
  focusUuid: string | null;
  scrollTop: number;
  collapsed: Set<string>;
} = {
  focusUuid: null,
  scrollTop: 0,
  collapsed: new Set(),
};

function SourceRow({
  feed,
  focused,
  onOpen,
}: {
  feed: FeedResItem;
  focused: boolean;
  onOpen: (feed: FeedResItem) => void;
}) {
  const { t } = useTranslation();
  const unread = feed.unread ?? 0;
  const broken = (feed.health_status ?? 0) > 0;

  return (
    <button
      type="button"
      className={clsx("fusion-b-row", unread === 0 && "is-muted", focused && "is-focused")}
      data-feed-uuid={feed.uuid}
      onClick={() => onOpen(feed)}
    >
      <FeedIcon feed={feed} />
      <span className="fusion-b-name">{feed.title}</span>
      <span className={clsx("fusion-b-host", broken && "is-fail")}>
        {getHostLabel(feed)}
        {broken ? ` · ${t("fusion.browse.sync_failed")}` : ""}
      </span>
      <span className={clsx("fusion-b-unread", unread === 0 && "is-zero")}>
        {unread}
      </span>
      <span className="fusion-b-time">{formatFeedTime(feed.last_sync_date)}</span>
    </button>
  );
}

/** 订阅浏览帧：分组源列表，未读数是主角（feeds.html 契约） */
export function FeedsBrowse() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(browseMemory.collapsed),
  );
  const [focusUuid, setFocusUuid] = useState<string | null>(
    browseMemory.focusUuid,
  );

  const store = useBearStore(
    useShallow((state) => ({
      subscribes: state.subscribes,
      getSubscribes: state.getSubscribes,
      setFeed: state.setFeed,
      setFilter: state.setFilter,
    })),
  );

  useEffect(() => {
    store.getSubscribes();
  }, []);

  // 恢复滚动位置；卸载时记住焦点与滚动
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = browseMemory.scrollTop;
    return () => {
      browseMemory.focusUuid = focusUuid;
      browseMemory.scrollTop = scrollRef.current?.scrollTop ?? 0;
      browseMemory.collapsed = new Set(collapsed);
    };
  }, [focusUuid, collapsed]);

  const groups = useMemo(() => {
    const rootFeeds = store.subscribes.filter((i) => i.item_type !== "folder");
    const folders = store.subscribes.filter((i) => i.item_type === "folder");
    return [
      ...(rootFeeds.length > 0
        ? [{ uuid: "__ungrouped__", title: t("feeds.ungrouped"), feeds: rootFeeds }]
        : []),
      ...folders.map((f) => ({
        uuid: f.uuid,
        title: f.title,
        feeds: f.children ?? [],
      })),
    ].filter((g) => g.feeds.length > 0);
  }, [store.subscribes, t]);

  // 键盘队列：可见（未折叠分组）且有未读的源
  const keyboardQueue = useMemo(
    () =>
      groups
        .filter((g) => !collapsed.has(g.uuid))
        .flatMap((g) => g.feeds)
        .filter((f) => (f.unread ?? 0) > 0),
    [groups, collapsed],
  );

  useEffect(() => {
    if (keyboardQueue.length === 0) {
      setFocusUuid(null);
      return;
    }
    if (!(focusUuid && keyboardQueue.some((f) => f.uuid === focusUuid))) {
      setFocusUuid(keyboardQueue[0].uuid);
    }
  }, [keyboardQueue, focusUuid]);

  // 焦点行滚进可视区
  useEffect(() => {
    if (!(focusUuid && scrollRef.current)) return;
    const el = scrollRef.current.querySelector(`[data-feed-uuid="${focusUuid}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [focusUuid]);

  const moveFocus = (delta: number) => {
    if (keyboardQueue.length === 0) return;
    const idx = keyboardQueue.findIndex((f) => f.uuid === focusUuid);
    const next = Math.max(
      0,
      Math.min(idx + delta, keyboardQueue.length - 1),
    );
    setFocusUuid(keyboardQueue[next].uuid);
  };

  const openFeed = (f: FeedResItem) => {
    browseMemory.focusUuid = f.uuid;
    browseMemory.scrollTop = scrollRef.current?.scrollTop ?? 0;
    store.setFeed(f);
    navigate(
      `${RouteConfig.LOCAL_FEED.replace(/:uuid/, f.uuid)}?feedUuid=${f.uuid}&feedUrl=${encodeURIComponent(f.feed_url)}&type=${f.item_type}`,
    );
  };

  const toggleFolder = (uuid: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  };

  // 键盘流：j/k 移动（跳过零未读源）· ⏎/o 进源队列 · esc 回未读列表
  useHotkeys("j, arrowdown", () => moveFocus(1), [moveFocus]);
  useHotkeys("k, arrowup", () => moveFocus(-1), [moveFocus]);
  useHotkeys("enter, o", () => {
    const target = keyboardQueue.find((f) => f.uuid === focusUuid);
    if (target) openFeed(target);
  }, [keyboardQueue, focusUuid, openFeed]);
  useHotkeys("escape", () => {
    if (useBearStore.getState().playerMode === "full") return; // 沉浸页优先收回条
    navigate(RouteConfig.LOCAL_ALL);
    store.setFilter(FILTER_UNREAD);
  }, [navigate, store]);

  if (groups.length === 0) {
    return (
      <div className="fusion-face">
        <h1>{t("fusion.browse.empty_title")}</h1>
        <p className="lede">{t("fusion.browse.empty_lede")}</p>
      </div>
    );
  }

  return (
    <div className="fusion-browse fusion-inset-tail" ref={scrollRef}>
      {groups.map((group) => {
        const isCollapsed = collapsed.has(group.uuid);
        const unread = group.feeds.reduce((sum, f) => sum + (f.unread ?? 0), 0);
        return (
          <div
            key={group.uuid}
            className={clsx("fusion-b-folder", isCollapsed && "closed")}
          >
            <button
              type="button"
              className="fusion-b-head"
              onClick={() => toggleFolder(group.uuid)}
            >
              <span className="fusion-b-chev">
                <ChevronDown size={12} />
              </span>
              <span className="fusion-b-title">{group.title}</span>
              <span className="fusion-b-count">
                · {t("fusion.browse.folder_sources", { count: group.feeds.length })}
              </span>
              <span className="fusion-b-sum">
                {t("fusion.browse.folder_unread", { count: unread })}
              </span>
            </button>
            {!isCollapsed && (
              <div className="fusion-b-feeds">
                {group.feeds.map((feed) => (
                  <SourceRow
                    key={feed.uuid}
                    feed={feed}
                    focused={focusUuid === feed.uuid}
                    onOpen={openFeed}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FeedsPage() {
  const { uuid } = useParams<{ uuid?: string }>();

  // 无 uuid = 浏览帧（分组源列表）；有 uuid = 源队列帧（ArticleView 队列变体）
  return uuid ? (
    <div className="relative flex flex-1 h-full overflow-hidden">
      <ArticleView />
    </div>
  ) : (
    <FeedsBrowse />
  );
}
