import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useShallow } from "zustand/react/shallow";
import { useBearStore } from "@/stores";
import { SidebarFeeds } from "./SidebarFeeds";
import { FeedsSidebar } from "@/layout/Feeds/FeedsSidebar";
import { FeedResItem } from "@/db";

export type SidebarContext =
  | "feeds"
  | "feeds-manage"
  | "default"
  | "hidden";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  context?: SidebarContext;
}

export const Sidebar = React.memo(function ({
  collapsed,
  context = "default",
}: SidebarProps) {
  const { t } = useTranslation();
  const store = useBearStore(
    useShallow((state) => ({
      subscribes: state.subscribes,
    })),
  );

  const feedStats = useMemo(() => {
    const flatten = (items: FeedResItem[]): FeedResItem[] =>
      items.flatMap((item) =>
        item.item_type === "folder" ? flatten(item.children || []) : [item],
      );
    const feeds = flatten(store.subscribes || []);
    const latestSync = feeds
      .map((feed) => feed.last_sync_date)
      .filter(Boolean)
      .sort()
      .at(-1);
    let latestSyncLabel: string | null = null;

    if (latestSync) {
      try {
        latestSyncLabel = formatDistanceToNow(parseISO(latestSync), {
          addSuffix: true,
        });
      } catch {
        latestSyncLabel = latestSync;
      }
    }

    return {
      count: feeds.length,
      latestSync: latestSyncLabel,
    };
  }, [store.subscribes]);

  if (collapsed) {
    return null;
  }

  if (context === "hidden") {
    return null;
  }

  const renderContextContent = () => {
    switch (context) {
      case "feeds":
        return <SidebarFeeds />;
      case "feeds-manage":
        return <FeedsSidebar />;
      default:
        return <SidebarFeeds />;
    }
  };

  const headerCopy = {
    feeds: {
      title: t("layout.sidebar.brand"),
      desc: t("layout.sidebar.feeds_desc"),
    },
    "feeds-manage": {
      title: t("feeds.manage_title"),
      desc: "",
    },
    default: {
      title: t("layout.sidebar.brand"),
      desc: "",
    },
    hidden: {
      title: "",
      desc: "",
    },
  }[context];

  return (
    <div className="flex flex-col h-full w-[276px] bg-[var(--gray-2)] border-r border-[var(--gray-5)] select-none shrink-0 overflow-hidden">
      <div className="px-4 py-3.5 border-b border-[var(--gray-5)] shrink-0">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-[var(--gray-12)] tracking-tight">
            {headerCopy.title}
          </div>
          {headerCopy.desc && (
            <div className="mt-0.5 text-[11px] leading-4 text-[var(--gray-9)]">
              {headerCopy.desc}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-gutter">
        {renderContextContent()}
      </div>

      {(context === "feeds" || context === "feeds-manage") && (
        <div className="border-t border-[var(--gray-5)] bg-[var(--gray-2)] px-4 py-3 text-[10px] leading-4 text-[var(--gray-9)]">
          {t("layout.sidebar.feed_footer_text", {
            count: feedStats.count,
            sync: feedStats.latestSync
              ? t("layout.sidebar.feed_synced", { time: feedStats.latestSync })
              : t("layout.sidebar.feed_waiting_sync"),
          })}
        </div>
      )}
    </div>
  );
});
