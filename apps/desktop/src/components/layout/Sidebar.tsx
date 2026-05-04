import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useShallow } from "zustand/react/shallow";
import { useBearStore } from "@/stores";
import { SidebarToday } from "./SidebarToday";
import { SidebarTopics } from "./SidebarTopics";
import { SidebarFeeds } from "./SidebarFeeds";
import { FeedResItem } from "@/db";
import { RouteConfig } from "@/config";

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
  const navigate = useNavigate();
  const store = useBearStore(
    useShallow((state) => ({
      subscribes: state.subscribes,
      topics: state.topics,
      followingTopicIds: state.followingTopicIds,
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

  const trackedTopics = useMemo(() => {
    const followed = store.topics.filter((tp) => store.followingTopicIds.has(tp.id));
    return followed.slice(0, 5);
  }, [store.topics, store.followingTopicIds]);

  const hasMoreTopics = useMemo(() => {
    return store.topics.filter((tp) => store.followingTopicIds.has(tp.id)).length > 5;
  }, [store.topics, store.followingTopicIds]);

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
      desc: t("layout.sidebar.today_desc"),
    },
    topics: {
      title: t(`layout.sidebar.context_${context}`),
      desc: t("layout.sidebar.topics_desc"),
    },
    feeds: {
      title: t(`layout.sidebar.context_${context}`),
      desc: t("layout.sidebar.feeds_desc"),
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

      {(context === "today" || context === "topics" || trackedTopics.length > 0) && (
        <div className="border-t border-[var(--gray-5)] shrink-0">
          <div className="px-3 pt-2.5 pb-1">
            <span className="text-xs font-medium text-[var(--gray-11)]">
              {t("layout.sidebar.tracked_topics")}
            </span>
          </div>
          {trackedTopics.length > 0 ? (
            <div className="px-3 pb-2 flex flex-col gap-0.5">
              {trackedTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => navigate(`/local/topics/${topic.uuid}`)}
                  className="sidebar-item text-left"
                >
                  <span className="text-xs text-[var(--gray-12)] truncate flex-1">
                    {topic.title}
                  </span>
                  {topic.article_count > 0 && (
                    <span className="text-[10px] text-[var(--gray-9)] tabular-nums bg-[var(--gray-3)] rounded px-1.5 py-0.5">
                      {topic.article_count} new
                    </span>
                  )}
                </button>
              ))}
              {hasMoreTopics && (
                <button
                  onClick={() => navigate(RouteConfig.LOCAL_TOPICS)}
                  className="sidebar-item text-left"
                >
                  <span className="text-[11px] text-[var(--accent-11)]">
                    {t("layout.sidebar.view_all_topics")}
                  </span>
                </button>
              )}
            </div>
          ) : (
            <div className="px-5 pb-2.5 text-[11px] text-[var(--gray-9)]">
              {t("layout.sidebar.no_tracked_topics")}
            </div>
          )}
        </div>
      )}

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
