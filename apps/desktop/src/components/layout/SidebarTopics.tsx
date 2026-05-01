import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layers } from "lucide-react";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";

export function SidebarTopics() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const store = useBearStore(
    useShallow((state) => ({
      topics: state.topics,
      filterMode: state.filterMode,
    })),
  );

  const displayedTopics =
    store.filterMode === "following"
      ? store.topics.filter((tp: { is_following: boolean }) => tp.is_following)
      : store.topics;

  return (
    <div className="flex flex-col gap-1">
      <div className="px-3 pb-2">
        <div className="px-2 py-1.5">
          <span className="text-xs font-medium text-[var(--gray-11)]">
            {t("layout.sidebar.topics_list")}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          {displayedTopics.length > 0 ? (
            displayedTopics.slice(0, 15).map((topic: { id: number; uuid: string; title: string }) => (
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
            ))
          ) : (
            <div className="px-2 py-2 text-xs text-[var(--gray-9)]">
              {t("layout.topics.empty")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
