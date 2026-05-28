import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SignalCard } from "../SignalCard";
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
  signalDetails: {} as Record<number, unknown>,
  toggleSourceExpand: vi.fn(),
  fetchSignalDetail: vi.fn(),
  submitFeedback: vi.fn(),
  feedbackMap: {} as Record<number, string | null>,
  scrollPositionMap: {} as Record<number, number>,
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
  topic_uuid: null,
  created_at: new Date().toISOString(),
  ...overrides,
});

const getCssRule = (css: string, selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped}\\s*\\{(?<body>[^}]+)\\}`))?.groups
    ?.body ?? "";
};

describe("SignalCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.expandedSignalId = null;
    mockStore.signalDetails = {};
    mockStore.toggleSourceExpand = vi.fn();
    mockStore.fetchSignalDetail = vi.fn();
  });

  describe("Why It Matters (WIM)", () => {
    it("keeps card border and hover styles aligned with the mockup", () => {
      const css = readFileSync(
        join(process.cwd(), "src/styles/custom-components.css"),
        "utf8",
      );

      const cardRule = getCssRule(css, ".today-signal-card");
      const hoverRule = getCssRule(css, ".today-signal-card:hover");
      const activeRule = getCssRule(css, ".today-signal-card--active");
      const activeHoverRule = getCssRule(css, ".today-signal-card--active:hover");

      expect(cardRule).toContain("border: 1px solid var(--workbench-border);");
      expect(cardRule).toContain("border-radius: var(--workbench-card-radius);");
      expect(cardRule).toContain("transition: all 0.15s;");
      expect(hoverRule).toContain("border-color: var(--workbench-border-hover);");
      expect(hoverRule).toContain("box-shadow: var(--workbench-shadow-hover);");
      expect(activeRule).toContain("border-color: var(--workbench-accent);");
      expect(activeRule).not.toContain("border-width");
      expect(activeHoverRule).toContain("border-color: var(--workbench-accent);");
    });

    it("uses the judgment-desk signal card structure", () => {
      const signal = makeSignal({
        topic_id: 1,
        topic_title: "AI Agent",
        topic_uuid: "topic-1",
        relevance_score: 0.85,
      });
      render(<SignalCard signal={signal} />);

      expect(screen.getByText(signal.title).closest(".today-signal-card")).toBeInTheDocument();
      expect(screen.getByText(signal.title).className).toContain("today-signal-title");
      expect(screen.getByText(signal.summary).className).toContain("today-signal-summary");
      expect(screen.getByText("AI Agent").className).toContain("today-signal-tag");
      expect(screen.getAllByText(/85%/)).toHaveLength(2);
      expect(screen.getAllByText(/85%/)[1].className).toContain("today-confidence-value");
      expect(screen.getByText("today.why_short").closest("button")?.className).toContain("today-wim-toggle");
      expect(screen.getByRole("button", { name: /today.feedback.useful/ }).className).toContain("today-feedback-button");
      expect(screen.queryByText("today.sources.expand")).not.toBeInTheDocument();
    });

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
    it("T-SRC-01: sources collapsed by default (expandedSignalId is null)", () => {
      const signal = makeSignal();
      mockStore.expandedSignalId = null;
      render(<SignalCard signal={signal} />);

      const sourceListContainer = screen.getByTestId("source-list").parentElement;
      expect(sourceListContainer).toHaveStyle({ maxHeight: "0px", opacity: "0" });
    });

    it("T-SRC-02: expanding shows SignalSourceList, collapsing hides it", () => {
      const signal = makeSignal();
      mockStore.expandedSignalId = signal.id;
      const { rerender } = render(<SignalCard signal={signal} />);

      const sourceListContainer = screen.getByTestId("source-list").parentElement;
      expect(sourceListContainer).toHaveStyle({ maxHeight: "2000px", opacity: "1" });

      mockStore.expandedSignalId = null;
      rerender(<SignalCard signal={signal} />);
      expect(screen.getByTestId("source-list").parentElement).toHaveStyle({ maxHeight: "0px", opacity: "0" });
    });

    it("T-SRC-03: clicking title calls toggleSourceExpand", () => {
      const signal = makeSignal();
      mockStore.expandedSignalId = signal.id;
      render(<SignalCard signal={signal} />);

      fireEvent.click(screen.getByText(signal.title));

      expect(mockStore.toggleSourceExpand).toHaveBeenCalledWith(signal.id);
    });

    it("T-SRC-04: clicking read evidence opens the first source inline", () => {
      const signal = makeSignal();
      const onInlineRead = vi.fn();

      render(<SignalCard signal={signal} onInlineRead={onInlineRead} />);

      fireEvent.click(screen.getByRole("button", { name: "today.signal_card.read_evidence" }));

      expect(onInlineRead).toHaveBeenCalledWith("art-1", "feed-1", 1);
    });

    it("T-SRC-05: clicking view sources expands the source list", () => {
      const signal = makeSignal();

      render(<SignalCard signal={signal} />);

      fireEvent.click(screen.getByRole("button", { name: "today.signal_card.view_sources" }));

      expect(mockStore.toggleSourceExpand).toHaveBeenCalledWith(signal.id);
    });
  });

  describe("Topic tag link safety", () => {
    it("should not link to /local/topics/null when topic_uuid is null", () => {
      const signal = makeSignal({
        topic_id: 1,
        topic_title: "Test Topic",
        topic_uuid: null,
      });
      render(<SignalCard signal={signal} />);

      const links = screen.queryAllByRole("link");
      const topicLinks = links.filter((l) => l.getAttribute("href")?.includes("/local/topics/"));
      expect(topicLinks).toHaveLength(0);
      expect(screen.getByText("Test Topic")).toBeInTheDocument();
    });

    it("should link to topic detail when topic_uuid exists", () => {
      const signal = makeSignal({
        topic_id: 1,
        topic_title: "Test Topic",
        topic_uuid: "abc-123",
      });
      render(<SignalCard signal={signal} />);

      const link = screen.getByRole("link", { name: /Test Topic/ });
      expect(link).toHaveAttribute("href", "/local/topics/abc-123");
    });
  });
});
