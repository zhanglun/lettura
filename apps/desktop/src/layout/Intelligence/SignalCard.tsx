import { Text, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { Signal } from "@/stores/createTodaySlice";
import { FileText, Lightbulb, ChevronDown, ChevronUp, Layers } from "lucide-react";

function getSignalLevel(score: number): { label: string; color: string; dotColor: string } {
  if (score >= 0.8) {
    return { label: "High", color: "text-[var(--accent-9)]", dotColor: "bg-[var(--accent-9)]" };
  }
  if (score >= 0.5) {
    return { label: "Medium", color: "text-[var(--amber-9)]", dotColor: "bg-[var(--amber-9)]" };
  }
  return { label: "Low", color: "text-[var(--gray-9)]", dotColor: "bg-[var(--gray-9)]" };
}
import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { RouteConfig } from "@/config";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { SignalSourceList } from "./SignalSourceList";

interface SignalCardProps {
  signal: Signal;
  isActive?: boolean;
  onInlineRead?: (articleUuid: string, feedUuid: string, articleId: number) => void;
}

export function SignalCard({ signal, isActive, onInlineRead }: SignalCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [wimExpanded, setWimExpanded] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const openedArticlesRef = useRef<Set<number>>(new Set());

  const store = useBearStore(
    useShallow((state) => ({
      expandedSignalId: state.expandedSignalId,
      signalDetails: state.signalDetails,
      toggleSourceExpand: state.toggleSourceExpand,
      fetchSignalDetail: state.fetchSignalDetail,
      submitFeedback: state.submitFeedback,
      feedbackMap: state.feedbackMap,
      scrollPositionMap: state.scrollPositionMap,
      setScrollPosition: state.setScrollPosition,
    })),
  );

  const isExpanded = store.expandedSignalId === signal.id;
  const detail = store.signalDetails[signal.id];
  const sources = detail?.all_sources ?? signal.sources;
  const currentFeedback = store.feedbackMap[signal.id] ?? null;

  const level = getSignalLevel(signal.relevance_score);

  const hasWim =
    signal.why_it_matters &&
    signal.why_it_matters !== signal.summary &&
    signal.why_it_matters.trim().length > 0;

  const handleToggleExpand = () => {
    store.toggleSourceExpand(signal.id);
  };

  const handleLoadAll = async () => {
    setDetailLoading(true);
    await store.fetchSignalDetail(signal.id);
    setDetailLoading(false);
  };

  const handleSourceClick = (articleUuid: string, feedUuid: string, articleId: number) => {
    if (openedArticlesRef.current.has(articleId)) return;
    openedArticlesRef.current.add(articleId);
    const scrollContainer = document.querySelector('[data-today-scroll]') as HTMLElement | null;
    if (scrollContainer) {
      store.setScrollPosition(signal.id, scrollContainer.scrollTop);
    }
    const path = RouteConfig.LOCAL_ARTICLE.replace(/:uuid/, feedUuid).replace(
      /:id/,
      articleUuid,
    );
    navigate(path);
  };

  useEffect(() => {
    if (isExpanded && store.scrollPositionMap[signal.id] !== undefined) {
      requestAnimationFrame(() => {
        const scrollContainer = document.querySelector('[data-today-scroll]') as HTMLElement | null;
        if (scrollContainer) {
          scrollContainer.scrollTop = store.scrollPositionMap[signal.id];
        }
      });
    }
  }, [isExpanded]);

  const handleFeedback = async (feedbackType: "useful" | "not_relevant" | "follow_topic") => {
    setIsSubmitting(true);
    try {
      await store.submitFeedback(signal.id, feedbackType);
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`group rounded-lg border bg-[var(--color-background)] p-4 transition-all hover:shadow-sm cursor-default ${
        isActive
          ? "border-[var(--accent-8)] shadow-sm ring-1 ring-[var(--accent-3)]"
          : "border-[var(--gray-4)] hover:border-[var(--gray-7)]"
      }`}
    >
      <Flex direction="column" gap="2">
        <Text
          size="4"
          weight="medium"
          className="text-[var(--gray-12)] leading-snug cursor-pointer hover:text-[var(--accent-9)] transition-colors"
          onClick={handleToggleExpand}
        >
          {signal.title}
        </Text>

        {signal.topic_id && signal.topic_title && (
          <Link
            to={RouteConfig.LOCAL_TOPICS}
            className="inline-flex items-center gap-1 text-xs text-[var(--accent-9)] hover:text-[var(--accent-10)] bg-[var(--accent-3)] rounded px-1.5 py-0.5 w-fit transition-colors"
          >
            <Layers size={12} />
            {signal.topic_title}
          </Link>
        )}

        <Flex align="center" gap="2" mt="1">
          <Flex align="center" gap="1.5">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${level.dotColor}`} />
            <Text size="1" className={level.color}>
              {t(`today.signal_card.level.${level.label.toLowerCase()}`)}
            </Text>
          </Flex>
          <div className="flex items-center gap-1.5 flex-1 max-w-[120px]">
            <div className="flex-1 h-1 rounded-full bg-[var(--gray-3)]">
              <div
                className="h-1 rounded-full bg-[var(--accent-9)] transition-all"
                style={{ width: `${Math.round(signal.relevance_score * 100)}%` }}
              />
            </div>
            <Text size="1" className="text-[var(--gray-8)] tabular-nums">
              {Math.round(signal.relevance_score * 100)}%
            </Text>
          </div>
        </Flex>

        <Text
          size="2"
          className="text-[var(--gray-11)] leading-relaxed line-clamp-2"
        >
          {signal.summary}
        </Text>

        {hasWim && (
          <div className="mt-1">
            <button
              onClick={() => setWimExpanded(!wimExpanded)}
              className="flex items-center gap-1 text-[var(--gray-9)] hover:text-[var(--gray-11)] transition-colors text-sm"
            >
              <Lightbulb size={14} />
              <span>{t("today.why_short")}</span>
              {wimExpanded ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
            <div
              className="overflow-hidden transition-all duration-200 ease-in-out"
              style={{
                maxHeight: wimExpanded ? "200px" : "0px",
                opacity: wimExpanded ? 1 : 0,
              }}
            >
              <Text
                size="2"
                className="text-[var(--gray-11)] leading-relaxed mt-2 block"
                as="p"
              >
                {signal.why_it_matters}
              </Text>
            </div>
          </div>
        )}

        <Flex align="center" justify="between" mt="1">
          <Flex align="center" gap="2">
            <FileText size={14} className="text-[var(--gray-9)]" />
            <Text size="1" className="text-[var(--gray-9)]">
              {signal.source_count} {t("today.signal_card.articles")} ·{" "}
              {new Set(signal.sources.map((s) => s.feed_uuid)).size}{" "}
              {t("today.signal_card.sources")}
            </Text>
          </Flex>
          <button
            onClick={handleToggleExpand}
            className="flex items-center gap-1 text-[var(--gray-9)] hover:text-[var(--gray-11)] transition-colors text-sm"
          >
            <span>{isExpanded ? t("today.sources.collapse") : t("today.sources.expand")}</span>
            {isExpanded ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </button>
        </Flex>

        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: isExpanded ? "2000px" : "0px",
            opacity: isExpanded ? 1 : 0,
          }}
        >
          <SignalSourceList
            sources={sources}
            onSourceClick={handleSourceClick}
            onLoadAll={handleLoadAll}
            loading={detailLoading}
            onInlineRead={onInlineRead}
          />
        </div>

        <Flex align="center" gap="3" mt="2" pt="2" className="border-t border-[var(--gray-4)]">
          <button
            onClick={() => handleFeedback("useful")}
            disabled={isSubmitting || !!currentFeedback}
            className={`flex items-center gap-1 text-xs transition-colors disabled:opacity-50 ${
              currentFeedback === "useful"
                ? "text-[var(--accent-9)] font-medium"
                : "text-[var(--gray-9)] hover:text-[var(--gray-11)]"
            }`}
          >
            👍 {t("today.feedback.useful")}
          </button>
          <button
            onClick={() => handleFeedback("not_relevant")}
            disabled={isSubmitting || !!currentFeedback}
            className={`flex items-center gap-1 text-xs transition-colors disabled:opacity-50 ${
              currentFeedback === "not_relevant"
                ? "text-[var(--accent-9)] font-medium"
                : "text-[var(--gray-9)] hover:text-[var(--gray-11)]"
            }`}
          >
            👎 {t("today.feedback.not_relevant")}
          </button>
          <button
            onClick={() => handleFeedback("follow_topic")}
            disabled={isSubmitting || !!currentFeedback}
            className={`flex items-center gap-1 text-xs transition-colors disabled:opacity-50 ${
              currentFeedback === "follow_topic"
                ? "text-[var(--accent-9)] font-medium"
                : "text-[var(--gray-9)] hover:text-[var(--gray-11)]"
            }`}
          >
            📌 {t("today.feedback.follow_topic")}
          </button>
        </Flex>
      </Flex>
    </div>
  );
}
