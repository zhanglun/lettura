import { Text, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { Rss, PieChart } from "lucide-react";
import type { TopicDetail, SourceGroup } from "@/stores/topicSlice";

interface TopicRightPanelProps {
  topic: TopicDetail;
}

export function TopicRightPanel({ topic }: TopicRightPanelProps) {
  const { t } = useTranslation();

  const sourceGroups = topic.source_groups ?? [];

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="p-4">
        <Flex align="center" gap="2" mb="3">
          <PieChart size={16} className="text-[var(--accent-9)]" />
          <Text size="2" weight="medium" className="text-[var(--gray-12)]">
            {t("layout.topics.detail.source_distribution")}
          </Text>
        </Flex>

        {sourceGroups.length > 0 ? (
          <div className="flex flex-col gap-2">
            {sourceGroups.map((group: SourceGroup) => {
              const percentage = topic.article_count > 0
                ? Math.round((group.article_count / topic.article_count) * 100)
                : 0;
              return (
                <div key={group.feed_uuid} className="flex flex-col gap-1">
                  <Flex align="center" justify="between">
                    <Flex align="center" gap="1.5">
                      <Rss size={12} className="text-[var(--gray-9)]" />
                      <Text size="1" className="text-[var(--gray-11)] truncate">
                        {group.feed_title}
                      </Text>
                    </Flex>
                    <Text size="1" className="text-[var(--gray-8)] tabular-nums">
                      {group.article_count} ({percentage}%)
                    </Text>
                  </Flex>
                  <div className="h-1 rounded-full bg-[var(--gray-3)]">
                    <div
                      className="h-1 rounded-full bg-[var(--accent-9)] transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Text size="1" className="text-[var(--gray-9)]">
            {t("layout.topics.detail.no_source_data")}
          </Text>
        )}
      </div>

      {topic.topic_summary && (
        <div className="p-4 border-t border-[var(--gray-4)]">
          <Text size="1" weight="medium" className="text-[var(--gray-11)] block mb-2">
            {t("layout.topics.detail.topic_summary")}
          </Text>
          <Text size="1" className="text-[var(--gray-11)] leading-relaxed">
            {topic.topic_summary}
          </Text>
        </div>
      )}
    </div>
  );
}
