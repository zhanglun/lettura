import { Text, Flex } from "@radix-ui/themes";
import { SignalSource } from "@/stores/createTodaySlice";
import { formatDistanceToNow, parseISO } from "date-fns";
import { FileText, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SignalSourceItemProps {
  source: SignalSource;
  onClick: (articleUuid: string, feedUuid: string, articleId: number) => void;
  onReadOriginal?: (articleUuid: string, feedUuid: string, articleId: number) => void;
}

export function SignalSourceItem({ source, onClick, onReadOriginal }: SignalSourceItemProps) {
  const { t } = useTranslation();
  const timeAgo = source.pub_date
    ? formatDistanceToNow(parseISO(source.pub_date), { addSuffix: true })
    : "";

  const handleReadOriginal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReadOriginal) {
      onReadOriginal(source.article_uuid, source.feed_uuid, source.article_id);
    } else {
      onClick(source.article_uuid, source.feed_uuid, source.article_id);
    }
  };

  return (
    <button
      className="w-full text-left p-2.5 rounded-md hover:bg-[var(--gray-3)] transition-colors cursor-pointer group/item"
      onClick={() => onClick(source.article_uuid, source.feed_uuid, source.article_id)}
    >
      <Flex align="center" justify="between" mb="1">
        <Flex align="center" gap="2">
          <Text size="1" className="text-[var(--gray-9)]">
            {source.feed_title}
          </Text>
          {timeAgo && (
            <Text size="1" className="text-[var(--gray-8)]">
              · {timeAgo}
            </Text>
          )}
        </Flex>
        <button
          onClick={handleReadOriginal}
          className="flex items-center gap-1 text-xs text-[var(--gray-9)] hover:text-[var(--accent-9)] transition-colors opacity-0 group-hover/item:opacity-100 shrink-0 ml-2"
        >
          <ExternalLink size={12} />
          <span>{t("today.deep_read.read_original")}</span>
        </button>
      </Flex>
      <Flex align="start" gap="2">
        <FileText size={14} className="text-[var(--gray-8)] mt-0.5 shrink-0" />
        <Text size="2" className="text-[var(--gray-11)] leading-snug line-clamp-2">
          {source.title}
        </Text>
      </Flex>
    </button>
  );
}
