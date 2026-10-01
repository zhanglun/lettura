import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Kbd } from "@astryxdesign/core/Kbd";
import { open } from "@tauri-apps/plugin-shell";
import dayjs from "dayjs";
import {
  CheckCheck,
  ChevronLeft,
  Clapperboard,
  FileText,
  Inbox,
  Mail,
  Podcast,
  RefreshCw,
  Star,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useTranslation } from "react-i18next";
import { useMatch, useNavigate, useParams } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { ArticleListVirtual } from "@/components/ArticleListVirtual";
import { BUCKET_ORDER } from "@/components/ArticleListVirtual/buckets";
import { ArticleDialogView } from "@/components/ArticleView/DialogView";
import type { ScrollBoxRefObject } from "@/components/ArticleView/ScrollBox";
import { FeedPrism } from "@/components/FeedPrism";
import { FeedProfile } from "@/components/FeedProfile";
import { RouteConfig } from "@/config";
import type { ArticleResItem, FeedResItem } from "@/db";
import { retainArticleAfterRead } from "@/helpers/articleHelpers";
import { showErrorToast } from "@/helpers/errorHandler";
import { apiGet, apiPost } from "@/helpers/http";
import { useQuery } from "@/helpers/parseXML";
import { toast } from "@/helpers/toast";
import { useArticle } from "@/hooks/useArticle";
import { View } from "@/layout/Article/View";
import { HK } from "@/shortcuts";
import { useAppStore } from "@/stores";
import { ArticleReadStatus, ArticleStarStatus } from "@/typing";
import { DEV_PREVIEW_FIRST_RUN, EmptyFace } from "./EmptyFace";

type CarrierFilter = "all" | "text" | "audio" | "video" | "email";

/** mutate 的恒等更新器：触发缓存重读（同步/全部已读后强制重验证） */
const identity = (pages: any) => pages;

