import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { RouteConfig } from "@/config";

function getTopicColor(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "var(--accent-9)",
    "var(--green-9)",
    "var(--amber-9)",
    "var(--blue-9)",
  ];
  return colors[Math.abs(hash) % colors.length];
}

interface FocusGroup {
  topicId: number | null;
  topicTitle: string;
  count: number;
}

export function SidebarToday() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const store = useBearStore(
    useShallow((state) => ({
      signals: state.signals,
      topics: state.topics,
      followingTopicIds: state.followingTopicIds,
      overview: state.overview,
      fetchSignals: state.fetchSignals,
      fetchOverview: state.fetchOverview,
      fetchTopics: state.fetchTopics,
    })),
  );

  useEffect(() => {
    if (store.signals.length === 0) {
      store.fetchSignals();
    }
    if (store.topics.length === 0) {
      store.fetchTopics("active", "last_updated");
    }
    if (!store.overview) {
      store.fetchOverview();
    }
  }, []);

  const focusGroups = useMemo<FocusGroup[]>(() => {
    const map = new Map<string, FocusGroup>();
    for (const signal of store.signals) {
      const title = signal.topic_title || signal.title;
      if (!title) continue;
      const existing = map.get(title);
      if (existing) {
        existing.count += signal.source_count;
      } else {
        map.set(title, {
          topicId: signal.topic_id,
          topicTitle: title,
          count: signal.source_count,
        });
      }
    }
    return Array.from(map.values()).slice(0, 5);
  }, [store.signals]);

  const followedTopics = useMemo(() => {
    const followed = store.topics.filter((tp) => store.followingTopicIds.has(tp.id));
    return (followed.length > 0 ? followed : store.topics).slice(0, 8);
  }, [store.topics, store.followingTopicIds]);

  const showingTopicSuggestions =
    store.followingTopicIds.size === 0 && followedTopics.length > 0;

  const handleClickFocus = (group: FocusGroup) => {
    if (group.topicId) {
      const topic = store.topics.find((tp) => tp.id === group.topicId);
      if (topic) {
        navigate(`/local/topics/${topic.uuid}`);
        return;
      }
    }
    navigate(RouteConfig.LOCAL_TODAY);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 pt-3 pb-2">
          <div className="px-2 py-1.5">
            <span className="text-xs font-medium text-[var(--gray-11)]">
              {t("layout.sidebar.today_focus")}
            </span>
          </div>
          {focusGroups.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {focusGroups.map((group) => (
                <button
                  key={group.topicTitle}
                  onClick={() => handleClickFocus(group)}
                  className="sidebar-item text-left"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: getTopicColor(group.topicTitle) }}
                  />
                  <span className="text-xs text-[var(--gray-12)] truncate flex-1">
                    {group.topicTitle}
                  </span>
                  <span className="text-[11px] text-[var(--gray-9)] tabular-nums">
                    {group.count}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col gap-0.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-[var(--gray-a3)] transition-colors"
              onClick={() => navigate(RouteConfig.LOCAL_TODAY)}
            >
              <span className="text-xs font-medium text-[var(--gray-12)]">
                {t("layout.sidebar.today_focus")}
              </span>
              <span className="text-[11px] text-[var(--gray-9)]">
                {t("layout.sidebar.today_focus_desc")}
              </span>
            </div>
          )}
        </div>

        <div className="px-3 pb-2">
          <div className="px-2 py-1.5">
            <span className="text-xs font-medium text-[var(--gray-11)]">
              {t("layout.sidebar.tracked_topics")}
            </span>
            {showingTopicSuggestions && (
              <span className="ml-1 text-[10px] text-[var(--gray-9)]">
                {t("layout.sidebar.topic_suggestions")}
              </span>
            )}
          </div>
          {followedTopics.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {followedTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => navigate(`/local/topics/${topic.uuid}`)}
                  className="sidebar-item text-left"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: getTopicColor(topic.title) }}
                  />
                  <span className="text-xs text-[var(--gray-12)] truncate">
                    {topic.title}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-2 py-2 text-xs text-[var(--gray-9)]">
              {t("layout.sidebar.no_tracked_topics")}
            </div>
          )}
        </div>
      </div>

      {store.overview && (
        <div className="px-4 py-2 border-t border-[var(--gray-6)] text-[10px] text-[var(--gray-9)] leading-relaxed">
          {t("layout.sidebar.footer_text", {
            article_count: store.overview.article_count,
            signal_count: store.overview.signal_count,
          })}
        </div>
      )}
    </div>
  );
}
