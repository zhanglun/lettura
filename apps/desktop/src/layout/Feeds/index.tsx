import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { ArticleView } from "@/layout/Article/ArticleView";

export function FeedsPage() {
  const { uuid } = useParams<{ uuid?: string }>();

  const { subscribes, getSubscribes } = useBearStore(
    useShallow((state) => ({
      subscribes: state.subscribes,
      getSubscribes: state.getSubscribes,
    })),
  );

  useEffect(() => {
    if (uuid && subscribes.length === 0) {
      getSubscribes();
    }
  }, [uuid]);

  return (
    <div className="relative flex flex-1 h-full overflow-hidden">
      {uuid ? (
        <ArticleView />
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-[var(--gray-9)]">
          从侧边栏选择一个来源开始阅读
        </div>
      )}
    </div>
  );
}
