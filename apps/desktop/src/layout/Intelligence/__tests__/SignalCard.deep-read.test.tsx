import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SignalCard } from "../SignalCard";
import type { Signal } from "@/stores/createTodaySlice";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

const mockStore = {
  expandedSignalId: null as number | null,
  signalDetails: {} as Record<number, unknown>,
  feedbackMap: {} as Record<number, string | null>,
  toggleSourceExpand: vi.fn(),
  fetchSignalDetail: vi.fn(),
  submitFeedback: vi.fn(),
  setScrollPosition: vi.fn(),
};

vi.mock("@/stores", () => ({
  useBearStore: (selector: (state: typeof mockStore) => unknown) =>
    selector(mockStore),
}));

vi.mock("zustand/react/shallow", () => ({
  useShallow: (selector: unknown) => selector,
}));

vi.mock("../SignalSourceList", () => ({
  SignalSourceList: ({ sources, onSourceClick }: { sources: unknown[]; onSourceClick: (a: string, b: string, c: number) => void }) => (
    <div data-testid="source-list">
      Sources: {sources.length}
      <button data-testid="source-read-btn" onClick={() => onSourceClick("art-1", "feed-1", 1)}>
        Read
      </button>
    </div>
  ),
}));

const makeSignal = (overrides: Partial<Signal> = {}): Signal => ({
  id: 1,
  title: "Test Signal",
  summary: "A test summary",
  why_it_matters: "This matters because...",
  relevance_score: 0.9,
  source_count: 2,
  sources: [
    {
      article_id: 1,
      article_uuid: "art-1",
      title: "Article 1",
      link: "https://example.com/1",
      feed_title: "Feed",
      feed_uuid: "feed-1",
      pub_date: new Date().toISOString(),
      excerpt: null,
    },
    {
      article_id: 2,
      article_uuid: "art-2",
      title: "Article 2",
      link: "https://example.com/2",
      feed_title: "Feed",
      feed_uuid: "feed-1",
      pub_date: new Date().toISOString(),
      excerpt: null,
    },
  ],
  topic_id: null,
  topic_title: null,
  created_at: new Date().toISOString(),
  ...overrides,
});

describe("SignalCard — deep read interaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.expandedSignalId = null;
    mockStore.signalDetails = {};
    mockStore.feedbackMap = {};
    mockStore.toggleSourceExpand = vi.fn();
    mockStore.fetchSignalDetail = vi.fn();
    mockStore.submitFeedback = vi.fn();
    mockStore.setScrollPosition = vi.fn();
    mockNavigate.mockClear();
  });

  it("T-F07: clicking title toggles source list expand", () => {
    const signal = makeSignal();
    render(<SignalCard signal={signal} />);

    const titleButton = screen.getByText("Test Signal").closest("button");
    expect(titleButton).toBeInTheDocument();
    fireEvent.click(titleButton!);

    expect(mockStore.toggleSourceExpand).toHaveBeenCalledWith(signal.id);
  });

  it("T-F08: clicking title again collapses source list", () => {
    const signal = makeSignal();
    mockStore.expandedSignalId = signal.id;
    render(<SignalCard signal={signal} />);

    const titleButton = screen.getByText("Test Signal").closest("button");
    fireEvent.click(titleButton!);

    expect(mockStore.toggleSourceExpand).toHaveBeenCalledWith(signal.id);
  });

  it("T-F11: clicking read button navigates to article", () => {
    const signal = makeSignal();
    mockStore.expandedSignalId = signal.id;
    render(<SignalCard signal={signal} />);

    fireEvent.click(screen.getByTestId("source-read-btn"));

    expect(mockNavigate).toHaveBeenCalled();
  });

  it("T-F12: clicking same article twice does not navigate twice", () => {
    const signal = makeSignal();
    mockStore.expandedSignalId = signal.id;
    render(<SignalCard signal={signal} />);

    fireEvent.click(screen.getByTestId("source-read-btn"));
    expect(mockNavigate).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("source-read-btn"));
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });
});
