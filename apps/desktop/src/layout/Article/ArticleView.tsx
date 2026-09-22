import { useCallback, useEffect, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate, useParams, useMatch } from "react-router-dom";
import { CheckCheck, RefreshCw } from "lucide-react";
import dayjs from "dayjs";
import { ArticleListVirtual } from "@/components/ArticleListVirtual";
import { ArticleDialogView } from "@/components/ArticleView/DialogView";
import { View } from "@/layout/Article/View";
import { open } from "@tauri-apps/plugin-shell";
import { useQuery } from "@/helpers/parseXML";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { request } from "@/helpers/request";
import { useArticle } from "@/hooks/useArticle";
import { retainArticleAfterRead } from "@/helpers/articleHelpers";
import { getArticleKind } from "@/helpers/articleKind";
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
      globalSyncStatus: state.globalSyncStatus,
      syncAllArticles: state.syncAllArticles,
      markArticleListAsRead: state.markArticleListAsRead,
      setHasMorePrev: state.setHasMorePrev,
      setHasMoreNext: state.setHasMoreNext,
      subscribes: state.subscribes,
      userConfig: state.userConfig,
    })),
  );

  const {
    articles,
    isLoading,
    size,
    setSize,
    isEmpty,
    isReachingEnd,
    mutate,
    isToday,
    isAll,
  } = useArticle({ feedUuid, type });

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

  useEffect(() => {
    store.setHasMorePrev(expandedIdx > 0);
    store.setHasMoreNext(expandedIdx >= 0 && expandedIdx < visibleArticles.length - 1);
  }, [expandedIdx, visibleArticles.length]);

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
  useHotkeys("shift+m", () => {
    if (focused && focused.read_status === ArticleReadStatus.READ) {
      store.updateArticleStatus(focused, ArticleReadStatus.UNREAD);
      handleArticleUpdate({ ...focused, read_status: ArticleReadStatus.UNREAD });
    }
  }, [focused, store, handleArticleUpdate]);
  useHotkeys("f", () => toggleStar(focused), [focused, toggleStar]);
  useHotkeys("v", () => {
    if (focused?.link) open(focused.link);
  }, [focused]);
  useHotkeys("escape", () => {
    if (store.expandedArticleUuid) closeDetail();
  }, [store, closeDetail]);

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
  const activeFilterTitle = t(store.currentFilter.title);
  const sectionLabel = t("article.section_label", {
    filter: activeFilterTitle,
    count: visibleArticles.length,
  });

  // 面板内替换：详情视图
  if (detailArticle) {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden">
        <View
          article={detailArticle}
          closable
          onClose={closeDetail}
          goPrev={expandedIdx > 0 ? () => moveFocus(-1) : undefined}
          goNext={
            expandedIdx < visibleArticles.length - 1 ? () => moveFocus(1) : undefined
          }
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

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* 视图头：标题 + 计数 + 动作 */}
      <div className="flex items-center justify-between gap-2 px-5 h-11 border-b border-[var(--gray-4)] flex-shrink-0">
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--gray-9)] min-w-0">
          <span className="text-[13px] font-semibold text-[var(--gray-12)] truncate">
            {title}
          </span>
          {unreadCount > 0 && (
            <span>{t("article.list_unread_count", { count: unreadCount })}</span>
          )}
          <span>{t("article.list_loaded_count", { count: visibleArticles.length })}</span>
          <span className="text-[var(--gray-7)]">·</span>
          <span>{t("article.current_filter")}</span>
          <span className="text-[var(--gray-11)]">{activeFilterTitle}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => store.syncAllArticles()}
            disabled={store.globalSyncStatus}
            className="flex items-center justify-center w-7 h-7 text-[var(--gray-9)] hover:text-[var(--gray-12)] hover:bg-[var(--gray-a3)] rounded-md transition-colors disabled:opacity-50"
            title={t("Sync All")}
            aria-label={t("Sync All")}
          >
            <RefreshCw
              size={13}
              className={store.globalSyncStatus ? "animate-spin" : ""}
            />
          </button>
          <button
            type="button"
            onClick={markAllRead}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-[var(--gray-9)] hover:text-[var(--gray-12)] hover:bg-[var(--gray-a3)] rounded-md transition-colors"
          >
            <CheckCheck size={12} />
            {t("Mark all as read")}
          </button>
        </div>
      </div>

      {/* 类型过滤条 */}
      <div className="fusion-strip">
        {kindTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`fusion-tab ${kindFilter === tab.key ? "on" : ""}`}
            onClick={() => setKindFilter(tab.key)}
          >
            {tab.label}
            <span className="c">{kindCounts[tab.key]}</span>
          </button>
        ))}
        <span className="fusion-strip-meta">
          {t("fusion.strip.meta", { sources: sourceCount, time: lastSync })}
        </span>
      </div>

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
        onCloseInlineReader={closeDetail}
        sectionLabel={sectionLabel}
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
