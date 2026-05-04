import { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Text, Flex } from "@radix-ui/themes";
import { ArrowLeft, Layers, FileText, Rss, Clock, Pin, PinOff, Sparkles, Activity, BookmarkPlus, ExternalLink, Calendar } from "lucide-react";
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
    } else if (uuid) {
      store.fetchTopicDetail(uuid);
    }
    return () => {
      store.clearSelectedTopic();
    };
  }, [topicId, uuid]);

  const topic = store.selectedTopic;

  const feedUuidMap = useMemo(() => {
    const map = new Map<number, string>();
    if (topic?.source_groups) {
      for (const group of topic.source_groups) {
        for (const article of group.articles) {
          map.set(article.article_id, group.feed_uuid);
        }
      }
    }
    return map;
  }, [topic?.source_groups]);

  if (!uuid) {
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

  const hasSourceGroups = topic.source_groups && topic.source_groups.length > 0;

  return (
    <div className="flex h-full w-full">
      <div className="flex-1 min-w-0 overflow-auto">
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
            <div className="rounded-[10px] border border-[var(--gray-4)] shadow-sm p-4 mb-5 bg-[var(--gray-2)]">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={14} className="text-[var(--accent-9)]" />
                <span className="text-xs font-semibold text-[var(--gray-12)]">
                  {t("layout.topics.detail.topic_summary")}
                </span>
              </div>
              <p className="text-xs text-[var(--gray-11)] leading-relaxed">
                {topic.description}
              </p>
            </div>
          )}

          {topic.recent_changes && topic.recent_changes.length > 0 && (
            <div className="rounded-[10px] border border-[var(--gray-4)] shadow-sm p-4 mb-5 bg-[var(--color-background)]">
              <div className="flex items-center gap-1.5 mb-3">
                <Activity size={14} className="text-[var(--accent-9)]" />
                <span className="text-xs font-semibold text-[var(--gray-12)]">
                  {t("layout.topics.detail.recent_changes")}
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {topic.recent_changes.map((change, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div className="flex flex-col items-center pt-0.5">
                      <div className="h-2 w-2 rounded-full bg-[var(--accent-9)] shrink-0" />
                      {idx < topic.recent_changes.length - 1 && (
                        <div className="w-px flex-1 bg-[var(--gray-4)] mt-1 min-h-[16px]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--gray-8)] tabular-nums">{formatDate(change.date)}</span>
                        <span className="text-[var(--gray-12)] font-medium truncate">{change.title}</span>
                      </div>
                      <span className="text-[var(--gray-9)]">
                        {t("layout.topics.detail.recent_changes_articles", { count: change.article_count, sources: change.source_count })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
              <Calendar size={14} className="text-[var(--gray-8)]" />
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
          ) : hasSourceGroups ? (
            <div className="flex flex-col gap-4">
              <Text size="2" weight="medium" className="text-[var(--gray-11)]">
                {t("layout.topics.detail.source_groups")}
              </Text>
              {topic.source_groups!.map((group) => (
                <SourceGroup key={group.feed_uuid} group={group} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-[var(--gray-4)] overflow-hidden">
              {topic.articles.map((article) => (
                <TopicArticleItem key={article.article_id} article={article} feedUuid={feedUuidMap.get(article.article_id)} />
              ))}
            </div>
          )}

          {topic.articles.length > 0 && (
            <div className="rounded-[10px] border border-[var(--gray-4)] shadow-sm p-4 mt-5 bg-[var(--color-background)]">
              <div className="flex items-center gap-1.5 mb-3">
                <BookmarkPlus size={14} className="text-[var(--accent-9)]" />
                <span className="text-xs font-semibold text-[var(--gray-12)]">
                  {t("layout.topics.detail.start_here")}
                </span>
                <span className="text-[10px] text-[var(--gray-8)] ml-1">
                  {t("layout.topics.detail.start_here_desc")}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {[...topic.articles]
                  .sort((a, b) => b.relevance_score - a.relevance_score)
                  .slice(0, 3)
                  .map((article) => {
                    const feedUuid = feedUuidMap.get(article.article_id);
                    return (
                      <div
                        key={article.article_id}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-md px-3 py-2 transition-colors",
                          feedUuid
                            ? "bg-[var(--gray-2)] hover:bg-[var(--gray-3)] cursor-pointer"
                            : "bg-[var(--gray-2)]",
                        )}
                        onClick={() => {
                          if (feedUuid) {
                            navigate(RouteConfig.LOCAL_ARTICLE.replace(":uuid", feedUuid).replace(":id", String(article.article_id)));
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="shrink-0 text-[10px] font-semibold text-[var(--accent-9)] bg-[var(--accent-a3)] rounded-full px-1.5 py-0.5">
                            {t("layout.topics.detail.recommended")}
                          </span>
                          <span className="text-xs text-[var(--gray-12)] truncate">{article.title}</span>
                        </div>
                        {feedUuid ? (
                          <span className="flex items-center gap-1 text-xs text-[var(--gray-8)] shrink-0">
                            {t("layout.topics.detail.read_original")}
                          </span>
                        ) : (
                          <a
                            href={article.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-[var(--gray-9)] hover:text-[var(--accent-9)] transition-colors shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={12} />
                            {t("layout.topics.detail.read_original")}
                          </a>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
