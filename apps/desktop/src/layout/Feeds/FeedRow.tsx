import React from "react";
import { RefreshCw, Trash2 } from "lucide-react";
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

function formatSyncTime(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h`;
  return `${Math.floor(diffHour / 24)}d`;
}

export const FeedRow = React.memo(function FeedRow({
  feed,
  onClick,
  onContextMenu,
  onSync,
  onDelete,
}: FeedRowProps) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--gray-a3)] cursor-pointer group transition-colors"
      onClick={() => onClick(feed)}
      onContextMenu={(e) => onContextMenu(e, feed)}
    >
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${getHealthColor(feed.health_status)}`}
      />

      {feed.logo ? (
        <img
          src={feed.logo}
          alt=""
          className="w-6 h-6 rounded-[4px] flex-shrink-0 object-cover"
        />
      ) : (
        <div className="w-6 h-6 rounded-[4px] flex-shrink-0 bg-[var(--gray-4)] flex items-center justify-center text-[10px] text-[var(--gray-9)]">
          {feed.title?.charAt(0)?.toUpperCase() ?? "F"}
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <span className="text-[13px] text-[var(--gray-12)] truncate">
          {feed.title}
        </span>
        <span className="text-[11px] text-[var(--gray-9)] truncate">
          {getDomain(feed.feed_url || feed.link || "")}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {feed.unread > 0 && (
          <span className="text-[12px] font-semibold tabular-nums text-[var(--gray-12)]">
            {feed.unread}
          </span>
        )}
        {feed.last_sync_date && (
          <span className="text-[11px] text-[var(--gray-9)]">
            {formatSyncTime(feed.last_sync_date)}
          </span>
        )}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
          <button
            type="button"
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--gray-a4)] text-[var(--gray-9)]"
            onClick={(e) => { e.stopPropagation(); onSync(feed); }}
          >
            <RefreshCw size={12} />
          </button>
          <button
            type="button"
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--red-a3)] text-[var(--gray-9)] hover:text-[var(--red-9)]"
            onClick={(e) => { e.stopPropagation(); onDelete(feed); }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
});
