import { Text, Flex } from "@radix-ui/themes";
import type { TopicArticle } from "@/stores/topicSlice";
import { formatRelativeTime } from "@/helpers/formatRelativeTime";

interface TopicArticleItemProps {
  article: TopicArticle;
}

export function TopicArticleItem({ article }: TopicArticleItemProps) {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.open(article.link, "_blank");
    }
  };

  return (
    <div
      className="py-3 px-4 border-b border-[var(--gray-3)] hover:bg-[var(--gray-2)] cursor-pointer transition-colors"
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
