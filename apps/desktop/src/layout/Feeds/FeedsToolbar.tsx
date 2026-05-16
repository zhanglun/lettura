import React from "react";
import { Plus, FolderPlus, RefreshCw, CheckCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FeedsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddFeed: () => void;
  onAddFolder: () => void;
  onSyncAll: () => void;
  onMarkAllRead: () => void;
  syncing?: boolean;
}

export const FeedsToolbar = React.memo(function FeedsToolbar({
  searchQuery,
  onSearchChange,
  onAddFeed,
  onAddFolder,
  onSyncAll,
  onMarkAllRead,
  syncing,
}: FeedsToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)]">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={t("feeds.search_placeholder")}
        className="flex-1 px-3 py-1.5 text-xs rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-app)] outline-none focus:border-[var(--accent)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
      />
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onAddFeed}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[var(--text-secondary)] rounded-[var(--radius-sm)] border border-[var(--border)] hover:bg-[var(--bg-app)] hover:border-[var(--border-hover)] transition-colors"
        >
          <Plus size={12} />
          {t("feeds.add_feed")}
        </button>
        <button
          type="button"
          onClick={onAddFolder}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[var(--text-secondary)] rounded-[var(--radius-sm)] border border-[var(--border)] hover:bg-[var(--bg-app)] hover:border-[var(--border-hover)] transition-colors"
        >
          <FolderPlus size={12} />
          {t("feeds.add_folder")}
        </button>
        <div className="mx-1 h-4 w-px bg-[var(--border)]" />
        <button
          type="button"
          onClick={onSyncAll}
          disabled={syncing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[var(--text-secondary)] rounded-[var(--radius-sm)] border border-[var(--border)] hover:bg-[var(--bg-app)] hover:border-[var(--border-hover)] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
          {syncing ? t("Syncing...") : t("Sync All")}
        </button>
        <button
          type="button"
          onClick={onMarkAllRead}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[var(--text-secondary)] rounded-[var(--radius-sm)] border border-[var(--border)] hover:bg-[var(--bg-app)] hover:border-[var(--border-hover)] transition-colors"
        >
          <CheckCheck size={12} />
          {t("Mark all as read")}
        </button>
      </div>
    </div>
  );
});
