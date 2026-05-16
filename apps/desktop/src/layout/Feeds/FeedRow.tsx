import React from "react";
import { GripVertical, RefreshCw, Trash2 } from "lucide-react";
import type { FeedResItem } from "@/db";

interface FeedRowProps {
  feed: FeedResItem;
  onClick: (feed: FeedResItem) => void;
  onContextMenu: (e: React.MouseEvent, feed: FeedResItem) => void;
  onSync: (feed: FeedResItem) => void;
  onDelete: (feed: FeedResItem) => void;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function getHealthColor(status: number | undefined): string {
  switch (status) {
    case 1:
      return "bg-amber-500";
    case 2:
      return "bg-red-500";
    default:
      return "bg-green-500";
  }
}

function getIntelBadge(title: string): { emoji: string; label: string } | null {
  if (title === "Hacker News") return { emoji: "\uD83D\uDD25", label: "高频信号" };
  if (title === "TechCrunch") return { emoji: "\uD83D\uDCCA", label: "证据源" };
  return null;
}

function formatSyncTime(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d`;
}

export const FeedRow = React.memo(function FeedRow({
  feed,
  onClick,
  onContextMenu,
  onSync,
  onDelete,
}: FeedRowProps) {
  const intelBadge = getIntelBadge(feed.title);

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--accent-light)] cursor-pointer group transition-colors"
      onClick={() => onClick(feed)}
      onContextMenu={(e) => onContextMenu(e, feed)}
    >
      <GripVertical
        size={14}
        className="opacity-0 group-hover:opacity-40 transition-opacity cursor-grab flex-shrink-0 text-[var(--text-tertiary)]"
      />

      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${getHealthColor(feed.health_status)}`}
      />

      {feed.logo ? (
        <img
          src={feed.logo}
          alt=""
          className="w-6 h-6 rounded-[4px] flex-shrink-0"
        />
      ) : (
        <div className="w-6 h-6 rounded-[4px] flex-shrink-0 bg-[var(--border)] flex items-center justify-center text-[10px] text-[var(--text-tertiary)]">
          {feed.title?.charAt(0)?.toUpperCase() ?? "F"}
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-[var(--text-primary)] truncate">
            {feed.title}
          </span>
          {intelBadge && (
            <span className="bg-[var(--accent-light)] text-[var(--accent-text)] text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap">
              {intelBadge.emoji} {intelBadge.label}
            </span>
          )}
        </div>
        <span className="text-xs text-[var(--text-tertiary)] truncate">
          {getDomain(feed.feed_url || feed.link || "")}
        </span>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {feed.unread > 0 && (
          <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
            {feed.unread}
          </span>
        )}
        {feed.last_sync_date && (
          <span className="text-xs text-[var(--text-tertiary)]">
            {formatSyncTime(feed.last_sync_date)}
          </span>
        )}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            type="button"
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--border)] text-[var(--text-tertiary)]"
            onClick={(e) => {
              e.stopPropagation();
              onSync(feed);
            }}
          >
            <RefreshCw size={12} />
          </button>
          <button
            type="button"
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--border)] text-[var(--text-tertiary)]"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(feed);
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
});
