import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { TodayContent } from "../TodayContent";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

vi.mock("../TodayHeader", () => ({
  TodayHeader: () => <div data-testid="today-header" />,
}));

vi.mock("../TodayOverview", () => ({
  TodayOverview: () => <div data-testid="today-overview" />,
}));

vi.mock("../SignalList", () => ({
  SignalList: ({ signals }: { signals: Array<{ id: number; title: string }> }) => (
    <div>
      {signals.map((signal) => (
        <div key={signal.id} data-signal-id={signal.id}>
          {signal.title}
        </div>
      ))}
    </div>
  ),
}));

const mockStore = {
  signals: [
    {
      id: 1,
      title: "First Signal",
      summary: "Summary",
      why_it_matters: "Why",
      relevance_score: 0.9,
      source_count: 1,
      sources: [],
      topic_id: null,
      topic_title: null,
      topic_uuid: null,
      created_at: "2026-01-01T00:00:00.000Z",
    },
    {
      id: 2,
      title: "Second Signal",
      summary: "Summary",
      why_it_matters: "Why",
      relevance_score: 0.8,
      source_count: 1,
      sources: [],
      topic_id: null,
      topic_title: null,
      topic_uuid: null,
      created_at: "2026-01-01T00:00:00.000Z",
    },
  ],
  signalsLoading: false,
  signalsError: null,
  aiConfig: { has_api_key: true },
  subscribes: [{ uuid: "feed-1" }],
  fetchSignals: vi.fn(),
  triggerPipeline: vi.fn(),
  updateSettingDialogStatus: vi.fn(),
  overview: { article_count: 2, signal_count: 2 },
  overviewLoading: false,
  overviewError: null,
  expandedSignalId: 2,
  pendingFocusSignalId: 2,
  clearPendingFocusSignal: vi.fn(),
  activeReadingSignalId: null,
  activeReadingSourceIndex: 0,
  pipelineStatus: "idle",
  pipelineError: null,
  lastUpdated: null,
  startInlineReading: vi.fn(),
  signalDetails: {},
  openSourceArticle: vi.fn(),
  scrollPositionMap: { 2: 880 },
};

vi.mock("@/stores", () => ({
  useBearStore: (selector: (state: typeof mockStore) => unknown) => selector(mockStore),
}));

vi.mock("zustand/react/shallow", () => ({
  useShallow: (selector: unknown) => selector,
}));

describe("TodayContent focus scrolling", () => {
  const scrollIntoView = vi.fn();
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalScrollIntoView = Element.prototype.scrollIntoView;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.pendingFocusSignalId = 2;
    Element.prototype.scrollIntoView = scrollIntoView;
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    }) as typeof requestAnimationFrame;
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    Element.prototype.scrollIntoView = originalScrollIntoView;
  });

  it("scrolls the middle list to the focused signal instead of restoring a stale scroll position", async () => {
    render(<TodayContent />);

    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });
    });
    expect(mockStore.clearPendingFocusSignal).toHaveBeenCalledOnce();
  });
});
