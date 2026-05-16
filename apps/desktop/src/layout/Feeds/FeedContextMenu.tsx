import React, { useCallback, useEffect, useRef } from "react";
import {
  BookOpen,
  RefreshCw,
  CheckCheck,
  Pencil,
  FolderInput,
  Ban,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FeedResItem } from "@/db";

interface FeedContextMenuProps {
  feed: FeedResItem | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onViewArticles: (feed: FeedResItem) => void;
  onSync: (feed: FeedResItem) => void;
  onMarkAllRead: (feed: FeedResItem) => void;
  onEdit: (feed: FeedResItem) => void;
  onMoveToFolder: (feed: FeedResItem) => void;
  onDisable: (feed: FeedResItem) => void;
  onDelete: (feed: FeedResItem) => void;
}

type MenuItem = {
  icon: React.ReactNode;
  label: string;
  action: (feed: FeedResItem) => void;
  danger?: boolean;
};

export const FeedContextMenu = React.memo(function FeedContextMenu({
  feed,
  position,
  onClose,
  onViewArticles,
  onSync,
  onMarkAllRead,
  onEdit,
  onMoveToFolder,
  onDisable,
  onDelete,
}: FeedContextMenuProps) {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!feed || !position) return;
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [feed, position, handleClickOutside]);

  if (!feed || !position) return null;

  const items: MenuItem[] = [
    {
      icon: <BookOpen size={14} />,
      label: t("feeds.ctx.view_articles"),
      action: onViewArticles,
    },
    {
      icon: <RefreshCw size={14} />,
      label: t("feeds.ctx.sync"),
      action: onSync,
    },
    {
      icon: <CheckCheck size={14} />,
      label: t("feeds.ctx.mark_all_read"),
      action: onMarkAllRead,
    },
    { icon: <Pencil size={14} />, label: t("feeds.ctx.edit"), action: onEdit },
    {
      icon: <FolderInput size={14} />,
      label: t("feeds.ctx.move_to_folder"),
      action: onMoveToFolder,
    },
    { icon: <Ban size={14} />, label: t("feeds.ctx.disable"), action: onDisable },
  ];

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        ref={menuRef}
        className="absolute bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] shadow-level-2 py-1 min-w-[180px]"
        style={{ left: position.x, top: position.y }}
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            className="flex items-center gap-2.5 px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--accent-light)] cursor-pointer w-full text-left"
            onClick={() => {
              item.action(feed);
              onClose();
            }}
          >
            <span className="text-[var(--text-tertiary)]">{item.icon}</span>
            {item.label}
          </button>
        ))}
        <div className="h-px bg-[var(--border)] my-1" />
        <button
          type="button"
          className="flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 cursor-pointer w-full text-left"
          onClick={() => {
            onDelete(feed);
            onClose();
          }}
        >
          <span className="text-red-600">
            <Trash2 size={14} />
          </span>
          {t("feeds.ctx.delete")}
        </button>
      </div>
    </div>
  );
});
