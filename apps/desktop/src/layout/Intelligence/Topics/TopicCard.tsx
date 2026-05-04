import { Text, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { FileText, Rss, VolumeX, Volume1 } from "lucide-react";
import type { TopicItem } from "@/stores/topicSlice";
import { cn } from "@/helpers/cn";
import { formatRelativeTime } from "@/helpers/formatRelativeTime";

interface TopicCardProps {
  topic: TopicItem;
  onClick: (uuid: string) => void;
  onMute?: (topicId: number) => void;
  onUnmute?: (topicId: number) => void;
}

export function TopicCard({ topic, onClick, onMute, onUnmute }: TopicCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "group rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)] px-4 py-3 transition-colors hover:border-[var(--gray-7)] hover:bg-[var(--gray-a2)] cursor-pointer",
        topic.is_muted && "opacity-60",
      )}
      onClick={() => onClick(topic.uuid)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {topic.is_following && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--accent-a3)] text-[var(--accent-11)]">
              {t("layout.topics.following")}
            </span>
          )}
          {topic.is_muted && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--gray-a3)] text-[var(--gray-9)]">
              {t("layout.topics.muted")}
            </span>
          )}
          <Text size="3" weight="bold" className="text-[var(--gray-12)]">
            {topic.title}
          </Text>
        </div>
        <div className="flex items-center gap-1">
          {topic.is_muted && onUnmute && (
            <button
              className="text-xs text-[var(--accent-9)] hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                onUnmute(topic.id);
              }}
            >
              {t("layout.topics.unmute")}
            </button>
          )}
          {topic.is_following && onMute && (
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--gray-4)]"
              onClick={(e) => {
                e.stopPropagation();
                onMute(topic.id);
              }}
              title={t("layout.topics.mute")}
            >
              <VolumeX size={14} className="text-[var(--gray-9)]" />
            </button>
          )}
          <Text size="1" className="text-[var(--gray-8)] shrink-0">
            {formatRelativeTime(topic.last_updated_at)}
          </Text>
        </div>
      </div>

      {topic.description && (
        <Text size="2" className="text-[var(--gray-11)] leading-relaxed line-clamp-2 block mb-2.5">
          {topic.description}
        </Text>
      )}

      <Flex align="center" gap="4" className="text-[var(--gray-9)]">
        <Flex align="center" gap="1">
          <FileText size={13} className="text-[var(--gray-9)]" />
          <Text size="1" className="text-[var(--gray-9)]">
            {topic.article_count} {t("layout.topics.detail.articles")}
          </Text>
        </Flex>
        <Flex align="center" gap="1">
          <Rss size={13} className="text-[var(--gray-9)]" />
          <Text size="1" className="text-[var(--gray-9)]">
            {topic.source_count} {t("layout.topics.detail.sources")}
          </Text>
        </Flex>
      </Flex>
    </div>
  );
}
