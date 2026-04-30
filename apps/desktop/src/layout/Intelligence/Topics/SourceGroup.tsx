import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, Flex } from "@radix-ui/themes";
import { Rss, ChevronDown, ChevronUp } from "lucide-react";
import type { SourceGroup as SourceGroupType } from "@/stores/topicSlice";
import { TopicArticleItem } from "./TopicArticleItem";

const COLLAPSE_THRESHOLD = 3;

interface SourceGroupProps {
  group: SourceGroupType;
}

export function SourceGroup({ group }: SourceGroupProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const shouldCollapse = group.articles.length > COLLAPSE_THRESHOLD;
  const visibleArticles = shouldCollapse && !expanded
    ? group.articles.slice(0, COLLAPSE_THRESHOLD)
    : group.articles;
  const hiddenCount = group.articles.length - COLLAPSE_THRESHOLD;

  return (
    <div className="rounded-lg border border-[var(--gray-4)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-[var(--gray-2)] border-b border-[var(--gray-4)]">
        <Rss size={14} className="text-[var(--accent-9)]" />
        <Text size="2" weight="medium" className="text-[var(--gray-12)]">
          {group.feed_title}
        </Text>
        <Text size="1" className="text-[var(--gray-9)]">
          {group.article_count} {t("layout.topics.detail.articles")}
        </Text>
      </div>
      {visibleArticles.map((article) => (
        <TopicArticleItem key={article.article_id} article={article} />
      ))}
      {shouldCollapse && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 py-2 text-[var(--gray-9)] hover:text-[var(--gray-11)] hover:bg-[var(--gray-2)] transition-colors text-sm border-t border-[var(--gray-3)]"
        >
          {expanded ? (
            <>
              <ChevronUp size={14} />
              <span>{t("layout.topics.detail.show_less")}</span>
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              <span>{t("layout.topics.detail.show_more")} ({hiddenCount})</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
