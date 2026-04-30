import { Text, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { FileText, Rss, Pin, PinOff } from "lucide-react";
import type { TopicItem } from "@/stores/topicSlice";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/helpers/cn";
import { formatRelativeTime } from "@/helpers/formatRelativeTime";

interface TopicCardProps {
  topic: TopicItem;
  onClick: (uuid: string) => void;
}

export function TopicCard({ topic, onClick }: TopicCardProps) {
  const { t } = useTranslation();
  const { followTopic, unfollowTopic } = useBearStore(
    useShallow((state) => ({
      followTopic: state.followTopic,
      unfollowTopic: state.unfollowTopic,
    })),
  );

  return (
    <div
      className="rounded-lg border border-[var(--gray-4)] bg-[var(--color-background)] p-4 transition-all hover:border-[var(--gray-7)] hover:shadow-sm cursor-pointer"
      onClick={() => onClick(topic.uuid)}
    >
      <Flex direction="column" gap="2">
        <Text size="3" weight="medium" className="text-[var(--gray-12)]">
          {topic.title}
        </Text>
        {topic.description && (
          <Text size="2" className="text-[var(--gray-11)] leading-relaxed line-clamp-2">
            {topic.description}
          </Text>
        )}
        <Flex align="center" gap="3" mt="1">
          <Flex align="center" gap="1">
            <FileText size={13} className="text-[var(--gray-9)]" />
            <Text size="1" className="text-[var(--gray-9)]">
              {t("layout.topics.article_count", { count: topic.article_count })}
            </Text>
          </Flex>
          <Flex align="center" gap="1">
            <Rss size={13} className="text-[var(--gray-9)]" />
            <Text size="1" className="text-[var(--gray-9)]">
              {t("layout.topics.source_count", { count: topic.source_count })}
            </Text>
          </Flex>
          <Text size="1" className="text-[var(--gray-8)] ml-auto">
            {formatRelativeTime(topic.last_updated_at)}
          </Text>
        </Flex>
        <button
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
            topic.is_following
              ? "text-[var(--accent-9)] bg-[var(--accent-2)]"
              : "text-[var(--gray-9)] hover:text-[var(--gray-11)] hover:bg-[var(--gray-3)]",
          )}
          onClick={(e) => {
            e.stopPropagation();
            topic.is_following ? unfollowTopic(topic.id) : followTopic(topic.id);
          }}
        >
          {topic.is_following ? <Pin size={12} /> : <PinOff size={12} />}
          <span>{topic.is_following ? t("layout.topics.following") : t("layout.topics.follow")}</span>
        </button>
      </Flex>
    </div>
  );
}
