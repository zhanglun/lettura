import { useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import type { FeedResItem } from "@/db";
import { RouteConfig } from "@/config";
import { FeedsArticles } from "./FeedsArticles";

function findFeedByUuid(
  subscribes: FeedResItem[],
  uuid: string,
): FeedResItem | null {
  for (const item of subscribes) {
    if (item.uuid === uuid && item.item_type !== "folder") {
      return item;
    }
    if (item.children?.length) {
      const found = findFeedByUuid(item.children, uuid);
      if (found) return found;
    }
  }
  return null;
}

export function FeedsPage() {
  const { uuid } = useParams<{ uuid?: string }>();
  const navigate = useNavigate();

  const subscribes = useBearStore(useShallow((state) => state.subscribes));

  const feed = uuid ? findFeedByUuid(subscribes, uuid) : null;

  const handleBack = useCallback(() => {
    navigate(`${RouteConfig.SETTINGS}?tab=sources`);
  }, [navigate]);

  return (
    <div className="relative flex flex-1 h-full overflow-hidden">
      {feed ? (
        <FeedsArticles feed={feed} onBack={handleBack} />
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-[var(--gray-9)]">
          从侧边栏选择一个来源开始阅读
        </div>
      )}
    </div>
  );
}
