import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SignalList } from "../SignalList";
import type { Signal } from "@/stores/createTodaySlice";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

const mockStore = {
  expandedSignalId: null as number | null,
  signalDetails: {},
  toggleSourceExpand: vi.fn(),
  fetchSignalDetail: vi.fn(),
  submitFeedback: vi.fn(),
  clearFeedback: vi.fn(),
  feedbackMap: {},
  scrollPositionMap: {},
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
  SignalSourceList: () => <div data-testid="source-list" />,
}));

const makeSignal = (id: number): Signal => ({
  id,
  title: `Signal ${id}`,
  summary: `Summary ${id}`,
  why_it_matters: `Why ${id}`,
  relevance_score: 0.9,
  source_count: 1,
  sources: [
    {
      article_id: id,
      article_uuid: `article-${id}`,
      title: `Article ${id}`,
      link: `https://example.com/${id}`,
      feed_title: "Feed",
      feed_uuid: `feed-${id}`,
      pub_date: new Date().toISOString(),
      excerpt: null,
    },
  ],
  topic_id: null,
  topic_title: null,
  topic_uuid: null,
  created_at: new Date().toISOString(),
});

describe("SignalList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps every signal card fully interactive while inline reader is open", () => {
    const onInlineRead = vi.fn();
    render(
      <SignalList
        signals={[makeSignal(1), makeSignal(2)]}
        activeReadingSignalId={1}
        activeReadingSourceIndex={0}
        onInlineRead={onInlineRead}
      />,
    );

    const cards = document.querySelectorAll(".today-signal-card");
    expect(cards).toHaveLength(2);
    expect(cards[0]).not.toHaveClass("today-signal-card--active");
    expect(cards[1]).not.toHaveClass("today-signal-card--dimmed");
    expect(cards[1].closest("[data-signal-id]")).toHaveStyle({ opacity: "" });

    const readButtons = screen.getAllByRole("button", {
      name: "today.signal_card.read_evidence",
    });
    expect(readButtons).toHaveLength(2);

    fireEvent.click(readButtons[1]);

    expect(onInlineRead).toHaveBeenCalledWith("article-2", "feed-2", 2);
  });
});
