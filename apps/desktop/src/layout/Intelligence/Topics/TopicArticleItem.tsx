import { Text, Flex } from "@radix-ui/themes";
import { useNavigate } from "react-router-dom";
import type { TopicArticle } from "@/stores/topicSlice";
import { formatRelativeTime } from "@/helpers/formatRelativeTime";
import { RouteConfig } from "@/config";

interface TopicArticleItemProps {
  article: TopicArticle;
  feedUuid?: string;
  onClick?: (article: TopicArticle) => void;
}

export function TopicArticleItem({ article, feedUuid, onClick }: TopicArticleItemProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(article);
    } else if (feedUuid) {
      navigate(RouteConfig.LOCAL_ARTICLE.replace(":uuid", feedUuid).replace(":id", String(article.article_id)));
    } else if (typeof window !== "undefined") {
      window.open(article.link, "_blank");
    }
  };

  return (
    <div
      className="py-3 px-4 border-b border-[var(--gray-3)] hover:bg-[var(--gray-2)] cursor-pointer transition-colors last:border-b-0"
      onClick={handleClick}
    >
      <Flex direction="column" gap="1">
        <Text size="2" className="text-[var(--gray-12)] truncate">
          {article.title}
        </Text>
        <Flex align="center" gap="2">
          <Text size="1" className="text-[var(--gray-9)]">
            {article.feed_title}
          </Text>
          <Text size="1" className="text-[var(--gray-8)]">
            {formatRelativeTime(article.pub_date)}
          </Text>
        </Flex>
        {article.excerpt && (
          <Text size="1" className="text-[var(--gray-11)] line-clamp-1">
            {article.excerpt}
          </Text>
        )}
      </Flex>
    </div>
  );
}
