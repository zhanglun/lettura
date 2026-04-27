import { Text, Flex } from "@radix-ui/themes";
import { SignalSource } from "@/stores/createTodaySlice";
import { formatDistanceToNow, parseISO } from "date-fns";
import { FileText } from "lucide-react";

interface SignalSourceItemProps {
  source: SignalSource;
  onClick: (articleUuid: string, feedUuid: string) => void;
}

export function SignalSourceItem({ source, onClick }: SignalSourceItemProps) {
  const timeAgo = source.pub_date
    ? formatDistanceToNow(parseISO(source.pub_date), { addSuffix: true })
    : "";

  return (
    <button
      className="w-full text-left p-2.5 rounded-md hover:bg-[var(--gray-3)] transition-colors cursor-pointer"
      onClick={() => onClick(source.article_uuid, source.feed_uuid)}
    >
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
    </button>
  );
}
