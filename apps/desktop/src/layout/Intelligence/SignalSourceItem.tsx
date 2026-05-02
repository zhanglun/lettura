import { Text, Flex } from "@radix-ui/themes";
import { SignalSource } from "@/stores/createTodaySlice";
import { formatDistanceToNow, parseISO } from "date-fns";
import { FileText, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SignalSourceItemProps {
  source: SignalSource;
  onClick: (articleUuid: string, feedUuid: string, articleId: number) => void;
  onReadOriginal?: (articleUuid: string, feedUuid: string, articleId: number) => void;
  onInlineRead?: (articleUuid: string, feedUuid: string, articleId: number) => void;
  isCurrentlyReading?: boolean;
}

export function SignalSourceItem({ source, onClick, onReadOriginal, onInlineRead, isCurrentlyReading }: SignalSourceItemProps) {
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

  const handleInlineRead = () => {
    if (onInlineRead) {
      onInlineRead(source.article_uuid, source.feed_uuid, source.article_id);
    } else {
      onClick(source.article_uuid, source.feed_uuid, source.article_id);
    }
  };

  return (
    <button
      className={`w-full text-left p-2 rounded transition-colors cursor-pointer group/item ${
        isCurrentlyReading
          ? "bg-[var(--accent-3)]"
          : "hover:bg-[var(--gray-3)]"
      }`}
      onClick={handleInlineRead}
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
        <Flex align="center" gap="2">
          {isCurrentlyReading && (
            <span
              className="text-[10px] whitespace-nowrap font-medium"
              style={{ color: "var(--accent-9)" }}
            >
              {t("today.sources.currently_reading")}
            </span>
          )}
          {!isCurrentlyReading && (
            <button
              onClick={handleReadOriginal}
              className="flex items-center gap-1 text-xs text-[var(--gray-9)] hover:text-[var(--accent-9)] transition-colors opacity-0 group-hover/item:opacity-100 shrink-0 ml-2"
            >
              <ExternalLink size={12} />
              <span>{t("today.deep_read.read_original")}</span>
            </button>
          )}
        </Flex>
      </Flex>
      <Flex align="start" gap="2">
        <FileText size={14} className={`mt-0.5 shrink-0 ${isCurrentlyReading ? "text-[var(--accent-9)]" : "text-[var(--gray-8)]"}`} />
        <Text size="2" className={`leading-snug line-clamp-2 ${isCurrentlyReading ? "text-[var(--accent-11)]" : "text-[var(--gray-11)]"}`}>
          {source.title}
        </Text>
      </Flex>
    </button>
  );
}
