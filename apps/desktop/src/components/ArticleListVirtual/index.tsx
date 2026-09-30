import { Skeleton } from "@astryxdesign/core/Skeleton";
import type { LucideIcon } from "lucide-react";
import { CheckCheck, ChevronDown, Loader2, SearchX } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { QuietEmpty } from "@/components/QuietEmpty";
import type { ArticleResItem } from "@/db";
import type { ListSection } from "@/hooks/useArticle";
import { ArticleItem } from "../ArticleItem";
export type ArticleListVirtualProps = {
  /** 每桶一个 section（源队列帧 = 单个 bucket:null 的 section） */
  sections: ListSection[];
  /** 收起的桶（父级持有；行已由父级过滤，这里只负责头形态与哨兵抑制） */
  collapsedBuckets: Set<string>;
  onToggleBucket: (bucket: string) => void;
  onLoadMore: (key: string) => void;
  onMarkBucketRead?: (bucket: string) => void;
  markingBucket?: string | null;
  /** 桶真实分布（get_article_summary）；缺省回落 section.realCount/loaded */
  dayCounts?: Record<string, number>;
  isEmpty: boolean;
  loading?: boolean;
  /** 队列身份键：变化 = 换了一个队列，滚动归零（与键盘焦点清零同契约） */
  resetKey?: string;
  error?: boolean;
  onRetry?: () => void;
  /** 空态分型（由父级按上下文给出）：图标 / 标题 / 提示 / 恢复动作 */
  emptyIcon?: LucideIcon;
  emptyTitle?: React.ReactNode;
  emptyHint?: React.ReactNode;
  emptyAction?: React.ReactNode;
  onArticleRead?: (article: ArticleResItem) => void;
  onArticleUpdate?: (updated: ArticleResItem) => void;
  onExpandArticle?: (article: ArticleResItem) => void;
  focusedUuid?: string;
  /** 光标位已建立但压住焦点样式（首次 j 落首行 = 建立而非移动，见 ArticleView.moveFocus） */
  focusStyleSuppressed?: boolean;
};

/** 日期分隔条（list-prism.html 契约）：吸顶、规则线、桶内计数（服务端真实总量）。
 *  整行可点 = 收起/展开该桶；全部桶一致可收，「更早」积压区默认收起（父级默认态） */
function DayHead({
  bucket,
  count,
  collapsed,
  onToggle,
  onMarkAllRead,
  canMarkAllRead,
  markingAllRead,
}: {
  bucket: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  onMarkAllRead?: () => void;
  canMarkAllRead?: boolean;
  markingAllRead?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="fusion-dayhead is-toggle"
      data-day-bucket={bucket}
      onClick={onToggle}
      role="button"
      aria-expanded={!collapsed}
    >
      <span className={`chev${collapsed ? " is-closed" : ""}`}>
        <ChevronDown size={11} />
      </span>
      <span className="lb">{t(`fusion.list.day_${bucket}`)}</span>
      <span className="rule" />
      <span className="n">
        {collapsed
          ? t("fusion.list.day_collapsed_count", { count })
          : t("fusion.list.day_count", { count })}
      </span>
      {onMarkAllRead && canMarkAllRead && (
        <button
          type="button"
          className="fusion-dayhead-read"
          aria-label={t("fusion.list.mark_bucket_read", {
            bucket: t(`fusion.list.day_${bucket}`),
          })}
          title={t("fusion.list.mark_bucket_read", {
            bucket: t(`fusion.list.day_${bucket}`),
          })}
          disabled={markingAllRead}
          onClick={(event) => {
            event.stopPropagation();
            onMarkAllRead();
          }}
        >
          {markingAllRead ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <CheckCheck size={13} />
          )}
        </button>
      )}
    </div>
  );
}