export function ArticleView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [, type, queryFeedUuid] = useQuery();
  const params = useParams<{ uuid?: string; id?: string }>();
  const isArticleRoute = useMatch("/local/feeds/:uuid/articles/:id");

  const feedUuid = params.uuid ?? queryFeedUuid;

  const store = useAppStore(
    useShallow((state) => ({
      article: state.article,
      setArticle: state.setArticle,
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
      initCollectionMetas: state.initCollectionMetas,
      markArticleListAsRead: state.markArticleListAsRead,
      subscribes: state.subscribes,
      subscribesLoaded: state.subscribesLoaded,
      userConfig: state.userConfig,
    })),
  );

  // 源队列帧的过滤态（未读/全部，脱离全局 currentFilter）
  const [queueFilter, setQueueFilter] = useState<"unread" | "all">("unread");
  const [queueSyncing, setQueueSyncing] = useState(false);

  // 类型过滤（服务端过滤与计数，不与 read_status/currentFilter 混用）
  const [carrierFilter, setCarrierFilter] = useState<CarrierFilter>("all");
  /** 源棱镜的原地过滤：选中源后当前列表只看该源（不跳源详情路由） */
  const [sourceFilter, setSourceFilter] = useState<FeedResItem | null>(null);
  /** 详情滚动容器句柄：详情打开时 j/k 在这里滚动文章 */
  const detailScrollRef = useRef<ScrollBoxRefObject>(null);
  // 聚焦仅在交互（j/k）后建立：首行不再默认带选中洗色
  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  // 光标位建立但样式压住：首行接收焦点时不亮（见 moveFocus 的 establishing 分支），
  // 任何后续移动/换向都恢复正常焦点样式
  const [focusStyleSuppressed, setFocusStyleSuppressed] = useState(false);

  const {
    sections,
    total,
    carrierCounts,
    refreshCarrierCounts,
    isLoading,
    isEmpty,
    initialReady,
    error,
    retry,
    dayCounts,
    mutate,
    mutateBucket,
    isToday,
    isAll,
    isStarred,
  } = useArticle({
    feedUuid,
    type,
    // 载体过滤条（全部/文章/播客/视频[+邮件]）：服务端过滤，不随分页截断
    carrier: feedUuid ? undefined : carrierFilter,
    // 源队列帧：过滤条未读/全部，脱离全局 currentFilter（feeds.html 契约）
    readStatus: feedUuid ? (queueFilter === "unread" ? 1 : null) : undefined,
    // 源棱镜的原地过滤：只加 feed_uuid 条件，不切队列帧
    sourceUuid: sourceFilter?.uuid,
  });

  // 桶收起状态：父级持有（j/k 可达序列随收起过滤）。默认只展开第一个
  // 非空时间组、其余收起（2026-09-30 用户拍板，取代「全展开除更早」）——
  // 会话级不持久化（日期桶随时间漂移，持久化语义混乱）
  const [collapsedBuckets, setCollapsedBuckets] = useState<Set<string>>(
    () => new Set(BUCKET_ORDER),
  );
  // 默认展开态只应用一次：之后用户手动展开/收起不再干预
  const defaultExpandApplied = useRef(false);
  const toggleBucket = useCallback((bucket: string) => {
    setCollapsedBuckets((prev) => {
      const next = new Set(prev);
      if (next.has(bucket)) next.delete(bucket);
      else next.add(bucket);
      return next;
    });
  }, []);
  const loadMoreBucket = useCallback(
    (key: string) => {
      sections.find((s) => s.key === key)?.loadMore();
    },
    [sections],
  );

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
  // 键盘可达序列 = 各 section 可见行的串联（收起桶的行已不在 section.rows 里——
  // 父级统一过滤，与渲染严格一致）
  const displayArticles = useMemo(
    () => sections.flatMap((s) => s.rows),
    [sections],
  );

  useEffect(() => {
    setFocusIdx((i) =>
      i === null ? null : Math.min(i, Math.max(0, displayArticles.length - 1)),
    );
  }, [displayArticles.length]);

  // 队列身份任一变化 = 换了一个队列：键盘焦点清零。ArticleView 被路由表跨路由复用
  // （/local/all、/local/starred、源队列同一个组件），React 不卸载它——focusIdx 会
  // 活过视图切换，切回来时上次的高亮留在首行，看起来像「默认聚焦」（用户实测）。
  // 注意 esc 从详情回列表不走这里：同一队列，焦点跟随阅读位置是设计内行为。
  const queueIdentity = [
    feedUuid ?? "",
    sourceFilter?.uuid ?? "",
    isStarred ? "s" : "",
    isToday ? "t" : "",
    store.currentFilter.id,
    carrierFilter,
    queueFilter,
  ].join("|");
  useEffect(() => {
    setFocusIdx(null);
    setFocusStyleSuppressed(false);
  }, [queueIdentity]);

  // 换一个过滤口径（载体 tab / 源棱镜 / 队列帧）= 重新应用默认展开姿态：
  // 第一个非空时间组展开、其余收起（2026-09-30 用户拍板——切到视频/播客同样
  // 默认展开，不继承上一个口径的展开态）。同一口径内的计数刷新（单篇已读、
  // 防抖 refresh）不重排用户手动展开/收起，封印按口径记。
  // dayCounts 在 scoped 摘要未返回时为 undefined（useArticle 不退回全局口径），
  // 到位即应用；回到已访问过的口径时 SWR 缓存同步命中，随 identity 变化立即应用
  useEffect(() => {
    defaultExpandApplied.current = false;
  }, [queueIdentity]);
  useEffect(() => {
    if (defaultExpandApplied.current || !dayCounts) return;
    const order: readonly string[] = BUCKET_ORDER;
    const counts = dayCounts as unknown as Record<string, number>;
    const firstNonEmpty = order.find((b) => (counts[b] ?? 0) > 0) ?? "today";
    setCollapsedBuckets(new Set(order.filter((b) => b !== firstNonEmpty)));
    defaultExpandApplied.current = true;
  }, [queueIdentity, dayCounts]);

  // Deep-link：从 URL 恢复文章（面板内详情）
  useEffect(() => {
    if (!(isArticleRoute && params.id)) return;
    if (store.expandedArticleUuid === params.id) return;
    let cancelled = false;
    apiGet<any>(`/articles/${params.id!}`)
      .then((article) => {
        if (!cancelled && article) {
          store.setArticle(article);
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

  // 单篇状态变化（已读/星标等）统一走这里：写回列表缓存 + 防抖刷新载体计数。
  // 列表行 onArticleRead 与各处 onArticleUpdate 的处理本就一字不差，共用一份
  const applyArticleUpdate = useCallback(
    (updated: ArticleResItem) => {
      mutate((pages: any) => retainArticleAfterRead(pages, updated));
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
      // store 的动作引用稳定，经 getState() 取用可让回调不随 store 对象变化——
      // 否则 ArticleListVirtual 的 React.memo 每次任意字段更新都被击穿
      const { updateArticleStatus, setExpandedArticleUuid } =
        useAppStore.getState();
      if (a.read_status === ArticleReadStatus.UNREAD) {
        updateArticleStatus(a, ArticleReadStatus.READ);
        applyArticleUpdate({ ...a, read_status: ArticleReadStatus.READ });
      }
      setExpandedArticleUuid(a.uuid);
    },
    [applyArticleUpdate],
  );

  // 完读区「下一篇」卡：直接打开卡里那篇。旧实现走 moveFocus(1)，
  // 鼠标打开详情时 focusIdx 未建立 → 从 -1 起步落回列表顶部，
  // 看起来就是「点了下一篇却重开当前篇」的数据错乱
  const openNextArticle = useCallback(() => {
    const next = displayArticles[expandedIdx + 1] ?? null;
    if (!next) return;
    if (next.read_status === ArticleReadStatus.UNREAD) {
      const { updateArticleStatus, setExpandedArticleUuid } =
        useAppStore.getState();
      updateArticleStatus(next, ArticleReadStatus.READ);
      applyArticleUpdate({ ...next, read_status: ArticleReadStatus.READ });
      setExpandedArticleUuid(next.uuid);
    } else {
      useAppStore.getState().setExpandedArticleUuid(next.uuid);
    }
    setFocusIdx(expandedIdx + 1);
  }, [displayArticles, expandedIdx, applyArticleUpdate]);

  const closeDetail = useCallback(() => {
    useAppStore.getState().setExpandedArticleUuid(null);
    if (isArticleRoute) {
      navigate(feedUuid ? `/local/feeds/${feedUuid}` : "/local/all");
    }
  }, [isArticleRoute, feedUuid, navigate]);

  const moveFocus = useCallback(
    (delta: number) => {
      // 详情打开时从「正在阅读的文章」起走（点击打开不建立 focusIdx）；
      // 纯列表态维持原语义：未聚焦时 j 从头 / k 从尾开始。
      // 「未聚焦 + j」落在第 0 行 = 光标 establishment，不是移动——
      // 用户反馈（2026-09-29）：首行刚出现就带高亮读起来像「默认选中」。
      // 因此首行只画焦点环（j/k 光标位），不画行洗色；第二次 j 起才是真正的移动。
      const establishing = focusIdx === null && delta > 0;
      const { expandedArticleUuid, setExpandedArticleUuid } =
        useAppStore.getState();
      const from =
        expandedArticleUuid && expandedIdx >= 0
          ? expandedIdx
          : (focusIdx ?? (delta > 0 ? -1 : displayArticles.length));
      const next = Math.max(
        0,
        Math.min(from + delta, displayArticles.length - 1),
      );
      setFocusIdx(next);
      if (establishing && next === 0) {
        setFocusStyleSuppressed(true);
      } else {
        setFocusStyleSuppressed(false);
      }
      if (next !== from) {
        const a = displayArticles[next];
        if (a && expandedArticleUuid) setExpandedArticleUuid(a.uuid);
      }
    },
    [focusIdx, expandedIdx, displayArticles],
  );

  const focused = focusIdx === null ? undefined : displayArticles[focusIdx];

  const markFocusedRead = useCallback(() => {
    if (!focused || focused.read_status !== ArticleReadStatus.UNREAD) return;
    useAppStore.getState().updateArticleStatus(focused, ArticleReadStatus.READ);
    applyArticleUpdate({ ...focused, read_status: ArticleReadStatus.READ });
  }, [focused, applyArticleUpdate]);

  const toggleStar = useCallback(
    (a: ArticleResItem | null) => {
      if (!a) return;
      const next =
        a.starred === ArticleStarStatus.STARRED
          ? ArticleStarStatus.UNSTAR
          : ArticleStarStatus.STARRED;
      apiPost(`/articles/${a.uuid}/star`, { starred: next }).then(() => {
        applyArticleUpdate({ ...a, starred: next });
      });
    },
    [applyArticleUpdate],
  );

  // 键盘流：j/k 列表移动焦点、详情内滚动文章（到边即停）· ↑/↓ 切换上/下一篇 ·
  // ⏎/o 打开 · m 已读并下移 · ⇧M 上移 · f 星标 · v 浏览器 · esc 返回
  useHotkeys(HK.focusNext, () => {
    if (detailArticle) {
      detailScrollRef.current?.scrollByViewport(1);
      return;
    }
    moveFocus(1);
  }, [detailArticle, moveFocus]);
  useHotkeys(HK.focusPrev, () => {
    if (detailArticle) {
      detailScrollRef.current?.scrollByViewport(-1);
      return;
    }
    moveFocus(-1);
  }, [detailArticle, moveFocus]);
  // ↑/↓：列表移动焦点；详情内 = 上一篇/下一篇（j/k 让位给滚动）
  useHotkeys(HK.articleNext, () => moveFocus(1), [moveFocus]);
  useHotkeys(HK.articlePrev, () => moveFocus(-1), [moveFocus]);
  useHotkeys(HK.open, () => {
    if (focused) openArticle(focused);
  }, [focused, openArticle]);
  useHotkeys(HK.markRead, () => {
    markFocusedRead();
    moveFocus(1);
  }, [markFocusedRead, moveFocus]);
  useHotkeys(HK.markReadUp, () => {
    markFocusedRead();
    moveFocus(-1);
  }, [markFocusedRead, moveFocus]);
  useHotkeys(HK.star, () => toggleStar(focused ?? null), [focused, toggleStar]);
  useHotkeys(HK.openOriginal, () => {
    const article = detailArticle ?? focused;
    if (article?.link) open(article.link);
  }, [detailArticle, focused]);
  useHotkeys(HK.escape, () => {
    if (useAppStore.getState().playerMode === "full") return; // 沉浸页优先收回条
    if (store.expandedArticleUuid) {
      closeDetail();
    } else if (feedUuid) {
      // 源队列帧 → 订阅浏览帧（位置保留）
      navigate(RouteConfig.LOCAL_FEEDS);
    }
  }, [store, closeDetail, feedUuid, navigate]);

  // ── 源队列帧（feeds.html 契约）：源头栏 + 未读/全部过滤 ──
  const isQueueMode = !!feedUuid;

  // 空态分型（quiet empty 语言）：载体过滤空 → 类型图标 + 切回全部；
  // 源队列无未读 → 收尾语气 + 查看全部；星标空 → 键盘提示；其余 → 同步等待
  const listEmpty = useMemo(() => {
    if (!isQueueMode && carrierFilter !== "all") {
      const carrierIcon =
        carrierFilter === "text"
          ? FileText
          : carrierFilter === "audio"
            ? Podcast
            : carrierFilter === "video"
              ? Clapperboard
              : Mail;
      // 载体枚举名（text/audio）与 filter 键名（article/podcast）不同，显式映射
      const filterKey =
        carrierFilter === "text"
          ? "article"
          : carrierFilter === "audio"
            ? "podcast"
            : carrierFilter;
      return {
        icon: carrierIcon,
        title: t("fusion.empty.carrier_title", {
          type: t(`fusion.filter.${filterKey}`),
        }),
        hint: t("fusion.empty.carrier_hint"),
        action: (
          <Button
            variant="ghost"
            size="sm"
            label={t("fusion.empty.show_all")}
            onClick={() => setCarrierFilter("all")}
          />
        ),
      };
    }
    if (isQueueMode) {
      return queueFilter === "unread"
        ? {
            icon: CheckCheck,
            title: t("fusion.empty.queue_unread_title"),
            hint: t("fusion.empty.queue_unread_hint"),
            action: (
              <Button
                variant="ghost"
                size="sm"
                label={t("fusion.empty.show_all_articles")}
                onClick={() => setQueueFilter("all")}
              />
            ),
          }
        : {
            icon: Inbox,
            title: t("fusion.empty.queue_all_title"),
            hint: t("fusion.empty.queue_all_hint"),
          };
    }
    if (isStarred) {
      return {
        icon: Star,
        title: t("fusion.empty.starred_title"),
        hint: t("fusion.empty.starred_hint"),
      };
    }
    return {
      icon: Inbox,
      title: t("fusion.empty.default_title"),
      hint: t("fusion.empty.default_hint"),
    };
  }, [isQueueMode, carrierFilter, queueFilter, isStarred, t]);

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
    const { viewMeta, updateCollectionMeta, setViewMeta, getSubscribes } =
      useAppStore.getState();
    const before = viewMeta?.unread ?? queueFeed?.unread ?? 0;
    await apiPost("/mark-all-as-read", { uuid: feedUuid });
    if (before > 0) updateCollectionMeta(0, -before);
    setViewMeta({ ...useAppStore.getState().viewMeta, unread: 0 });
    await Promise.all([getSubscribes?.(), mutate(identity)]);
  }, [feedUuid, queueFeed, mutate]);

  const syncQueueFeed = useCallback(async () => {
    if (!queueFeed || queueSyncing) return;
    setQueueSyncing(true);
    try {
      const { syncArticles, getSubscribes } = useAppStore.getState();
      await syncArticles(queueFeed);
      await Promise.all([getSubscribes?.(), mutate(identity)]);
    } finally {
      setQueueSyncing(false);
    }
  }, [queueFeed, queueSyncing, mutate]);

  const [markingBucket, setMarkingBucket] = useState<string | null>(null);
  const markBucketRead = useCallback(
    async (dayBucket: string) => {
      if (markingBucket) return;
      setMarkingBucket(dayBucket);
      try {
        await apiPost("/mark-all-as-read", { day_bucket: dayBucket });
        const removeFromUnread =
          !isStarred &&
          useAppStore.getState().currentFilter.id === ArticleReadStatus.UNREAD;
        mutateBucket(dayBucket, (pages) =>
          pages.map((page) => ({
            ...page,
            list: removeFromUnread
              ? page.list.filter(
                  (article) => article.read_status !== ArticleReadStatus.UNREAD,
                )
              : page.list.map((article) => ({
                  ...article,
                  read_status: ArticleReadStatus.READ,
                })),
          })),
        );
        const { getSubscribes, initCollectionMetas } = useAppStore.getState();
        await Promise.all([
          getSubscribes?.(),
          initCollectionMetas?.(),
          refreshCarrierCounts(),
        ]);
        toast.success(
          t("fusion.list.mark_bucket_done", {
            bucket: t(`fusion.list.day_${dayBucket}`),
          }),
        );
      } catch (error) {
        showErrorToast(
          error,
          t("fusion.list.mark_bucket_failed", {
            bucket: t(`fusion.list.day_${dayBucket}`),
          }),
        );
      } finally {
        setMarkingBucket(null);
      }
    },
    [markingBucket, mutateBucket, refreshCarrierCounts, t],
  );

  const markAllRead = async () => {
    await store.markArticleListAsRead(isToday, isAll);
    await Promise.all([mutate(identity), refreshCarrierCounts()]);
  };

  const title = store.viewMeta?.title ?? "";
  const unreadCount =
    (feedUuid
      ? store.viewMeta?.unread
      : isToday
        ? store.collectionMeta.today.unread
        : isAll
          ? store.collectionMeta.total.unread
          : store.viewMeta?.unread) ?? 0;

  // 源队列未读过滤态：服务端 total 就是该源的真实未读数（read_status=1 查询，
  // 打开文章即重验证），比入场时的 viewMeta 快照准——快照只做加载期兜底
  const headerUnread =
    feedUuid && queueFilter === "unread"
      ? isLoading
        ? unreadCount
        : (total ?? unreadCount)
      : unreadCount;

  // 面板内替换：详情视图
  if (detailArticle) {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden">
        <View
          article={detailArticle}
          closable
          scrollRef={detailScrollRef}
          onClose={closeDetail}
          nextArticle={displayArticles[expandedIdx + 1] ?? null}
          onOpenNext={openNextArticle}
          onMarkBack={() => {
            markFocusedRead();
            closeDetail();
          }}
          onArticleUpdate={applyArticleUpdate}
        />
        <ArticleDialogView />
      </div>
    );
  }

  // 列表视图
  const sourceCount = (store.subscribes || []).reduce<number>(
    (sum, item) =>
      sum + (item.item_type === "folder" ? (item.children?.length ?? 0) : 1),
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

  // reload 闪空修复：boot 时 subscribes 是初始空数组，getSubscribes 异步落地——
  // 「还没加载」不能当「没有订阅」渲染首次运行引导
  const isFirstRun =
    DEV_PREVIEW_FIRST_RUN ||
    (store.subscribesLoaded === false
      ? false
      : (store.subscribes?.length ?? 0) === 0);
  const isClearQuiet =
    !isFirstRun &&
    isAll &&
    store.currentFilter.id === 1 &&
    carrierFilter === "all" &&
    isEmpty;

  if (isFirstRun || isClearQuiet) {
    return <EmptyFace mode={isFirstRun ? "first" : "clear"} />;
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
              {headerUnread} {t("fusion.nav.unread")}
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
                navigate(`${RouteConfig.SETTINGS}?tab=subscriptions`)
              }
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
              <span className="c">{headerUnread}</span>
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
          {/* 载体过滤条：全部 = 服务端真实总数；各档计数同为服务端（不随分页截断）。
              源棱镜挂在计数 tab 之后：点击弹出源清单（Popover），选源 = 未读流原地过滤
              （2026-09-30 二次改版，不再跳源详情） */}
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
                    ? carrierCounts.text +
                      carrierCounts.audio +
                      carrierCounts.video +
                      carrierCounts.email
                    : carrierCounts[tab.key]}
                </span>
              </button>
            ))}
            {!(isQueueMode || isStarred) && (
              <FeedPrism
                selectedUuid={sourceFilter?.uuid}
                onSelect={setSourceFilter}
              />
            )}
            <span className="fusion-strip-meta">
              {t("fusion.strip.meta", { sources: sourceCount, time: lastSync })}
            </span>
            <span className="fusion-strip-acts">
              <IconButton
                size="sm"
                variant="ghost"
                icon={
                  <RefreshCw
                    size={14}
                    className={store.globalSyncStatus ? "animate-spin" : ""}
                  />
                }
                label={t("Sync All")}
                isDisabled={store.globalSyncStatus}
                onClick={() => {
                  store.syncAllArticles().finally(() => {
                    refreshCarrierCounts();
                    mutate((pages: any) => pages);
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

      {/* 时间流：六桶 section（源队列帧 = 单段）；桶头计数来自 get_article_summary */}
      <ArticleListVirtual
        sections={sections}
        collapsedBuckets={collapsedBuckets}
        onToggleBucket={toggleBucket}
        onLoadMore={loadMoreBucket}
        onMarkBucketRead={markBucketRead}
        markingBucket={markingBucket}
        loading={isQueueMode ? isLoading : !initialReady}
        error={!!error}
        onRetry={retry}
        dayCounts={dayCounts as Record<string, number> | undefined}
        isEmpty={isEmpty}
        resetKey={queueIdentity}
        emptyIcon={listEmpty.icon}
        emptyTitle={listEmpty.title}
        emptyHint={listEmpty.hint}
        emptyAction={listEmpty.action}
        onArticleRead={applyArticleUpdate}
        onArticleUpdate={applyArticleUpdate}
        focusedUuid={focused?.uuid}
        focusStyleSuppressed={focusStyleSuppressed}
        onExpandArticle={openArticle}
      />
      <ArticleDialogView />
    </div>
  );
}
