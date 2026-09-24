import { useCallback, useEffect, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate, useParams, useMatch } from "react-router-dom";
import { CheckCheck, ChevronLeft, RefreshCw, Settings } from "lucide-react";
import dayjs from "dayjs";
import { ArticleListVirtual } from "@/components/ArticleListVirtual";
import { ArticleDialogView } from "@/components/ArticleView/DialogView";
import { View } from "@/layout/Article/View";
import { RouteConfig } from "@/config";
import { FeedIcon } from "@/components/FeedIcon";
import { getHostLabel, formatFeedTime } from "@/helpers/feedMeta";
import { open } from "@tauri-apps/plugin-shell";
import { useQuery } from "@/helpers/parseXML";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { request } from "@/helpers/request";
import { useArticle } from "@/hooks/useArticle";
import { retainArticleAfterRead } from "@/helpers/articleHelpers";
import { getArticleKind } from "@/helpers/articleKind";
import { EmptyFace } from "./EmptyFace";
import * as dataAgent from "@/helpers/dataAgent";
import { ArticleReadStatus, ArticleStarStatus } from "@/typing";
import type { ArticleResItem } from "@/db";
import { useTranslation } from "react-i18next";

type KindFilter = "all" | "article" | "podcast" | "platform";

export function ArticleView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [, type, queryFeedUuid] = useQuery();
  const params = useParams<{ uuid?: string; id?: string }>();
  const isArticleRoute = useMatch("/local/feeds/:uuid/articles/:id");

  const feedUuid = params.uuid ?? queryFeedUuid;

  const store = useBearStore(
    useShallow((state) => ({
      article: state.article,
      setArticle: state.setArticle,
      articleDialogViewStatus: state.articleDialogViewStatus,
      setArticleDialogViewStatus: state.setArticleDialogViewStatus,
      viewMeta: state.viewMeta,
      collectionMeta: state.collectionMeta,
      expandedArticleUuid: state.expandedArticleUuid,
      setExpandedArticleUuid: state.setExpandedArticleUuid,
      currentFilter: state.currentFilter,
      updateArticleStatus: state.updateArticleStatus,
      setViewMeta: state.setViewMeta,
      globalSyncStatus: state.globalSyncStatus,
      syncAllArticles: state.syncAllArticles,
      syncArticles: state.syncArticles,
      getSubscribes: state.getSubscribes,
      updateCollectionMeta: state.updateCollectionMeta,
      markArticleListAsRead: state.markArticleListAsRead,
      subscribes: state.subscribes,
      userConfig: state.userConfig,
    })),
  );

  // 源队列帧的过滤态（未读/全部，脱离全局 currentFilter）
  const [queueFilter, setQueueFilter] = useState<"unread" | "all">("unread");
  const [queueSyncing, setQueueSyncing] = useState(false);

  const {
    articles,
    total,
    isLoading,
    size,
    setSize,
    isEmpty,
    isReachingEnd,
    mutate,
    isToday,
    isAll,
    isStarred,
  } = useArticle({
    feedUuid,
    type,
    // 源队列帧：过滤条未读/全部，脱离全局 currentFilter（feeds.html 契约）
    readStatus: feedUuid
      ? queueFilter === "unread"
        ? 1
        : null
      : undefined,
  });

  // 类型过滤（客户端，不与 read_status/currentFilter 混用）
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [focusIdx, setFocusIdx] = useState(0);

  const visibleArticles = useMemo(
    () =>
      kindFilter === "all"
        ? articles
        : articles.filter((a) => getArticleKind(a) === kindFilter),
    [articles, kindFilter],
  );

  const kindCounts = useMemo(() => {
    const counts = { all: articles.length, article: 0, podcast: 0, platform: 0 };
    for (const a of articles) counts[getArticleKind(a)] += 1;
    return counts;
  }, [articles]);

  useEffect(() => {
    setFocusIdx((i) => Math.min(i, Math.max(0, visibleArticles.length - 1)));
  }, [visibleArticles.length]);

  // Deep-link：从 URL 恢复文章（面板内详情）
  useEffect(() => {
    if (!(isArticleRoute && params.id)) return;
    if (store.expandedArticleUuid === params.id) return;
    let cancelled = false;
    request
      .get(`/articles/${params.id}`)
      .then((res) => {
        if (!cancelled && res.data) {
          store.setArticle(res.data);
          store.setExpandedArticleUuid(params.id!);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isArticleRoute, params.id]);

  useEffect(() => {
    if (!isArticleRoute) {
      store.setArticle(null);
      store.setExpandedArticleUuid(null);
    }
  }, [feedUuid, isArticleRoute]);

  const handleArticleRead = useCallback(
    (nextArticle: ArticleResItem) => {
      mutate(
        (pages: { list: ArticleResItem[] }[] | undefined) =>
          retainArticleAfterRead(pages, nextArticle),
        false,
      );
    },
    [mutate],
  );

  const handleArticleUpdate = useCallback(
    (updated: ArticleResItem) => {
      mutate(
        (pages: { list: ArticleResItem[] }[] | undefined) =>
          retainArticleAfterRead(pages, updated),
        false,
      );
    },
    [mutate],
  );

  const expandedIdx = store.expandedArticleUuid
    ? visibleArticles.findIndex((a) => a.uuid === store.expandedArticleUuid)
    : -1;

  const detailArticle =
    expandedIdx >= 0
      ? visibleArticles[expandedIdx]
      : store.article && store.article.uuid === store.expandedArticleUuid
        ? store.article
        : null;

  const openArticle = useCallback(
    (a: ArticleResItem) => {
      if (a.read_status === ArticleReadStatus.UNREAD) {
        store.updateArticleStatus(a, ArticleReadStatus.READ);
        handleArticleRead({ ...a, read_status: ArticleReadStatus.READ });
      }
      store.setExpandedArticleUuid(a.uuid);
    },
    [store, handleArticleRead],
  );

  const closeDetail = useCallback(() => {
    store.setExpandedArticleUuid(null);
    if (isArticleRoute) {
      navigate(feedUuid ? `/local/feeds/${feedUuid}` : "/local/all");
    }
  }, [isArticleRoute, feedUuid, navigate, store]);

  const moveFocus = useCallback(
    (delta: number) => {
      const next = Math.max(0, Math.min(focusIdx + delta, visibleArticles.length - 1));
      setFocusIdx(next);
      if (next !== focusIdx) {
        const a = visibleArticles[next];
        if (a && store.expandedArticleUuid) store.setExpandedArticleUuid(a.uuid);
      }
    },
    [focusIdx, visibleArticles, store],
  );

  const focused = visibleArticles[focusIdx];

  const markFocusedRead = useCallback(() => {
    if (!focused || focused.read_status !== ArticleReadStatus.UNREAD) return;
    store.updateArticleStatus(focused, ArticleReadStatus.READ);
    handleArticleRead({ ...focused, read_status: ArticleReadStatus.READ });
  }, [focused, store, handleArticleRead]);

  const toggleStar = useCallback(
    (a: ArticleResItem | null) => {
      if (!a) return;
      const next =
        a.starred === ArticleStarStatus.STARRED
          ? ArticleStarStatus.UNSTAR
          : ArticleStarStatus.STARRED;
      dataAgent.updateArticleStarStatus(a.uuid, next).then(() => {
        handleArticleUpdate({ ...a, starred: next });
      });
    },
    [handleArticleUpdate],
  );

  // 键盘流：j/k 移动 · ⏎/o 打开 · m 已读并下移 · shift+m 未读 · f 星标 · v 浏览器 · esc 返回
  useHotkeys("j", () => moveFocus(1), [moveFocus]);
  useHotkeys("k", () => moveFocus(-1), [moveFocus]);
  useHotkeys("enter, o", () => {
    if (focused) openArticle(focused);
  }, [focused, openArticle]);
  useHotkeys("m", () => {
    markFocusedRead();
    moveFocus(1);
  }, [markFocusedRead, moveFocus]);
  // M：已读并上移（DESIGN 键盘模型契约）
  useHotkeys("shift+m", () => {
    markFocusedRead();
    moveFocus(-1);
  }, [markFocusedRead, moveFocus]);
  useHotkeys("f", () => toggleStar(focused), [focused, toggleStar]);
  useHotkeys("v", () => {
    if (focused?.link) open(focused.link);
  }, [focused]);
  useHotkeys("escape", () => {
    if (useBearStore.getState().playerMode === "full") return; // 沉浸页优先收回条
    if (store.expandedArticleUuid) {
      closeDetail();
    } else if (feedUuid) {
      // 源队列帧 → 订阅浏览帧（位置保留）
      navigate(RouteConfig.LOCAL_FEEDS);
    }
  }, [store, closeDetail, feedUuid, navigate]);

  // ── 源队列帧（feeds.html 契约）：源头栏 + 未读/全部过滤 ──
  const isQueueMode = !!feedUuid;
  const queueFeed = useMemo(() => {
    if (!feedUuid) return null;
    for (const item of store.subscribes || []) {
      if (item.uuid === feedUuid) return item;
      const child = item.children?.find((c) => c.uuid === feedUuid);
      if (child) return child;
    }
    return null;
  }, [store.subscribes, feedUuid]);

  const markQueueAllRead = useCallback(async () => {
    if (!feedUuid) return;
    const before = store.viewMeta?.unread ?? queueFeed?.unread ?? 0;
    await dataAgent.markAllRead({ uuid: feedUuid });
    if (before > 0) store.updateCollectionMeta(0, -before);
    store.setViewMeta({ ...store.viewMeta, unread: 0 });
    await Promise.all([store.getSubscribes?.(), mutate()]);
  }, [feedUuid, store, queueFeed, mutate]);

  const syncQueueFeed = useCallback(async () => {
    if (!queueFeed || queueSyncing) return;
    setQueueSyncing(true);
    try {
      await store.syncArticles(queueFeed);
      await Promise.all([store.getSubscribes?.(), mutate()]);
    } finally {
      setQueueSyncing(false);
    }
  }, [queueFeed, queueSyncing, store, mutate]);

  const markAllRead = async () => {
    await store.markArticleListAsRead(isToday, isAll);
    await mutate();
  };

  const title = store.viewMeta?.title ?? "";
  const unreadCount = (feedUuid
    ? store.viewMeta?.unread
    : isToday
      ? store.collectionMeta.today.unread
      : isAll
        ? store.collectionMeta.total.unread
        : store.viewMeta?.unread)
    ?? 0;

  // 面板内替换：详情视图
  if (detailArticle) {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden">
        <View
          article={detailArticle}
          closable
          onClose={closeDetail}
          nextArticle={visibleArticles[expandedIdx + 1] ?? null}
          onOpenNext={() => moveFocus(1)}
          onMarkBack={() => {
            markFocusedRead();
            closeDetail();
          }}
          onArticleUpdate={handleArticleUpdate}
        />
        <ArticleDialogView
          article={store.article}
          dialogStatus={store.articleDialogViewStatus}
          setDialogStatus={store.setArticleDialogViewStatus}
          afterConfirm={() => {}}
          afterCancel={() => store.setArticle(null)}
        />
      </div>
    );
  }

  // 列表视图
  const sourceCount = (store.subscribes || []).reduce<number>(
    (sum, item) =>
      sum + (item.item_type === "folder" ? item.children?.length ?? 0 : 1),
    0,
  );
  const lastSync = store.userConfig?.last_sync_time
    ? dayjs(new Date(store.userConfig.last_sync_time as any)).format("HH:mm")
    : "";

  const kindTabs: { key: KindFilter; label: string }[] = [
    { key: "all", label: t("fusion.filter.all") },
    { key: "article", label: t("fusion.filter.article") },
    { key: "podcast", label: t("fusion.filter.podcast") },
    { key: "platform", label: t("fusion.filter.platform") },
  ];

  const isFirstRun = (store.subscribes?.length ?? 0) === 0;
  const isClearQuiet =
    !isFirstRun &&
    isAll &&
    store.currentFilter.id === 1 &&
    kindFilter === "all" &&
    isEmpty;

  if (isFirstRun || isClearQuiet) {
    return (
      <EmptyFace mode={isFirstRun ? "first" : "clear"} />
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {isQueueMode ? (
        <>
          {/* 源头栏：返回浏览 + 源名 + 动作（feeds.html 契约） */}
          <div className="fusion-fv-top">
            <button
              type="button"
              className="fusion-back"
              onClick={() => navigate(RouteConfig.LOCAL_FEEDS)}
            >
              <ChevronLeft size={12} />
              {t("fusion.nav.subscriptions")}
              <kbd className="fusion-kbd">esc</kbd>
            </button>
            <span className="fusion-fv-src">
              {queueFeed && <FeedIcon feed={queueFeed} />}
              <span className="fusion-fv-name">
                {queueFeed?.title ?? title}
              </span>
              {queueFeed && (
                <span className="fusion-fv-meta">{getHostLabel(queueFeed)}</span>
              )}
            </span>
            <span className="fusion-fv-acts">
              <button
                type="button"
                className="fusion-qa"
                title={t("feeds.ctx.mark_all_read")}
                aria-label={t("feeds.ctx.mark_all_read")}
                onClick={markQueueAllRead}
              >
                <CheckCheck size={14} />
              </button>
              <button
                type="button"
                className="fusion-qa"
                title={t("feeds.ctx.sync")}
                aria-label={t("feeds.ctx.sync")}
                onClick={syncQueueFeed}
                disabled={queueSyncing}
              >
                <RefreshCw
                  size={14}
                  className={queueSyncing ? "animate-spin" : ""}
                />
              </button>
              <button
                type="button"
                className="fusion-qa"
                title={t("fusion.queue.manage")}
                aria-label={t("fusion.queue.manage")}
                onClick={() =>
                  navigate(`${RouteConfig.SETTINGS}?tab=subscriptions`)
                }
              >
                <Settings size={14} />
              </button>
            </span>
          </div>

          {/* 过滤条：未读/全部（全部 = 服务端同条件总数） */}
          <div className="fusion-strip">
            <button
              type="button"
              className={`fusion-tab ${queueFilter === "unread" ? "on" : ""}`}
              onClick={() => setQueueFilter("unread")}
            >
              {t("fusion.nav.unread")}
              <span className="c">{unreadCount}</span>
            </button>
            <button
              type="button"
              className={`fusion-tab ${queueFilter === "all" ? "on" : ""}`}
              onClick={() => setQueueFilter("all")}
            >
              {t("fusion.filter.all")}
              <span className="c">{total}</span>
            </button>
            {queueFeed && (
              <span className="fusion-strip-meta">
                {t("fusion.queue.last_sync", {
                  time: formatFeedTime(queueFeed.last_sync_date) || "—",
                })}
                {(queueFeed.health_status ?? 0) > 0
                  ? ` · ${t("settings.sources.health_broken")}`
                  : ` · ${t("settings.sources.health_ok")}`}
              </span>
            )}
          </div>
        </>
      ) : (
        <>
          {/* 类型过滤条：全部 = 服务端真实总数；类型计数基于已加载页（客户端启发式）；右侧同步/全部已读 */}
          <div className="fusion-strip">
            {kindTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`fusion-tab ${kindFilter === tab.key ? "on" : ""}`}
                onClick={() => setKindFilter(tab.key)}
              >
                {tab.label}
                <span className="c">
                  {tab.key === "all" ? total : kindCounts[tab.key]}
                </span>
              </button>
            ))}
            <span className="fusion-strip-meta">
              {t("fusion.strip.meta", { sources: sourceCount, time: lastSync })}
            </span>
            <span className="fusion-strip-acts">
              <button
                type="button"
                className="fusion-qa"
                onClick={() => store.syncAllArticles()}
                disabled={store.globalSyncStatus}
                title={t("Sync All")}
                aria-label={t("Sync All")}
              >
                <RefreshCw
                  size={14}
                  className={store.globalSyncStatus ? "animate-spin" : ""}
                />
              </button>
              {!isStarred && (
                <button
                  type="button"
                  className="fusion-qa"
                  onClick={markAllRead}
                  title={t("Mark all as read")}
                  aria-label={t("Mark all as read")}
                >
                  <CheckCheck size={14} />
                </button>
              )}
            </span>
          </div>
        </>
      )}

      {/* ponytail: 类型过滤在客户端做，过滤后过短时无限滚动可能不触发，必要时改服务端过滤 */}
      <ArticleListVirtual
        articles={visibleArticles}
        title={title}
        type={type}
        feedUuid={feedUuid}
        isLoading={isLoading}
        isEmpty={isEmpty || (!isLoading && visibleArticles.length === 0)}
        isReachingEnd={isReachingEnd}
        size={size}
        setSize={setSize}
        onArticleRead={handleArticleRead}
        onArticleUpdate={handleArticleUpdate}
        focusedUuid={focused?.uuid}
        onExpandArticle={openArticle}
      />
      <ArticleDialogView
        article={store.article}
        dialogStatus={store.articleDialogViewStatus}
        setDialogStatus={store.setArticleDialogViewStatus}
        afterConfirm={() => {}}
        afterCancel={() => store.setArticle(null)}
      />
    </div>
  );
}
