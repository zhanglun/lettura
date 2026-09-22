import { useParams, Navigate } from "react-router-dom";
import { ArticleView } from "@/layout/Article/ArticleView";
import { RouteConfig } from "@/config";

export function FeedsPage() {
  const { uuid } = useParams<{ uuid?: string }>();

  // Sidebar 退役：无 uuid 的 /local/feeds 直接回未读列表
  return uuid ? (
    <div className="relative flex flex-1 h-full overflow-hidden">
      <ArticleView />
    </div>
  ) : (
    <Navigate to={RouteConfig.LOCAL_ALL} replace />
  );
}
