import { Text, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { Signal } from "@/stores/createTodaySlice";
import { FileText, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RouteConfig } from "@/config";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { SignalSourceList } from "./SignalSourceList";

interface SignalCardProps {
  signal: Signal;
}

export function SignalCard({ signal }: SignalCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [wimExpanded, setWimExpanded] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const store = useBearStore(
    useShallow((state) => ({
      expandedSignalId: state.expandedSignalId,
      signalDetails: state.signalDetails,
      toggleSourceExpand: state.toggleSourceExpand,
      fetchSignalDetail: state.fetchSignalDetail,
    })),
  );

  const isExpanded = store.expandedSignalId === signal.id;
  const detail = store.signalDetails[signal.id];
  const sources = detail?.all_sources ?? signal.sources;

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

  const handleSourceClick = (articleUuid: string, feedUuid: string) => {
    const path = RouteConfig.LOCAL_ARTICLE.replace(/:uuid/, feedUuid).replace(
      /:id/,
      articleUuid,
    );
    navigate(path);
  };

  return (
    <div className="group rounded-lg border border-[var(--gray-4)] bg-[var(--color-background)] p-4 transition-all hover:border-[var(--gray-7)] hover:shadow-sm cursor-default">
      <Flex direction="column" gap="2">
        <Text
          size="4"
          weight="medium"
          className="text-[var(--gray-12)] leading-snug"
        >
          {signal.title}
        </Text>

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
          />
        </div>
      </Flex>
    </div>
  );
}
