import { Text, Flex } from "@radix-ui/themes";
import { SignalSource } from "@/stores/createTodaySlice";
import { formatDistanceToNow, parseISO } from "date-fns";
import { FileText, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SignalSourceItemProps {
  source: SignalSource;
  onClick: (articleUuid: string, feedUuid: string, articleId: number) => void;
}

export function SignalSourceItem({ source, onClick }: SignalSourceItemProps) {
  const { t } = useTranslation();
  const timeAgo = source.pub_date
    ? formatDistanceToNow(parseISO(source.pub_date), { addSuffix: true })
    : "";

  return (
    <div className="p-2.5 rounded-md hover:bg-[var(--gray-3)] transition-colors">
      <Flex align="center" gap="2" mb="1">
        <Text size="1" className="text-[var(--gray-9)]">
          {source.feed_title}
        </Text>
        {timeAgo && (
          <Text size="1" className="text-[var(--gray-8)]">
            · {timeAgo}
          </Text>
        )}
      </Flex>
      <Flex align="start" gap="2">
        <FileText size={14} className="text-[var(--gray-8)] mt-0.5 shrink-0" />
        <Text size="2" className="text-[var(--gray-11)] leading-snug line-clamp-2">
          {source.title}
        </Text>
      </Flex>
      <button
        onClick={() => onClick(source.article_uuid, source.feed_uuid, source.article_id)}
        className="flex items-center gap-1 mt-1.5 text-sm text-[var(--accent-9)] hover:text-[var(--accent-10)] transition-colors duration-150 ease"
      >
        <ExternalLink size={12} />
        <span>{t("today.sources.read_original")}</span>
      </button>
    </div>
  );
}
