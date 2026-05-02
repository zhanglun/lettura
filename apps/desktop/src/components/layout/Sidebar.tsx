import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useShallow } from "zustand/react/shallow";
import { useBearStore } from "@/stores";
import { SidebarToday } from "./SidebarToday";
import { SidebarTopics } from "./SidebarTopics";
import { SidebarFeeds } from "./SidebarFeeds";
import { FeedResItem } from "@/db";

export type SidebarContext = "today" | "topics" | "feeds" | "default" | "hidden";

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
      case "today":
        return <SidebarToday />;
      case "topics":
        return <SidebarTopics />;
      case "feeds":
        return <SidebarFeeds />;
      default:
        return <SidebarToday />;
    }
  };

  const headerCopy = {
    today: {
      title: t("layout.sidebar.brand"),
      desc: "Daily Intelligence Reader — 每日判断入口",
    },
    topics: {
      title: t(`layout.sidebar.context_${context}`),
      desc: "追踪主题、信号和相关来源",
    },
    feeds: {
      title: t(`layout.sidebar.context_${context}`),
      desc: "管理你的订阅源",
    },
    default: {
      title: t(`layout.sidebar.context_${context}`),
      desc: "",
    },
    hidden: {
      title: "",
      desc: "",
    },
  }[context];

  return (
    <div className="flex flex-col h-full w-[220px] bg-[var(--gray-2)] border-r border-[var(--gray-5)] select-none shrink-0 overflow-hidden">
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

      <div className="flex-1 overflow-auto">
        {renderContextContent()}
      </div>

      {context === "feeds" && (
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
