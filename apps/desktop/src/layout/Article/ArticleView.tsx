import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Kbd } from "@astryxdesign/core/Kbd";
import { IconButton } from "@astryxdesign/core/IconButton";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate, useParams, useMatch } from "react-router-dom";
import { CheckCheck, ChevronLeft, RefreshCw } from "lucide-react";
import { Button } from "@astryxdesign/core/Button";
import dayjs from "dayjs";
import { ArticleListVirtual } from "@/components/ArticleListVirtual";
import { ArticleDialogView } from "@/components/ArticleView/DialogView";
import { View } from "@/layout/Article/View";
import { RouteConfig } from "@/config";
import { FeedProfile } from "@/components/FeedProfile";
import { useQuery } from "@/helpers/parseXML";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { request } from "@/helpers/request";
import { useArticle } from "@/hooks/useArticle";
import { retainArticleAfterRead } from "@/helpers/articleHelpers";
import { EmptyFace } from "./EmptyFace";
import * as dataAgent from "@/helpers/dataAgent";
import { ArticleReadStatus, ArticleStarStatus } from "@/typing";
import {
  buildSegments,
  flattenDisplay,
  subscribeRunExpansion,
  getRunExpansionVersion,
} from "@/components/ArticleListVirtual/feedRuns";
import type { ArticleResItem } from "@/db";
import { useTranslation } from "react-i18next";

