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
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--gray-a5)] bg-[var(--gray-a2)]">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={t("feeds.search_placeholder")}
        className="flex-1 px-3 py-1.5 text-[12px] rounded-md border border-[var(--gray-a5)] bg-[var(--color-background)] outline-none focus:border-[var(--accent-8)] text-[var(--gray-12)] placeholder:text-[var(--gray-9)]"
      />
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onAddFeed}
          className="btn-ghost text-[11px] py-1 px-2.5 gap-1"
        >
          <Plus size={12} />
          {t("feeds.add_feed")}
        </button>
        <button
          type="button"
          onClick={onAddFolder}
          className="btn-ghost text-[11px] py-1 px-2.5 gap-1"
        >
          <FolderPlus size={12} />
          {t("feeds.add_folder")}
        </button>
        <div className="mx-1 h-4 w-px bg-[var(--gray-a5)]" />
        <button
          type="button"
          onClick={onSyncAll}
          disabled={syncing}
          className="btn-ghost text-[11px] py-1 px-2.5 gap-1 disabled:opacity-50"
        >
          <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
          {syncing ? t("Syncing...") : t("Sync All")}
        </button>
        <button
          type="button"
          onClick={onMarkAllRead}
          className="btn-ghost text-[11px] py-1 px-2.5 gap-1"
        >
          <CheckCheck size={12} />
          {t("Mark all as read")}
        </button>
      </div>
    </div>
  );
});
