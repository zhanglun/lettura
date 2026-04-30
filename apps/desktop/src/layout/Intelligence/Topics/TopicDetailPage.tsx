import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Text, Flex } from "@radix-ui/themes";
import { ArrowLeft, Layers, FileText, Rss, Clock, Pin, PinOff } from "lucide-react";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { RouteConfig } from "@/config";
import { cn } from "@/helpers/cn";
import { TopicArticleItem } from "./TopicArticleItem";
import { SourceGroup } from "./SourceGroup";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function TopicDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const store = useBearStore(
    useShallow((state) => ({
      topics: state.topics,
      selectedTopic: state.selectedTopic,
      detailLoading: state.detailLoading,
      error: state.error,
      fetchTopicDetail: state.fetchTopicDetail,
      clearSelectedTopic: state.clearSelectedTopic,
      followTopic: state.followTopic,
      unfollowTopic: state.unfollowTopic,
    })),
  );

  const topicFromList = store.topics.find((tp) => tp.uuid === uuid);
  const topicId = topicFromList?.id;

  useEffect(() => {
    if (topicId != null) {
      store.fetchTopicDetail(topicId);
    }
    return () => {
      store.clearSelectedTopic();
    };
  }, [topicId]);

  const topic = store.selectedTopic;

  if (!topicId) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-canvas text-[var(--gray-9)]">
        <Layers size={48} className="mb-4 text-[var(--gray-8)]" />
        <Text size="2" className="text-[var(--gray-11)]">
          {t("layout.topics.empty")}
        </Text>
      </div>
    );
  }

  if (store.detailLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-canvas text-[var(--gray-9)]">
        <Layers size={48} className="mb-4 text-[var(--gray-8)] animate-pulse" />
        <Text size="2" className="text-[var(--gray-9)]">
          {t("layout.topics.detail.loading_detail")}
        </Text>
      </div>
    );
  }

  if (store.error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-canvas">
        <Text size="2" className="text-[var(--red-9)]">
          {store.error}
        </Text>
      </div>
    );
  }

  if (!topic) {
    return null;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button
        onClick={() => navigate(RouteConfig.LOCAL_TOPICS)}
        className="flex items-center gap-1 text-[var(--gray-9)] hover:text-[var(--gray-11)] transition-colors text-sm mb-4"
      >
        <ArrowLeft size={14} />
        <span>{t("layout.topics.detail.back")}</span>
      </button>

      <div className="flex items-center justify-between mb-3">
        <Text
          size="6"
          weight="bold"
          className="text-[var(--gray-12)] leading-tight"
        >
          {topic.title}
        </Text>
        <button
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors border",
            topic.is_following
              ? "border-[var(--accent-6)] text-[var(--accent-9)] bg-[var(--accent-2)]"
              : "border-[var(--gray-6)] text-[var(--gray-11)] hover:border-[var(--gray-7)]",
          )}
          onClick={() => {
            topic.is_following ? store.unfollowTopic(topic.id) : store.followTopic(topic.id);
          }}
        >
          {topic.is_following ? <Pin size={14} /> : <PinOff size={14} />}
          <span>{topic.is_following ? t("layout.topics.following") : t("layout.topics.follow")}</span>
        </button>
      </div>

      {topic.description && (
        <Text
          size="2"
          className="text-[var(--gray-11)] leading-relaxed block mb-4"
        >
          {topic.description}
        </Text>
      )}

      {topic.topic_summary && (
        <div className="rounded-lg bg-[var(--gray-2)] border border-[var(--gray-4)] p-4 mb-4">
          <Flex align="center" gap="2" mb="2">
            <FileText size={14} className="text-[var(--accent-9)]" />
            <Text size="2" weight="medium" className="text-[var(--gray-12)]">
              {t("layout.topics.detail.topic_summary")}
            </Text>
          </Flex>
          <Text size="2" className="text-[var(--gray-11)] leading-relaxed">
            {topic.topic_summary}
          </Text>
        </div>
      )}

      <Flex align="center" gap="4" mb="4">
        <Flex align="center" gap="1">
          <FileText size={14} className="text-[var(--gray-9)]" />
          <Text size="1" className="text-[var(--gray-9)]">
            {topic.article_count} {t("layout.topics.detail.articles")}
          </Text>
        </Flex>
        <Flex align="center" gap="1">
          <Rss size={14} className="text-[var(--gray-9)]" />
          <Text size="1" className="text-[var(--gray-9)]">
            {topic.source_count} {t("layout.topics.detail.sources")}
          </Text>
        </Flex>
        <Flex align="center" gap="1">
          <Clock size={14} className="text-[var(--gray-8)]" />
          <Text size="1" className="text-[var(--gray-8)]">
            {t("layout.topics.detail.first_seen")} {formatDate(topic.first_seen_at)}
          </Text>
        </Flex>
        <Flex align="center" gap="1">
          <Clock size={14} className="text-[var(--gray-8)]" />
          <Text size="1" className="text-[var(--gray-8)]">
            {t("layout.topics.detail.last_updated")} {formatDate(topic.last_updated_at)}
          </Text>
        </Flex>
      </Flex>

      <div className="border-t border-[var(--gray-4)] my-4" />

      <Text size="3" weight="medium" className="text-[var(--gray-12)] block mb-3">
        {t("layout.topics.detail.related_articles")}
      </Text>

      {topic.articles.length === 0 ? (
        <Text size="2" className="text-[var(--gray-9)]">
          {t("layout.topics.detail.no_articles")}
        </Text>
      ) : topic.source_groups && topic.source_groups.length > 0 ? (
        <div className="flex flex-col gap-4">
          <Text size="2" weight="medium" className="text-[var(--gray-11)]">
            {t("layout.topics.detail.source_groups")}
          </Text>
          {topic.source_groups.map((group) => (
            <SourceGroup key={group.feed_uuid} group={group} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--gray-4)] overflow-hidden">
          {topic.articles.map((article) => (
            <TopicArticleItem key={article.article_id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
