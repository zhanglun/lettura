import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layers } from "lucide-react";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { RouteConfig } from "@/config";

export function SidebarToday() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const store = useBearStore(
    useShallow((state) => ({
      topics: state.topics,
      followingTopicIds: state.followingTopicIds,
    })),
  );

  const followedTopics = store.topics.filter((tp: { id: number }) => store.followingTopicIds.has(tp.id));

  return (
    <div className="flex flex-col gap-1">
      <div className="px-3 pb-2">
        <div className="px-2 py-1.5">
          <span className="text-xs font-medium text-[var(--gray-11)]">
            {t("layout.sidebar.today_focus")}
          </span>
        </div>
        <div
          className="flex flex-col gap-0.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-[var(--gray-3)] transition-colors"
          onClick={() => navigate(RouteConfig.LOCAL_TODAY)}
        >
          <span className="text-xs font-medium text-[var(--gray-12)]">
            {t("layout.sidebar.today_focus")}
          </span>
          <span className="text-[11px] text-[var(--gray-9)]">
            {t("layout.sidebar.today_focus_desc")}
          </span>
        </div>
      </div>

      <div className="px-3 pb-2">
        <div className="px-2 py-1.5">
          <span className="text-xs font-medium text-[var(--gray-11)]">
            {t("layout.sidebar.tracked_topics")}
          </span>
        </div>
        {followedTopics.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {followedTopics.slice(0, 8).map((topic: { id: number; uuid: string; title: string }) => (
              <button
                key={topic.id}
                onClick={() => navigate(`/local/topics/${topic.uuid}`)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-[var(--gray-3)] transition-colors"
              >
                <Layers size={12} className="text-[var(--gray-9)] shrink-0" />
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
  );
}