type CarrierFilter = "all" | "text" | "audio" | "video" | "email";

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

  // 类型过滤（服务端过滤与计数，不与 read_status/currentFilter 混用）
  const [carrierFilter, setCarrierFilter] = useState<CarrierFilter>("all");
  // 聚焦仅在交互（j/k）后建立：首行不再默认带选中洗色
  const [focusIdx, setFocusIdx] = useState<number | null>(null);

  const {
    articles,
    total,
    carrierCounts,
    refreshCarrierCounts,
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
    // 载体过滤条（全部/文章/播客/视频[+邮件]）：服务端过滤，不随分页截断
    carrier: feedUuid ? undefined : carrierFilter,
    // 源队列帧：过滤条未读/全部，脱离全局 currentFilter（feeds.html 契约）
    readStatus: feedUuid
      ? queueFilter === "unread"
        ? 1
        : null
      : undefined,
  });

  // 载体计数保持鲜活：单篇标记已读/切换读状态后防抖刷新
  // （段头「全部已读」连发多篇也只触发一次请求；同步/全部已读路径原本就刷新）
  const countsRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleCountsRefresh = useCallback(() => {
    if (countsRefreshTimer.current) clearTimeout(countsRefreshTimer.current);
    countsRefreshTimer.current = setTimeout(() => refreshCarrierCounts(), 600);
  }, [refreshCarrierCounts]);
  useEffect(
    () => () => {
      if (countsRefreshTimer.current) clearTimeout(countsRefreshTimer.current);
    },
    [],
  );

  // 服务端已按 kind 过滤，这里只透传
  const visibleArticles = articles;

  // 折叠段的「可见序列」：j/k、焦点、下一篇都沿它走（隐藏行不可达，与渲染严格一致）
  const expansionVersion = useSyncExternalStore(
    subscribeRunExpansion,
    getRunExpansionVersion,
  );
  const segments = useMemo(
    () => (feedUuid ? null : buildSegments(visibleArticles)),
    [feedUuid, visibleArticles],
  );
  const displayArticles = useMemo(
    () => (segments ? flattenDisplay(segments) : visibleArticles),
    [segments, visibleArticles, expansionVersion],
  );

  useEffect(() => {
    setFocusIdx((i) =>
      i === null ? null : Math.min(i, Math.max(0, displayArticles.length - 1)),
    );
  }, [displayArticles.length]);

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
      scheduleCountsRefresh();
    },
    [mutate, scheduleCountsRefresh],
  );

  const handleArticleUpdate = useCallback(
    (updated: ArticleResItem) => {
      mutate(
        (pages: { list: ArticleResItem[] }[] | undefined) =>
          retainArticleAfterRead(pages, updated),
        false,
      );
      scheduleCountsRefresh();
    },
    [mutate, scheduleCountsRefresh],
  );

  const expandedIdx = store.expandedArticleUuid
    ? displayArticles.findIndex((a) => a.uuid === store.expandedArticleUuid)
    : -1;

  const detailArticle =
    expandedIdx >= 0
      ? displayArticles[expandedIdx]
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

  // 完读区「下一篇」卡：直接打开卡里那篇。旧实现走 moveFocus(1)，
  // 鼠标打开详情时 focusIdx 未建立 → 从 -1 起步落回列表顶部，
  // 看起来就是「点了下一篇却重开当前篇」的数据错乱
  const openNextArticle = useCallback(() => {
    const next = displayArticles[expandedIdx + 1] ?? null;
    if (!next) return;
    if (next.read_status === ArticleReadStatus.UNREAD) {
      store.updateArticleStatus(next, ArticleReadStatus.READ);
      handleArticleRead({ ...next, read_status: ArticleReadStatus.READ });
    }
    store.setExpandedArticleUuid(next.uuid);
    setFocusIdx(expandedIdx + 1);
  }, [displayArticles, expandedIdx, store, handleArticleRead]);

  const closeDetail = useCallback(() => {
    store.setExpandedArticleUuid(null);
    if (isArticleRoute) {
      navigate(feedUuid ? `/local/feeds/${feedUuid}` : "/local/all");
    }
  }, [isArticleRoute, feedUuid, navigate, store]);

  const moveFocus = useCallback(
    (delta: number) => {
      // 详情打开时从「正在阅读的文章」起走（点击打开不建立 focusIdx）；
      // 纯列表态维持原语义：未聚焦时 j 从头 / k 从尾开始
      const from =
        store.expandedArticleUuid && expandedIdx >= 0
          ? expandedIdx
          : (focusIdx ?? (delta > 0 ? -1 : displayArticles.length));
      const next = Math.max(0, Math.min(from + delta, displayArticles.length - 1));
      setFocusIdx(next);
      if (next !== from) {
        const a = displayArticles[next];
        if (a && store.expandedArticleUuid) store.setExpandedArticleUuid(a.uuid);
      }
    },
    [focusIdx, expandedIdx, displayArticles, store],
  );

  const focused = focusIdx === null ? undefined : displayArticles[focusIdx];

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
  useHotkeys("f", () => toggleStar(focused ?? null), [focused, toggleStar]);
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
    await Promise.all([mutate(), refreshCarrierCounts()]);
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
          nextArticle={displayArticles[expandedIdx + 1] ?? null}
          onOpenNext={openNextArticle}
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

  // 载体 tab：三档固定 + 邮件仅在真有邮件内容时出现（避免常驻一个永远为 0 的档）
  const carrierTabs: { key: CarrierFilter; label: string }[] = [
    { key: "all", label: t("fusion.filter.all") },
    { key: "text", label: t("fusion.filter.article") },
    { key: "audio", label: t("fusion.filter.podcast") },
    { key: "video", label: t("fusion.filter.video") },
    ...(carrierCounts.email > 0
      ? [{ key: "email" as CarrierFilter, label: t("fusion.filter.email") }]
      : []),
  ];

  const isFirstRun = (store.subscribes?.length ?? 0) === 0;
  const isClearQuiet =
    !isFirstRun &&
    isAll &&
    store.currentFilter.id === 1 &&
    carrierFilter === "all" &&
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
          {/* 返回行：退回订阅浏览（feeds.html 契约） */}
          <div className="fusion-fv-backrow">
            <Button
              variant="ghost"
              size="sm"
              icon={<ChevronLeft size={12} />}
              label={t("fusion.nav.subscriptions")}
              endContent={<Kbd keys="esc" />}
              onClick={() => navigate(RouteConfig.LOCAL_FEEDS)}
            />
            <span className="fusion-fv-backcount">
              {unreadCount} {t("fusion.nav.unread")}
            </span>
          </div>
          {/* 源头卡：源信息 / 统计健康 / 动作，可收起 */}
          {queueFeed && (
            <FeedProfile
              feed={queueFeed}
              total={total}
              syncing={queueSyncing}
              onSync={syncQueueFeed}
              onMarkAllRead={markQueueAllRead}
              onManage={() =>
                navigate(`${RouteConfig.SETTINGS}?tab=subscriptions`)}
            />
          )}

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
          </div>
        </>
      ) : (
        <>
          {/* 载体过滤条：全部 = 服务端真实总数；各档计数同为服务端（不随分页截断） */}
          <div className="fusion-strip">
            {carrierTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`fusion-tab ${carrierFilter === tab.key ? "on" : ""}`}
                onClick={() => setCarrierFilter(tab.key)}
              >
                {tab.label}
                <span className="c">
                  {tab.key === "all"
                    ? carrierCounts.text + carrierCounts.audio + carrierCounts.video + carrierCounts.email
                    : carrierCounts[tab.key]}
                </span>
              </button>
            ))}
            <span className="fusion-strip-meta">
              {t("fusion.strip.meta", { sources: sourceCount, time: lastSync })}
            </span>
            <span className="fusion-strip-acts">
              <IconButton
                size="sm"
                variant="ghost"
                icon={<RefreshCw size={14} className={store.globalSyncStatus ? "animate-spin" : ""} />}
                label={t("Sync All")}
                isDisabled={store.globalSyncStatus}
                onClick={() => {
                  store.syncAllArticles().finally(() => {
                    refreshCarrierCounts();
                    mutate();
                  });
                }}
              />
              {!isStarred && (
                <IconButton
                  size="sm"
                  variant="ghost"
                  icon={<CheckCheck size={14} />}
                  label={t("Mark all as read")}
                  onClick={markAllRead}
                />
              )}
            </span>
          </div>
        </>
      )}

      {/* 类型过滤已移服务端（kind 参数），列表与计数都是全量口径 */}
      <ArticleListVirtual
        articles={visibleArticles}
        title={title}
        type={type}
        feedUuid={feedUuid}
        total={total}
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
