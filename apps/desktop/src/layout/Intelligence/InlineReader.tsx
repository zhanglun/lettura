import { Text, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import type { SignalSource } from "@/stores/createTodaySlice";

interface InlineReaderProps {
  source: SignalSource;
  sources: SignalSource[];
  currentIndex: number;
  onBack: () => void;
  onNavigate: (index: number) => void;
}

export function InlineReader({
  source,
  sources,
  currentIndex,
  onBack,
  onNavigate,
}: InlineReaderProps) {
  const { t } = useTranslation();

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < sources.length - 1;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--gray-4)] shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-[var(--gray-9)] hover:text-[var(--gray-12)] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>{t("today.inline_reader.back")}</span>
        </button>

        <Flex align="center" gap="2">
          <button
            onClick={() => canGoPrev && onNavigate(currentIndex - 1)}
            disabled={!canGoPrev}
            className="p-1 rounded text-[var(--gray-9)] hover:text-[var(--gray-12)] hover:bg-[var(--gray-3)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-1">
              <ChevronLeft size={16} />
              <span className="sr-only">{t("today.inline_reader.prev")}</span>
            </span>
          </button>
          <Text size="1" className="text-[var(--gray-9)] tabular-nums">
            {currentIndex + 1} / {sources.length}
          </Text>
          <button
            onClick={() => canGoNext && onNavigate(currentIndex + 1)}
            disabled={!canGoNext}
            className="p-1 rounded text-[var(--gray-9)] hover:text-[var(--gray-12)] hover:bg-[var(--gray-3)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-1">
              <span className="sr-only">{t("today.inline_reader.next")}</span>
              <ChevronRight size={16} />
            </span>
          </button>
        </Flex>

        <a
          href={source.link}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 rounded text-[var(--gray-9)] hover:text-[var(--gray-12)] hover:bg-[var(--gray-3)] transition-colors"
        >
          <ExternalLink size={14} />
        </a>
      </div>

      <div className="px-4 py-3 border-b border-[var(--gray-4)] shrink-0">
        <Text size="1" className="text-[var(--gray-9)]">
          {source.feed_title}
        </Text>
        <Text size="4" weight="medium" className="text-[var(--gray-12)] leading-snug block mt-1">
          {source.title}
        </Text>
        {source.excerpt && (
          <Text size="2" className="text-[var(--gray-11)] mt-2 block leading-relaxed">
            {source.excerpt}
          </Text>
        )}
      </div>

      <div className="flex-1 overflow-auto px-4 py-4">
        <div className="text-center py-12 text-[var(--gray-8)]">
          <Text size="2">
            {t("today.inline_reader.content_placeholder")}
          </Text>
        </div>
      </div>
    </div>
  );
}
