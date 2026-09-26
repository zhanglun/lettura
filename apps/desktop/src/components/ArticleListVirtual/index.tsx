import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ArticleItem } from "../ArticleItem";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import type { ArticleResItem } from "@/db";
import { ArticleReadStatus } from "@/typing";
import { CheckCheck, ChevronDown, Snail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import * as dataAgent from "@/helpers/dataAgent";
import { toast } from "@/helpers/toast";
import {
  buildSegments,
  runUnreadCount,
  setRunExpanded,
  subscribeRunExpansion,
  getRunExpansionVersion,
  type RunSegment,
} from "./feedRuns";

export type ArticleListVirtualProps = {
  feedUuid?: string;
  type?: string;
  title: string | null;
  articles: ArticleResItem[];
  size: any;
  setSize: any;
  /** 服务端同条件全量总数（过滤条计数口径），列表足注对账用 */
  total?: number;
  isReachingEnd?: boolean;
  isEmpty: boolean;
  isLoading: boolean;
  onArticleRead?: (article: ArticleResItem) => void;
  onArticleUpdate?: (updated: ArticleResItem) => void;
  onExpandArticle?: (article: ArticleResItem) => void;
  focusedUuid?: string;
  sectionLabel?: string;
};

/** 段头：源身份 + 计数 + 规则线 + 悬停显影「全部已读」。
 *  「全部已读」是 feed 级动作（清掉该源的整个未读队列，不止已加载行）——
 *  有未读（行内或订阅表）才显示。可折叠段整行点击 = 展开/收起；不可折叠段头是静态标签 */
function RunHead({
  segment,
  flash,
  onMarkRead,
  onToggle,
}: {
  segment: RunSegment;
  flash: boolean;
  onMarkRead: (segment: RunSegment) => void;
  onToggle: (segment: RunSegment) => void;
}) {
  const { t } = useTranslation();
  const subscribes = useBearStore(useShallow((s) => s.subscribes));
  const { run, collapsible, collapsed } = segment;
  const first = run.articles[0];
  const toggle = () => onToggle(segment);
  const loadedUnread = run.articles.some(
    (a) => a.read_status === ArticleReadStatus.UNREAD,
  );
  const feedUnread =
    subscribes.find((f) => f.uuid === run.feedUuid)?.unread ?? 0;
  const hasUnread = loadedUnread || feedUnread > 0;

  const idNode = (
    <>
      {first.feed_logo && (
        <img className="fusion-run-ic" src={first.feed_logo} alt="" loading="lazy" />
      )}
      <span className="fusion-run-name">{first.feed_title}</span>
      <span className="fusion-run-count">
        {t("fusion.list.run_count", { count: run.articles.length })}
      </span>
    </>
  );

  return (
    <div
      className={`fusion-runhead${flash ? " is-flash" : ""}${
        collapsible ? " is-toggle" : ""
      }`}
      data-run-key={run.key}
      onClick={collapsible ? toggle : undefined}
    >
      {collapsible ? (
        <button
          type="button"
          className="fusion-run-id"
          title={collapsed ? t("fusion.list.run_more_btn") : t("fusion.list.run_less")}
          onClick={toggle}
        >
          {idNode}
        </button>
      ) : (
        <span className="fusion-run-id">{idNode}</span>
      )}
      {collapsible && (
        <span className={`fusion-run-chev${collapsed ? " is-closed" : ""}`}>
          <ChevronDown size={12} />
        </span>
      )}
      <span className="fusion-run-rule" />
      {hasUnread && (
        <button
          type="button"
          className="fusion-run-read"
          title={t("fusion.list.run_mark_read_title", { feed: first.feed_title })}
          onClick={(e) => {
            e.stopPropagation();
            onMarkRead(segment);
          }}
        >
          <CheckCheck size={12} />
          {t("fusion.list.run_mark_read")}
        </button>
      )}
    </div>
  );
}

/** 队列索引条：当前队列里的同源段一览（chips），点击展开并跳到该段——不用滚动找 feed */
function RunIndex({
  segments,
  onJump,
}: {
  segments: RunSegment[];
  onJump: (segment: RunSegment) => void;
}) {
  const { t } = useTranslation();
  const heads = segments.filter((s) => s.head);
  if (heads.length < 2) return null;
  return (
    <div className="fusion-runindex">
      <div className="fusion-runindex-in">
        {heads.map((seg) => {
          const first = seg.run.articles[0];
          const unread = runUnreadCount(seg.run);
          return (
            <button
              key={seg.run.key}
              type="button"
              className={`fusion-runchip${unread === 0 ? " is-muted" : ""}`}
              title={first.feed_title}
              onClick={() => onJump(seg)}
            >
              {first.feed_logo && (
                <img src={first.feed_logo} alt="" loading="lazy" />
              )}
              <span className="nm">{first.feed_title}</span>
              <span className={`c${unread > 0 ? " has-unread" : ""}`}>
                {unread}
              </span>
            </button>
          );
        })}
      </div>
      <span className="fusion-runindex-hint">{t("fusion.list.run_index_hint")}</span>
    </div>
  );
}

export const ArticleListVirtual = React.memo(function ArticleListVirtual(
  props: ArticleListVirtualProps,
) {
  const {
    articles,
    feedUuid,
    isEmpty,
    isLoading,
    isReachingEnd,
    size,
    setSize,
    total,
    onArticleRead,
    onArticleUpdate,
    onExpandArticle,
    focusedUuid,
    sectionLabel,
  } = props;
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [flashUuid, setFlashUuid] = useState<string | null>(null);
  // 折叠展开是模块级会话状态：订阅版本号让折叠/展开即时重渲染
  const expansionVersion = useSyncExternalStore(
    subscribeRunExpansion,
    getRunExpansionVersion,
  );
  /** 已据此 size 请求过下一页：代替 1s 时间冷却（时间冷却会把“停住不动”的续加载卡成必须再动一下） */
  const requestedSizeRef = useRef(-1);

  // 源队列帧整屏同源，段头/索引/折叠都是噪音；只有跨源队列（全部/星标/历史）分组
  const segments = useMemo(
    () => (feedUuid ? null : buildSegments(articles)),
    [feedUuid, articles],
  );

  // feed 级一次落库（服务端 mark_as_read 单条 SQL）：组头「全部已读」清的是该源的
  // 整个未读队列——只标已加载的十几条，对有几百条历史未读的源没有意义（用户实测的
  // 「刷新后组里还有数据」就是它）。本地 retain 已加载行 + 全局未读按 feed 全量扣减 +
  // toast 报实际数量 + 刷新订阅未读徽标。
  const markRunRead = async (segment: RunSegment) => {
    const { run } = segment;
    const first = run.articles[0];
    const feed = useBearStore
      .getState()
      .subscribes.find((f) => f.uuid === run.feedUuid);
    const feedUnread = feed?.unread ?? 0;

    await dataAgent.markAllRead({ uuid: run.feedUuid });

    for (const article of run.articles) {
      if (article.read_status === ArticleReadStatus.UNREAD) {
        onArticleRead?.({ ...article, read_status: ArticleReadStatus.READ });
      }
    }
    if (feedUnread > 0) {
      useBearStore.getState().updateCollectionMeta(0, -feedUnread);
      toast.success(
        t("fusion.list.run_marked_toast", {
          feed: first.feed_title,
          count: feedUnread,
        }),
      );
    }
    useBearStore.getState().getSubscribes();
  };

  const toggleRun = (segment: RunSegment) => {
    setRunExpanded(segment.run.feedUuid, segment.collapsed);
  };

  const jumpToRun = (segment: RunSegment) => {
    if (segment.collapsed) setRunExpanded(segment.run.feedUuid, true);
    setFlashUuid(segment.run.key);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    // 闪光要盖过远距离平滑滚动的时长（~1s+），落地时仍在高亮
    flashTimer.current = setTimeout(() => setFlashUuid(null), 1800);
    // 段头无论如何都在 DOM 里，无需等展开重渲染；展开记忆按 feed，定位按段
    containerRef.current
      ?.querySelector(`[data-run-key="${segment.run.key}"]`)
      ?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  // 键盘焦点行滚动到可视区
  useEffect(() => {
    if (!(focusedUuid && containerRef.current)) return;
    const el = containerRef.current.querySelector(
      `[data-item-uuid="${focusedUuid}"]`,
    ) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [focusedUuid]);

  // 触底加载：判定基于**内容**高度（扣掉给悬浮条留的 `--fusion-player-inset` 让位空白），
  // 否则空白会被算进 scrollHeight，阈值就落到空白里——看到最后一行时还不加载。
  // 防抖用 size 门闩（不用时间冷却）：时间冷却会把“滚到底停住”的续加载卡成必须再动一下。
  // auto=false：用户滚动触底（0.9 阈值）；auto=true：布局变化后的补载——只在「根本没有
  // 滚动条」时触发（按源折叠会让内容比视口矮，scroll 事件永远不来，无限加载就死在第一页），
  // 内容一旦可滚即停，交给用户滚动。
  const autoLoadBudgetRef = useRef(0);
  const evaluateLoadMore = useCallback(
    (auto: boolean) => {
      const container = containerRef.current;
      if (!container) return;

      const inset =
        parseFloat(
          getComputedStyle(container).getPropertyValue("--fusion-player-inset"),
        ) || 0;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const contentHeight = Math.max(1, scrollHeight - inset);
      const notScrollable = scrollHeight <= clientHeight + 1;
      const atBottom = (scrollTop + clientHeight) / contentHeight > 0.9;
      // auto 用 notScrollable || atBottom：内容恰好压着视口（scrollHeight≈clientHeight）
      // 时 notScrollable 会差 1px 误判，atBottom 能兜住；失控由预算封顶
      const shouldLoad = auto ? notScrollable || atBottom : atBottom;

      if (!shouldLoad) {        autoLoadBudgetRef.current = 0;
        return;
      }
      if (isReachingEnd || isLoading || requestedSizeRef.current === size) return;
      // 预算兜底：极少数病态队列（后续页全部并入已折叠组，高度零增长）会永远
      // 不可滚，连续自动补载到上限就停，足注如实显示已加载数
      if (auto && autoLoadBudgetRef.current >= 20) return;
      if (auto) autoLoadBudgetRef.current += 1;
      requestedSizeRef.current = size;
      setSize(size + 1);
    },
    [isReachingEnd, isLoading, size, setSize],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => evaluateLoadMore(false);
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [evaluateLoadMore]);

  // 过滤切换会把 size 重置回 1（useArticle）：门闩与预算都是按旧视图记的，
  // size 回退即一并归位，否则新视图的自动补载被「已请求过 size+1」「预算耗尽」的旧账挡死
  const lastSizeRef = useRef(size);
  useEffect(() => {
    if (size < lastSizeRef.current) {
      requestedSizeRef.current = -1;
      autoLoadBudgetRef.current = 0;
    }
    lastSizeRef.current = size;
  }, [size]);

  // 布局变化（首屏/展开收起/新页到达）后补一次判定，否则「列表不足一屏」时续载链条断掉
  useEffect(() => {
    evaluateLoadMore(true);
  }, [evaluateLoadMore, articles, expansionVersion]);

  const renderRow = (article: ArticleResItem, key: string) => (
    <div key={key} data-item-uuid={article.uuid}>
      <ArticleItem
        article={article}
        focused={focusedUuid === article.uuid}
        onRead={onArticleRead}
        onExpand={onExpandArticle}
        onUpdate={(patch) => onArticleUpdate?.({ ...article, ...patch })}
      />
    </div>
  );

  const renderSegment = (seg: RunSegment, runIdx: number) => {
    const nodes: React.ReactNode[] = [];
    const base = runIdx * 10000;
    if (seg.head) {
      nodes.push(
        <RunHead
          key={`head-${seg.run.feedUuid}`}
          segment={seg}
          flash={flashUuid === seg.run.key}
          onMarkRead={markRunRead}
          onToggle={toggleRun}
        />,
      );
    }
    const rows = seg.collapsed
      ? seg.run.articles.slice(0, 3)
      : seg.run.articles;
    rows.forEach((a, i) => nodes.push(renderRow(a, `${base}-${i}-${a.uuid}`)));
    if (seg.collapsible) {
      const hidden = seg.run.articles.length - rows.length;
      nodes.push(
        <button
          key={`more-${seg.run.feedUuid}`}
          type="button"
          className="fusion-runmore"
          onClick={() => toggleRun(seg)}
        >
          <ChevronDown size={12} className={seg.collapsed ? "" : "is-open"} />
          {seg.collapsed
            ? t("fusion.list.run_more", { count: hidden })
            : t("fusion.list.run_less")}
        </button>,
      );
    }
    return nodes;
  };

  return (
    <div
      ref={containerRef}
      className={`w-full flex-1 min-h-0 overflow-y-auto scrollbar-gutter${
        isEmpty ? "" : " fusion-inset-tail"
      }`}
    >
      {isEmpty ? (
        <div className="flex flex-col justify-center items-center gap-1 text-[var(--fusion-ter)] min-h-full py-20">
          <Snail size={34} strokeWidth={1} />
          <p>{t("Yay, no matching items.")}</p>
        </div>
      ) : (
        <div>
          {sectionLabel && (
            <div className="art-section-label">{sectionLabel}</div>
          )}
          {segments ? (
            <>
              <RunIndex segments={segments} onJump={jumpToRun} />
              {segments.flatMap((seg, runIdx) => renderSegment(seg, runIdx))}
            </>
          ) : (
            articles.map((a, i) => renderRow(a, `flat-${i}-${a.uuid}`))
          )}
        </div>
      )}
      {isLoading && (
        <div className="p-2 pl-6 grid gap-1 relative shrink-0">
          <Skeleton height={20} />
          <div>
            <Skeleton height={12} />
          </div>
          <div>
            <Skeleton height={12} />
          </div>
          <div className="flex justify-between">
            <Skeleton height={12} width={128} />
            <Skeleton height={12} width={64} />
          </div>
        </div>
      )}
      {/* 足注对账：strip 计数是全量口径，列表是懒加载+按源折叠摘要，这里把两者接起来 */}
      {!isEmpty && articles.length > 0 && total != null && (
        <div className="fusion-list-foot">
          {isReachingEnd
            ? t("fusion.list.loaded_all", { total })
            : t("fusion.list.loaded_of", { loaded: articles.length, total })}
        </div>
      )}
    </div>
  );
});

export default ArticleListVirtual;
