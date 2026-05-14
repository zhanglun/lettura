import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Text, Flex } from "@radix-ui/themes";
import {
  Layers,
  FileText,
  Rss,
  Clock,
  Pin,
  PinOff,
  Sparkles,
  Activity,
  BookmarkPlus,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { cn } from "@/helpers/cn";
import { RouteConfig } from "@/config";
import { TopicArticleItem } from "./TopicArticleItem";
import { SourceGroup } from "./SourceGroup";
import type { TopicDetail } from "@/stores/topicSlice";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface TopicDetailPanelProps {
  topic: TopicDetail;
  loading: boolean;
  followTopic: (id: number) => void;
  unfollowTopic: (id: number) => void;
}

export function TopicDetailPanel({
  topic,
  loading,
  followTopic,
  unfollowTopic,
}: TopicDetailPanelProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

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

  if (loading) {
    return (
      <aside className="flex flex-col items-center justify-center h-full border-l border-[var(--gray-4)] bg-[var(--color-background)]">
        <Layers
          size={36}
          className="mb-3 text-[var(--gray-8)] animate-pulse"
        />
        <Text size="2" className="text-[var(--gray-9)]">
          {t("layout.topics.detail.loading_detail")}
        </Text>
      </aside>
    );
  }

  const hasSourceGroups =
    topic.source_groups && topic.source_groups.length > 0;

  return (
    <aside className="flex flex-col h-full min-h-0 border-l border-[var(--gray-4)] bg-[var(--color-background)]">
      <div className="px-5 pt-5 pb-3 border-b border-[var(--gray-4)] shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded",
              topic.is_following
                ? "bg-[var(--accent-a3)] text-[var(--accent-11)]"
                : topic.is_muted
                  ? "bg-[var(--gray-a3)] text-[var(--gray-9)]"
                  : "bg-[var(--amber-a3)] text-[var(--amber-11)]",
            )}
          >
            {topic.is_following
              ? t("layout.topics.following")
              : topic.is_muted
                ? t("layout.topics.muted")
                : t("layout.topics.sidebar.filter_discovered")}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <Text
            size="5"
            weight="bold"
            className="text-[var(--gray-12)] leading-tight"
          >
            {topic.title}
          </Text>
          <div className="flex items-center gap-2">
            <button
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors border",
                topic.is_following
                  ? "border-[var(--accent-6)] text-[var(--accent-9)] bg-[var(--accent-2)]"
                  : "border-[var(--gray-6)] text-[var(--gray-11)] hover:border-[var(--gray-7)]",
              )}
              onClick={() =>
                topic.is_following
                  ? unfollowTopic(topic.id)
                  : followTopic(topic.id)
              }
            >
              {topic.is_following ? <Pin size={12} /> : <PinOff size={12} />}
              <span>
                {topic.is_following
                  ? t("layout.topics.following")
                  : t("layout.topics.follow")}
              </span>
            </button>
          </div>
        </div>

        {topic.description && !topic.topic_summary && (
          <p className="text-xs text-[var(--gray-11)] mt-2 leading-relaxed">
            {topic.description}
          </p>
        )}
      </div>


      <div className="flex-1 overflow-auto px-5 py-4">

        {(topic.topic_summary ||
          (topic.description && topic.topic_summary !== undefined)) && (
          <div className="rounded-lg border border-[var(--gray-4)] shadow-level-1 p-3 mb-4 bg-[var(--gray-2)]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles size={12} className="text-[var(--accent-9)]" />
              <span className="text-[11px] font-semibold text-[var(--gray-12)]">
                {t("layout.topics.detail.topic_summary")}
              </span>
            </div>
            <p className="text-[11px] text-[var(--gray-11)] leading-relaxed">
              {topic.topic_summary || topic.description}
            </p>
          </div>
        )}


        {topic.recent_changes && topic.recent_changes.length > 0 && (
          <div className="rounded-lg border border-[var(--gray-4)] shadow-level-1 p-3 mb-4 bg-[var(--color-background)]">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Activity size={12} className="text-[var(--accent-9)]" />
              <span className="text-[11px] font-semibold text-[var(--gray-12)]">
                {t("layout.topics.detail.recent_changes")}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {topic.recent_changes.map((change, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 text-[11px]"
                >
                  <div className="flex flex-col items-center pt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent-9)] shrink-0" />
                    {idx < topic.recent_changes.length - 1 && (
                      <div className="w-px flex-1 bg-[var(--gray-4)] mt-1 min-h-[12px]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--gray-8)] tabular-nums">
                        {formatDate(change.date)}
                      </span>
                      <span className="text-[var(--gray-12)] font-medium truncate">
                        {change.title}
                      </span>
                    </div>
                    <span className="text-[var(--gray-9)]">
                      {t("layout.topics.detail.recent_changes_articles", {
                        count: change.article_count,
                        sources: change.source_count,
                      })}
                    </span>
                    <button
                      className="text-[10px] text-[var(--accent-9)] hover:underline ml-1"
                      onClick={() => {
                        const sourcesSection = document.getElementById("topic-detail-sources");
                        sourcesSection?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      {t("layout.topics.detail.view_evidence")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        <Flex align="center" gap="3" mb="3">
          <Flex align="center" gap="1">
            <FileText size={12} className="text-[var(--gray-9)]" />
            <Text size="1" className="text-[var(--gray-9)]">
              {topic.article_count} {t("layout.topics.detail.articles")}
            </Text>
          </Flex>
          <Flex align="center" gap="1">
            <Rss size={12} className="text-[var(--gray-9)]" />
            <Text size="1" className="text-[var(--gray-9)]">
              {topic.source_count} {t("layout.topics.detail.sources")}
            </Text>
          </Flex>
          <Flex align="center" gap="1">
            <Calendar size={12} className="text-[var(--gray-8)]" />
            <Text size="1" className="text-[var(--gray-8)]">
              {formatDate(topic.first_seen_at)}
            </Text>
          </Flex>
          <Flex align="center" gap="1">
            <Clock size={12} className="text-[var(--gray-8)]" />
            <Text size="1" className="text-[var(--gray-8)]">
              {formatDate(topic.last_updated_at)}
            </Text>
          </Flex>
        </Flex>

        <div className="border-t border-[var(--gray-4)] my-3" />


        <Text
          size="2"
          weight="medium"
          className="text-[var(--gray-12)] block mb-2"
        >
          {t("layout.topics.detail.related_articles")}
        </Text>

        {topic.articles.length === 0 ? (
          <Text size="2" className="text-[var(--gray-9)]">
            {t("layout.topics.detail.no_articles")}
          </Text>
        ) : hasSourceGroups ? (
          <div id="topic-detail-sources" className="flex flex-col gap-3">
            <Text
              size="1"
              weight="medium"
              className="text-[var(--gray-11)]"
            >
              {t("layout.topics.detail.source_groups")}
            </Text>
            {topic.source_groups!.map((group) => (
              <SourceGroup key={group.feed_uuid} group={group} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-[var(--gray-4)] overflow-hidden">
            {topic.articles.map((article) => (
              <TopicArticleItem
                key={article.article_id}
                article={article}
                feedUuid={feedUuidMap.get(article.article_id)}
              />
            ))}
          </div>
        )}


        {topic.articles.length > 0 && (
          <div className="rounded-lg border border-[var(--gray-4)] shadow-level-1 p-3 mt-4 bg-[var(--color-background)]">
            <div className="flex items-center gap-1.5 mb-2.5">
              <BookmarkPlus size={12} className="text-[var(--accent-9)]" />
              <span className="text-[11px] font-semibold text-[var(--gray-12)]">
                {t("layout.topics.detail.start_here")}
              </span>
              <span className="text-[10px] text-[var(--gray-8)] ml-1">
                {t("layout.topics.detail.start_here_desc")}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {[...topic.articles]
                .sort((a, b) => b.relevance_score - a.relevance_score)
                .slice(0, 3)
                .map((article) => {
                  const feedUuid = feedUuidMap.get(article.article_id);
                  return (
                    <div
                      key={article.article_id}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 transition-colors",
                        feedUuid
                          ? "bg-[var(--gray-2)] hover:bg-[var(--gray-3)] cursor-pointer"
                          : "bg-[var(--gray-2)]",
                      )}
                      onClick={() => {
                        if (feedUuid) {
                          navigate(
                            RouteConfig.LOCAL_ARTICLE.replace(
                              ":uuid",
                              feedUuid,
                            ).replace(":id", String(article.article_id)),
                          );
                        }
                      }}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="shrink-0 text-[9px] font-semibold text-[var(--accent-9)] bg-[var(--accent-a3)] rounded-full px-1.5 py-0.5">
                          {t("layout.topics.detail.recommended")}
                        </span>
                        <span className="text-[11px] text-[var(--gray-12)] truncate">
                          {article.title}
                        </span>
                      </div>
                      {feedUuid ? (
                        <span className="text-[10px] text-[var(--gray-8)] shrink-0">
                          {t("layout.topics.detail.read_original")}
                        </span>
                      ) : (
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-0.5 text-[10px] text-[var(--gray-9)] hover:text-[var(--accent-9)] shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={10} />
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
    </aside>
  );
}
