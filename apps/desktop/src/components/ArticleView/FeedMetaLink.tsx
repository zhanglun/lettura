import { Link, useMatch } from "react-router-dom";
import { RouteConfig } from "@/config";
import type { ArticleResItem } from "@/db";
import { useAppStore } from "@/stores";

/**
 * 详情 meta 行里的源名：点击跳订阅详情页（feed_uuid 为空时退化为纯文本，
 * 语义化 <a>，键盘 ⏎ 原生可跳）。
 * 特例：已在该源的队列帧路由（FeedsPage）上、文章是原地展开的内嵌详情时，
 * 同一 URL 的 Link 导航是 no-op——点击改为收起内嵌详情（与 esc 同一动作），
 * 露出下面的源队列页。
 */
export function FeedMetaLink({ article }: { article: ArticleResItem }) {
  // hooks 必须在退化分支之前：即便纯文本态也要保持钩子顺序稳定
  const queueMatch = useMatch(RouteConfig.LOCAL_FEED);

  if (!article.feed_uuid) {
    return <span>{article.feed_title}</span>;
  }

  const alreadyOnFeedPage = queueMatch?.params.uuid === article.feed_uuid;

  return (
    <Link
      className="fusion-dmeta-feed"
      to={RouteConfig.LOCAL_FEED.replace(":uuid", article.feed_uuid)}
      title={article.feed_title}
      onClick={(e) => {
        e.stopPropagation();
        if (alreadyOnFeedPage) {
          e.preventDefault();
          useAppStore.getState().setExpandedArticleUuid(null);
        }
      }}
    >
      {article.feed_title}
    </Link>
  );
}
