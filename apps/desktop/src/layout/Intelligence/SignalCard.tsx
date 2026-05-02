import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Text, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Signal } from "@/stores/createTodaySlice";
import { RouteConfig } from "@/config";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";
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
  { bg: "bg-[#f0fdf4]", text: "text-[#16a34a]" },
  { bg: "bg-[#fffbeb]", text: "text-[#d97706]" },
  { bg: "bg-[#eff6ff]", text: "text-[#2563eb]" },
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

  const uniqueFeedCount = new Set(signal.sources.map((s) => s.feed_uuid)).size;

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
          ? "border-2 border-[var(--accent-9)] shadow-sm"
          : "border-[var(--gray-4)] hover:border-[var(--gray-7)]"
      }`}
    >
      <Flex direction="column" gap="2">
        <Flex align="center" gap="2">
          <span className="inline-flex items-end gap-[2px]">
            {BAR_CONFIGS.map((bar, i) => (
              <span
                key={i}
                className={`inline-block rounded-[1px] ${
                  i < filledBars ? "bg-[var(--accent-9)]" : "bg-[var(--gray-4)]"
                }`}
                style={{ width: 3, height: bar.height }}
              />
            ))}
          </span>

          {signal.topic_id && signal.topic_title && (
            <Link
              to={RouteConfig.LOCAL_TOPICS}
              className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 w-fit transition-colors ${topicColor?.bg} ${topicColor?.text}`}
            >
              <Layers size={10} />
              {signal.topic_title}
            </Link>
          )}

          <span className="ml-auto text-[11px] text-[var(--gray-8)]">
            {timeAgo} · {signal.source_count} {t("today.signal_card.articles")} · {uniqueFeedCount} {t("today.signal_card.sources")}
          </span>
        </Flex>

        <Text
          size="4"
          weight="medium"
          className="text-[var(--gray-12)] leading-snug cursor-pointer hover:text-[var(--accent-9)] transition-colors"
          style={{ fontSize: 15, fontWeight: 600 }}
          onClick={handleToggleExpand}
        >
          {signal.title}
        </Text>

        {!isDimmed && (
          <Text
            size="2"
            className="text-[var(--gray-11)] leading-[1.6]"
            style={{ fontSize: 13 }}
          >
            {signal.summary}
          </Text>
        )}

        {!isDimmed && !isActive && hasWim && (
          <div className="mt-1">
            <button
              onClick={() => setWimExpanded(!wimExpanded)}
              className="flex items-center gap-1 text-[var(--gray-9)] hover:text-[var(--gray-11)] transition-colors text-xs"
            >
              {wimExpanded ? (
                <ChevronDown size={12} />
              ) : (
                <ChevronUp size={12} />
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
                size="2"
                className="text-[var(--gray-11)] leading-relaxed mt-2 block"
                as="p"
              >
                {signal.why_it_matters}
              </Text>
            </div>
          </div>
        )}

        {!isDimmed && !isActive && (
          <Flex align="center" gap="2" mt="1">
          <span className="text-[10px] text-[var(--gray-9)]">{t("today.signal_card.confidence")}</span>
          <div
            className="rounded-full overflow-hidden"
            style={{ width: 32, height: 4, background: "var(--gray-4)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${percent}%`,
                background: isHighConfidence ? "var(--accent-9)" : "#d97706",
              }}
            />
          </div>
          <span
            className="text-[10px] font-semibold tabular-nums"
            style={{ color: isHighConfidence ? "var(--accent-9)" : "#d97706" }}
          >
            {percent}%
          </span>
          {!isHighConfidence && (
            <span className="text-[10px] font-medium rounded-full px-1.5 py-0.5 bg-[#fffbeb] text-[#d97706]">
              {t("today.signal_card.unverified")}
            </span>
          )}
        </Flex>
        )}

        {!isDimmed && !isActive && (
          <Flex align="center" justify="between" mt="1">
            <button
              onClick={handleToggleExpand}
              className="flex items-center gap-1 text-[var(--gray-9)] hover:text-[var(--gray-11)] transition-colors text-xs"
            >
              <span>{isExpanded ? t("today.sources.collapse") : t("today.sources.expand")}</span>
              {isExpanded ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
          </Flex>
        )}

        {!isDimmed && (
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
        )}

        {!isDimmed && (
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
        )}
      </Flex>
    </div>
  );
}
