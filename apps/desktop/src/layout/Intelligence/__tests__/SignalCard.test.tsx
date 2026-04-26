import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SignalCard } from "../SignalCard";
import type { Signal } from "@/stores/createTodaySlice";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
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
  toggleSourceExpand: vi.fn(),
  fetchSignalDetail: vi.fn(),
};

vi.mock("@/stores", () => ({
  useBearStore: (selector: (state: typeof mockStore) => unknown) =>
    selector(mockStore),
}));

vi.mock("zustand/react/shallow", () => ({
  useShallow: (selector: unknown) => selector,
}));

vi.mock("../SignalSourceList", () => ({
  SignalSourceList: ({ sources }: { sources: unknown[] }) => (
    <div data-testid="source-list">Sources: {sources.length}</div>
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

describe("SignalCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.expandedSignalId = null;
    mockStore.signalDetails = {};
    mockStore.toggleSourceExpand = vi.fn();
    mockStore.fetchSignalDetail = vi.fn();
  });

  describe("Why It Matters (WIM)", () => {
    it("T-WIM-01: shows Why button when why_it_matters is non-empty and differs from summary", () => {
      const signal = makeSignal();
      render(<SignalCard signal={signal} />);

      expect(screen.getByText("today.why_short")).toBeInTheDocument();
    });

    it("T-WIM-02: clicking Why button expands WIM text", () => {
      const signal = makeSignal();
      render(<SignalCard signal={signal} />);

      const whyButton = screen.getByText("today.why_short");
      fireEvent.click(whyButton);

      expect(screen.getByText(signal.why_it_matters)).toBeInTheDocument();
    });

    it("T-WIM-03: clicking Why button again collapses WIM text", () => {
      const signal = makeSignal();
      render(<SignalCard signal={signal} />);

      const whyButton = screen.getByText("today.why_short");
      fireEvent.click(whyButton);
      expect(screen.getByText(signal.why_it_matters)).toBeInTheDocument();

      fireEvent.click(whyButton);
      const wimContainer = screen.getByText(signal.why_it_matters).closest("div");
      expect(wimContainer).toHaveStyle({ maxHeight: "0px", opacity: "0" });
    });

    it("T-WIM-04: WIM area hidden when why_it_matters is empty string", () => {
      const signal = makeSignal({ why_it_matters: "" });
      render(<SignalCard signal={signal} />);

      expect(screen.queryByText("today.why_short")).not.toBeInTheDocument();
    });

    it("T-WIM-05: WIM area hidden when why_it_matters equals summary", () => {
      const signal = makeSignal({
        why_it_matters: "same text",
        summary: "same text",
      });
      render(<SignalCard signal={signal} />);

      expect(screen.queryByText("today.why_short")).not.toBeInTheDocument();
    });

    it("T-WIM-06: WIM text content matches why_it_matters value", () => {
      const customWim = "Custom reason why this matters deeply";
      const signal = makeSignal({ why_it_matters: customWim });
      render(<SignalCard signal={signal} />);

      fireEvent.click(screen.getByText("today.why_short"));

      expect(screen.getByText(customWim)).toBeInTheDocument();
    });
  });

  describe("Source expand/collapse", () => {
    it("T-SRC-01: sources not expanded by default", () => {
      const signal = makeSignal();
      render(<SignalCard signal={signal} />);

      const sourceListContainer = screen.getByTestId("source-list").parentElement;
      expect(sourceListContainer).toHaveStyle({ maxHeight: "0px", opacity: "0" });
    });

    it("T-SRC-02: clicking expand shows SignalSourceList with expanded styles", () => {
      const signal = makeSignal();
      mockStore.expandedSignalId = signal.id;
      const { rerender } = render(<SignalCard signal={signal} />);

      const sourceListContainer = screen.getByTestId("source-list").parentElement;
      expect(sourceListContainer).toHaveStyle({ maxHeight: "2000px", opacity: "1" });
      expect(screen.getByText("Sources: 2")).toBeInTheDocument();

      mockStore.expandedSignalId = null;
      rerender(<SignalCard signal={signal} />);
      expect(screen.getByTestId("source-list").parentElement).toHaveStyle({ maxHeight: "0px", opacity: "0" });
    });

    it("T-SRC-03: clicking expand button calls toggleSourceExpand", () => {
      const signal = makeSignal();
      render(<SignalCard signal={signal} />);

      const expandButton = screen.getByText("today.sources.expand");
      fireEvent.click(expandButton);

      expect(mockStore.toggleSourceExpand).toHaveBeenCalledWith(signal.id);
    });
  });
});
