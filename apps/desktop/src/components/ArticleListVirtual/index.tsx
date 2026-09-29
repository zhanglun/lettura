import React, { useEffect, useRef } from "react";
import { ArticleItem } from "../ArticleItem";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import type { LucideIcon } from "lucide-react";
import { ChevronDown, SearchX } from "lucide-react";
import type { ArticleResItem } from "@/db";
import { useTranslation } from "react-i18next";
import { QuietEmpty } from "@/components/QuietEmpty";
import type { ListSection } from "@/hooks/useArticle";
export type ArticleListVirtualProps = {
  /** 每桶一个 section（源队列帧 = 单个 bucket:null 的 section） */
  sections: ListSection[];
  /** 收起的桶（父级持有；行已由父级过滤，这里只负责头形态与哨兵抑制） */
  collapsedBuckets: Set<string>;
  onToggleBucket: (bucket: string) => void;
  onLoadMore: (key: string) => void;
  /** 桶真实分布（get_article_summary）；缺省回落 section.realCount/loaded */
  dayCounts?: Record<string, number>;
  isEmpty: boolean;
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
}: {
  bucket: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
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
    dayCounts,
    isEmpty,
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
      {isEmpty ? (
        <div className="flex flex-col justify-center min-h-full">
          <QuietEmpty
            icon={emptyIcon ?? SearchX}
            title={emptyTitle ?? t("fusion.empty.default_title")}
            hint={emptyHint ?? t("fusion.empty.default_hint")}
            action={emptyAction}
          />
        </div>
      ) : (
        sections.map((section) => {
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
              onToggleBucket={onToggleBucket}
              onLoadMore={onLoadMore}
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
  onToggleBucket,
  onLoadMore,
  renderRow,
}: {
  section: ListSection;
  collapsed: boolean;
  realCount?: number;
  visibleRows: ArticleResItem[];
  onToggleBucket: (bucket: string) => void;
  onLoadMore: (key: string) => void;
  renderRow: (a: ArticleResItem, key: string) => React.ReactNode;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  // 防抖门闩：同一次 hasMore 生命周期内只发起一次续载（新页到位后解除）
  const requestedRef = useRef(false);

  // 哨兵：滚动接近桶尾（400px 预读）→ 续载本桶
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const check = () => {
      if (collapsed || !section.hasMore || section.loading) return;
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

  // 展开一个还没有任何数据的桶：自动首拉
  useEffect(() => {
    if (
      !collapsed &&
      section.loaded === 0 &&
      section.hasMore &&
      !section.loading
    ) {
      onLoadMore(section.key);
    }
  }, [collapsed, section.loaded, section.hasMore, section.loading, section.key, onLoadMore]);

  const showSkeleton = !collapsed && section.loading;

  return (
    <div data-day-bucket={section.bucket ?? undefined}>
      {section.bucket != null && (
        <DayHead
          bucket={section.bucket}
          count={realCount ?? section.loaded}
          collapsed={collapsed}
          onToggle={() => onToggleBucket(section.bucket!)}
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
      {!collapsed && section.loaded > 0 && (
        <SectionFoot
          loaded={section.loaded}
          realCount={section.bucket != null ? realCount : section.realCount}
          loading={section.loading}
        />
      )}
    </div>
  );
});

export default ArticleListVirtual;
