import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Text, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Signal } from "@/stores/createTodaySlice";
import { RouteConfig } from "@/config";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { ChevronDown, ChevronRight } from "lucide-react";
import { SignalSourceList } from "./SignalSourceList";

type SignalLevel = "high" | "medium" | "low";

function getSignalLevel(score: number): SignalLevel {
  if (score >= 0.8) return "high";
  if (score >= 0.5) return "medium";
  return "low";
}

const BAR_CONFIGS = [
  { height: 8 },
  { height: 12 },
  { height: 16 },
];

const TOPIC_COLORS = [
  { bg: "bg-[var(--accent-3)]", text: "text-[var(--accent-9)]" },
  { bg: "bg-[var(--green-3)]", text: "text-[var(--green-11)]" },
  { bg: "bg-[var(--amber-3)]", text: "text-[var(--amber-11)]" },
  { bg: "bg-[var(--blue-3)]", text: "text-[var(--blue-11)]" },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getTopicColor(topicTitle: string) {
  return TOPIC_COLORS[hashString(topicTitle) % TOPIC_COLORS.length];
}

interface SignalCardProps {
  signal: Signal;
  isActive?: boolean;
  isDimmed?: boolean;
  onInlineRead?: (articleUuid: string, feedUuid: string, articleId: number) => void;
  activeReadingSourceIndex?: number;
}

export function SignalCard({ signal, isActive, isDimmed, onInlineRead, activeReadingSourceIndex }: SignalCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [wimExpanded, setWimExpanded] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const openedArticlesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    openedArticlesRef.current.clear();
  }, [signal.id]);

  const store = useBearStore(
    useShallow((state) => ({
      expandedSignalId: state.expandedSignalId,
      signalDetails: state.signalDetails,
      toggleSourceExpand: state.toggleSourceExpand,
      fetchSignalDetail: state.fetchSignalDetail,
      submitFeedback: state.submitFeedback,
      clearFeedback: state.clearFeedback,
      feedbackMap: state.feedbackMap,
      scrollPositionMap: state.scrollPositionMap,
      setScrollPosition: state.setScrollPosition,
    })),
  );

  const isExpanded = isActive || store.expandedSignalId === signal.id;
  const detail = store.signalDetails[signal.id];
  const sources = detail?.all_sources ?? signal.sources;
  const currentFeedback = store.feedbackMap[signal.id] ?? null;

  const level = getSignalLevel(signal.relevance_score);
  const filledBars = level === "high" ? 3 : level === "medium" ? 2 : 1;
  const isHighConfidence = level === "high";
  const percent = Math.round(signal.relevance_score * 100);

  const hasWim =
    signal.why_it_matters &&
    signal.why_it_matters !== signal.summary &&
    signal.why_it_matters.trim().length > 0;

  const timeAgo = formatDistanceToNow(parseISO(signal.created_at), { addSuffix: true });

  const topicColor = signal.topic_title ? getTopicColor(signal.topic_title) : null;

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

  const handleReadEvidence = () => {
    const source = sources[0];
    if (!source) return;
    if (onInlineRead) {
      onInlineRead(source.article_uuid, source.feed_uuid, source.article_id);
    } else {
      handleSourceClick(source.article_uuid, source.feed_uuid, source.article_id);
    }
  };

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
      className={`today-signal-card cursor-default ${
        currentFeedback === "not_relevant" ? "opacity-50" : ""
      } ${
        isActive
          ? "today-signal-card--active"
          : ""
      } ${
        isDimmed ? "today-signal-card--dimmed" : ""
      }`}
    >
      <Flex direction="column" gap="2">
        <Flex align="center" gap="2" className="today-signal-head">
          <span className="today-signal-bars">
            {BAR_CONFIGS.map((bar, i) => (
              <span
                key={i}
                className={`today-signal-bar ${
                  i < filledBars ? "bg-[var(--accent-9)]" : "bg-[var(--gray-4)]"
                }`}
                style={{ width: 3, height: bar.height }}
              />
            ))}
          </span>

          {signal.topic_id && signal.topic_title && signal.topic_uuid && (
            <Link
              to={`${RouteConfig.LOCAL_TOPICS}/${signal.topic_uuid}`}
              className={`today-signal-tag ${topicColor?.bg} ${topicColor?.text}`}
            >
              {signal.topic_title}
            </Link>
          )}
          {signal.topic_id && signal.topic_title && !signal.topic_uuid && (
            <span
              className={`today-signal-tag ${topicColor?.bg} ${topicColor?.text}`}
            >
              {signal.topic_title}
            </span>
          )}

          <span className="today-signal-meta">
            {timeAgo} · {signal.source_count} {t("today.signal_card.articles")} · {percent}%
          </span>
        </Flex>

        <Text
          className={`today-signal-title ${
            currentFeedback === "not_relevant" ? "line-through" : ""
          }`}
          onClick={handleToggleExpand}
        >
          {signal.title}
        </Text>

        {!isDimmed && (
          <Text
            className="today-signal-summary"
          >
            {signal.summary}
          </Text>
        )}

        {!isDimmed && !isActive && hasWim && (
          <div className="mt-1">
            <button
              onClick={() => setWimExpanded(!wimExpanded)}
              className="today-wim-toggle"
            >
              {wimExpanded ? (
                <ChevronDown size={12} />
              ) : (
                <ChevronRight size={12} />
              )}
              <span>{t("today.why_short")}</span>
            </button>
            <div
              className="overflow-hidden transition-all duration-200 ease-in-out"
              style={{
                maxHeight: wimExpanded ? "200px" : "0px",
                opacity: wimExpanded ? 1 : 0,
              }}
            >
              <Text
                className="today-signal-why block"
                as="p"
              >
                {signal.why_it_matters}
              </Text>
            </div>
          </div>
        )}

        {!isDimmed && !isActive && (
          <div className="today-confidence-row">
          <div className="today-confidence">
            <span className="today-confidence-label">{t("today.signal_card.confidence")}</span>
            <div className="today-confidence-bar">
              <div
                className="today-confidence-fill"
                style={{
                  width: `${percent}%`,
                  background: isHighConfidence ? "var(--workbench-accent)" : "var(--workbench-amber)",
                }}
              />
            </div>
            <span className="today-confidence-value">{percent}%</span>
          </div>
          {!isHighConfidence && (
            <span className="text-[10px] font-medium rounded-full px-1.5 py-0.5 bg-[var(--amber-3)] text-[var(--amber-11)]">
              {t("today.signal_card.unverified")}
            </span>
          )}
        </div>
        )}

        {!isDimmed && sources.length > 0 && (
          <div className="today-signal-actions">
            <button
              type="button"
              className="today-signal-primary-action"
              onClick={handleReadEvidence}
            >
              {t("today.signal_card.read_evidence")}
            </button>
            <button
              type="button"
              className="today-signal-secondary-action"
              onClick={handleToggleExpand}
            >
              {t("today.signal_card.view_sources")}
            </button>
          </div>
        )}

        <div className="overflow-hidden transition-all duration-300 ease-in-out"
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
            activeReadingSourceIndex={isActive ? activeReadingSourceIndex : undefined}
            isActive={isActive}
          />
        </div>

        {!isDimmed && (
        <div className="today-feedback-row">
            <button
              onClick={() => handleFeedback("useful")}
              disabled={isSubmitting || !!currentFeedback}
              className={`today-feedback-button ${
                currentFeedback === "useful"
                  ? "text-[var(--accent-9)] font-medium"
                  : ""
              }`}
            >
              👍 {t("today.feedback.useful")}
            </button>
            <button
              onClick={() => handleFeedback("not_relevant")}
              disabled={isSubmitting || !!currentFeedback}
              className={`today-feedback-button ${
                currentFeedback === "not_relevant"
                  ? "text-[var(--accent-9)] font-medium"
                  : ""
              }`}
            >
              👎 {t("today.feedback.not_relevant")}
            </button>
            <button
              onClick={() => handleFeedback("follow_topic")}
              disabled={isSubmitting || !!currentFeedback}
              className={`today-feedback-button ${
                currentFeedback === "follow_topic"
                  ? "text-[var(--accent-9)] font-medium"
                  : ""
              }`}
            >
              📌 {t("today.feedback.follow_topic")}
            </button>
            {currentFeedback && (
              <button
                onClick={() => store.clearFeedback(signal.id)}
                className="today-feedback-button"
              >
                {t("today.feedback.undo")}
              </button>
            )}
        </div>
        )}
      </Flex>
    </div>
  );
}
