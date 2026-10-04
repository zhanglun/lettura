import { Link } from "react-router-dom";
import { RouteConfig } from "@/config";
import type { ArticleResItem } from "@/db";

/**
 * 详情 meta 行里的源名：点击跳订阅详情页（feed_uuid 为空时退化为纯文本，
 * 语义化 <a>，键盘 ⏎ 原生可跳）。
 */
export function FeedMetaLink({ article }: { article: ArticleResItem }) {
  if (!article.feed_uuid) {
    return <span>{article.feed_title}</span>;
  }

  return (
    <Link
      className="fusion-dmeta-feed"
      to={RouteConfig.LOCAL_FEED.replace(":uuid", article.feed_uuid)}
      title={article.feed_title}
      onClick={(e) => e.stopPropagation()}
    >
      {article.feed_title}
    </Link>
  );
}
