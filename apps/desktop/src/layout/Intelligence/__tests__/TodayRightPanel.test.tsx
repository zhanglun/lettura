import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TodayRightPanel } from "../TodayRightPanel";

const mockStore = {
  isInlineReading: false,
  rightPanelExpanded: false,
  activeReadingSignalId: null as number | null,
  activeReadingSourceIndex: 0,
  expandedSignalId: null as number | null,
  signalDetails: {},
  sourceArticleDetail: null,
  sourceArticleLoading: false,
  sourceArticleError: null,
  startInlineReading: vi.fn(),
  closeInlineReading: vi.fn(),
  navigateReadingSource: vi.fn(),
  openSourceArticle: vi.fn(),
  closeSourceArticle: vi.fn(),
  retrySourceArticle: vi.fn(),
  signals: [
    {
      id: 1,
      title: "First Signal",
      summary: "First summary",
      why_it_matters: "First reason",
      relevance_score: 0.9,
      source_count: 1,
      sources: [
        {
          article_id: 1,
          article_uuid: "article-1",
          title: "First Source",
          link: "https://example.com/first",
          feed_title: "Feed A",
          feed_uuid: "feed-a",
          pub_date: "2026-05-01T00:00:00Z",
          excerpt: null,
        },
      ],
      topic_id: null,
      topic_title: null,
      topic_uuid: null,
      created_at: "2026-05-01T00:00:00Z",
    },
    {
      id: 2,
      title: "Expanded Signal",
      summary: "Expanded summary",
      why_it_matters: "Expanded reason",
      relevance_score: 0.7,
      source_count: 1,
      sources: [
        {
          article_id: 2,
          article_uuid: "article-2",
          title: "Expanded Source",
          link: "https://example.com/expanded",
          feed_title: "Feed B",
          feed_uuid: "feed-b",
          pub_date: "2026-05-01T00:00:00Z",
          excerpt: null,
        },
      ],
      topic_id: null,
      topic_title: null,
      topic_uuid: null,
      created_at: "2026-05-01T00:00:00Z",
    },
  ],
  overview: null,
  overviewLoading: false,
  pipelineStatus: "idle",
  pipelineProgress: 0,
  aiConfig: { has_api_key: true },
  updateSettingDialogStatus: vi.fn(),
};

vi.mock("@/stores", () => ({
  useBearStore: (selector: (state: typeof mockStore) => unknown) => selector(mockStore),
}));

vi.mock("zustand/react/shallow", () => ({
  useShallow: (selector: unknown) => selector,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

describe("TodayRightPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.expandedSignalId = null;
  });

  it("uses the expanded signal as the evidence context", () => {
    mockStore.expandedSignalId = 2;

    render(<TodayRightPanel />);

    expect(screen.getByText("Expanded Source")).toBeInTheDocument();
    expect(screen.queryByText("First Source")).not.toBeInTheDocument();
  });

  it("opens inline reader from a right-panel evidence item", () => {
    mockStore.expandedSignalId = 2;

    render(<TodayRightPanel />);

    fireEvent.click(screen.getByRole("button", { name: /Expanded Source/ }));

    expect(mockStore.startInlineReading).toHaveBeenCalledWith(2, 0);
    expect(mockStore.openSourceArticle).toHaveBeenCalledWith(
      mockStore.signals[1].sources[0],
    );
  });
});