/** 桶尾状态行：加载中转圈 → 计数对账（已加载 / 真实总量）→ 全部显示 */
function SectionFoot({
  loaded,
  realCount,
  loading,
}: {
  loaded: number;
  realCount?: number;
  loading: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className={`fusion-list-foot${loading ? " is-loading" : ""}`}>
      {loading ? (
        <>
          <span className="fusion-foot-spin" />
          {t("fusion.list.loading_more")}
        </>
      ) : realCount == null ? (
        t("fusion.list.loaded_count", { count: loaded })
      ) : realCount > loaded ? (
        t("fusion.list.loaded_of", { loaded, total: realCount })
      ) : (
        t("fusion.list.loaded_all", { total: realCount })
      )}
    </div>
  );
}

export const ArticleListVirtual = React.memo(function ArticleListVirtual(
  props: ArticleListVirtualProps,
) {
  const {
    sections,
    collapsedBuckets,
    onToggleBucket,
    onLoadMore,
    onMarkBucketRead,
    markingBucket,
    dayCounts,
    isEmpty,
    loading = false,
    resetKey,
    error = false,
    onRetry,
    emptyIcon,
    emptyTitle,
    emptyHint,
    emptyAction,
    onArticleRead,
    onArticleUpdate,
    onExpandArticle,
    focusedUuid,
    focusStyleSuppressed,
  } = props;
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  // 键盘焦点行滚动到可视区
  useEffect(() => {
    if (!(focusedUuid && containerRef.current)) return;
    const el = containerRef.current.querySelector(
      `[data-item-uuid="${focusedUuid}"]`,
    ) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [focusedUuid]);

  // 队列身份变化（切载体/源/未读全部/换源）= 换了一个队列：滚动归零。
  // 分页加载不改 resetKey，不触发；esc 从详情回列表身份未变，位置保留
  const skipResetRef = useRef(true);
  useEffect(() => {
    if (skipResetRef.current) {
      skipResetRef.current = false;
      return;
    }
    containerRef.current?.scrollTo({ top: 0 });
  }, [resetKey]);

  const renderRow = (article: ArticleResItem, key: string) => (
    <div key={key} data-item-uuid={article.uuid}>
      <ArticleItem
        article={article}
        focused={focusedUuid === article.uuid && !focusStyleSuppressed}
        onRead={onArticleRead}
        onExpand={onExpandArticle}
        onUpdate={(patch) => onArticleUpdate?.({ ...article, ...patch })}
      />
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`w-full flex-1 min-h-0 overflow-y-auto scrollbar-gutter${
        isEmpty ? "" : " fusion-inset-tail"
      }`}
    >
      {loading ? (
        <div
          className="fusion-list-skeleton"
          aria-busy="true"
          aria-label={t("fusion.list.loading")}
        >
          {Array.from({ length: 5 }, (_, index) => (
            <div className="fusion-list-skeleton-row" key={index}>
              <Skeleton height={6} width={6} />
              <Skeleton height={43} width={76} />
              <div className="fusion-list-skeleton-copy">
                <Skeleton height={13} />
                <Skeleton height={10} width={180} />
              </div>
              <Skeleton height={10} width={72} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col justify-center min-h-full">
          <QuietEmpty
            icon={SearchX}
            title={t("fusion.list.load_failed")}
            hint={t("fusion.list.load_failed_hint")}
            action={
              onRetry ? (
                <button
                  type="button"
                  className="fusion-list-retry"
                  onClick={onRetry}
                >
                  {t("fusion.list.retry")}
                </button>
              ) : undefined
            }
          />
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col justify-center min-h-full">
          <QuietEmpty
            icon={emptyIcon ?? SearchX}
            title={emptyTitle ?? t("fusion.empty.default_title")}
            hint={emptyHint ?? t("fusion.empty.default_hint")}
            action={emptyAction}
          />
        </div>
      ) : (
        sections.map((section, index) => {
          const collapsed =
            section.bucket != null && collapsedBuckets.has(section.bucket);
          const realCount =
            section.bucket != null
              ? (dayCounts?.[section.bucket] ?? section.realCount)
              : section.realCount;
          // 计数已知为 0 的桶不渲染（切载体 tab 后日期头跟随当前口径，
          // 没有内容的桶不再挂一个「0 篇」的空头）
          if (section.bucket != null && realCount != null && realCount === 0) {
            return null;
          }
          const visibleRows = collapsed ? [] : section.rows;
          return (
            <SectionBlock
              key={section.key}
              section={section}
              collapsed={collapsed}
              realCount={realCount}
              visibleRows={visibleRows}
              isTerminal={index === sections.length - 1}
              onToggleBucket={onToggleBucket}
              onLoadMore={onLoadMore}
              onMarkBucketRead={onMarkBucketRead}
              markingBucket={markingBucket}
              renderRow={renderRow}
            />
          );
        })
      )}
    </div>
  );
});

/** 单桶区块：头 + 行 + 尾哨兵。桶内独立 loop——滚近桶尾续载本桶下一页，
 *  本桶拉完即停（下一桶有自己的通道）；展开空桶自动首拉 */
const SectionBlock = React.memo(function SectionBlock({
  section,
  collapsed,
  realCount,
  visibleRows,
  isTerminal,
  onToggleBucket,
  onLoadMore,
  onMarkBucketRead,
  markingBucket,
  renderRow,
}: {
  onMarkBucketRead?: (bucket: string) => void;
  markingBucket?: string | null;
  section: ListSection;
  collapsed: boolean;
  realCount?: number;
  visibleRows: ArticleResItem[];
  /** 队列最后一个 section：满载时保留一句收尾对账，其余满载桶静默 */
  isTerminal?: boolean;
  onToggleBucket: (bucket: string) => void;
  onLoadMore: (key: string) => void;
  renderRow: (a: ArticleResItem, key: string) => React.ReactNode;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  // 防抖门闩：同一次 hasMore 生命周期内只发起一次续载（新页到位后解除）
  const requestedRef = useRef(false);
  const footRealCount = section.bucket != null ? realCount : section.realCount;
  const footShow = Boolean(
    section.loading ||
      isTerminal ||
      (footRealCount != null && footRealCount > section.loaded),
  );

  // 哨兵：滚动接近桶尾（400px 预读）→ 续载本桶
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const check = () => {
      // Empty bucket sentinels all start in the viewport; do not let them
      // trigger six requests. An unloaded bucket is opened explicitly below.
      if (
        collapsed ||
        section.loaded === 0 ||
        !section.hasMore ||
        section.loading
      )
        return;
      if (requestedRef.current) return;
      const rect = sentinel.getBoundingClientRect();
      if (rect.top < window.innerHeight + 400) {
        requestedRef.current = true;
        onLoadMore(section.key);
      }
    };
    check();
    const container = sentinel.closest(".overflow-y-auto");
    container?.addEventListener("scroll", check, { passive: true });
    return () => container?.removeEventListener("scroll", check);
  }, [collapsed, section.hasMore, section.loading, section.key, onLoadMore]);

  useEffect(() => {
    if (!section.loading) requestedRef.current = false;
  }, [section.loading, section.rows.length]);

  const showSkeleton = !collapsed && section.loading;

  return (
    <div data-day-bucket={section.bucket ?? undefined}>
      {section.bucket != null && (
        <DayHead
          bucket={section.bucket}
          count={realCount ?? section.loaded}
          collapsed={collapsed}
          onToggle={() => {
            const opening = collapsed;
            onToggleBucket(section.bucket!);
            if (opening && section.loaded === 0) onLoadMore(section.key);
          }}
          onMarkAllRead={
            onMarkBucketRead
              ? () => onMarkBucketRead(section.bucket!)
              : undefined
          }
          canMarkAllRead={section.rows.some((a) => a.read_status === 1)}
          markingAllRead={markingBucket === section.bucket}
        />
      )}
      {visibleRows.map((a, i) => renderRow(a, `${section.key}-${i}-${a.uuid}`))}
      {showSkeleton && (
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
      <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />
      {/* 足注只讲有用的话：加载中（spinner）/ 已截断（对账）/ 队列末尾（收尾）。
          满载的中间桶不再重复「已全部显示」——组头计数已经是同一句话（2026-09-30） */}
      {!collapsed && section.loaded > 0 && footShow && (
        <SectionFoot
          loaded={section.loaded}
          realCount={footRealCount}
          loading={section.loading}
        />
      )}
    </div>
  );
});

export default ArticleListVirtual;
