import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InlineReader } from "../InlineReader";
import type { SignalSource } from "@/stores/createTodaySlice";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

const mockSource: SignalSource = {
  article_id: 1,
  article_uuid: "uuid-1",
  title: "Test Article Title",
  link: "https://example.com/article",
  feed_title: "Test Feed",
  feed_uuid: "feed-uuid",
  pub_date: "2026-04-30T10:00:00Z",
  excerpt: "Short excerpt of the article",
};

const mockSources: SignalSource[] = [
  mockSource,
  {
    article_id: 2,
    article_uuid: "uuid-2",
    title: "Second Article",
    link: "https://example.com/article2",
    feed_title: "Feed B",
    feed_uuid: "feed-b",
    pub_date: "2026-04-30T11:00:00Z",
    excerpt: null,
  },
  {
    article_id: 3,
    article_uuid: "uuid-3",
    title: "Third Article",
    link: "https://example.com/article3",
    feed_title: "Feed C",
    feed_uuid: "feed-c",
    pub_date: "2026-04-30T12:00:00Z",
    excerpt: null,
  },
];

describe("InlineReader", () => {
  it("should render back button", () => {
    render(
      <InlineReader
        source={mockSource}
        sources={mockSources}
        currentIndex={0}
        onBack={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    expect(screen.getByText("today.inline_reader.back")).toBeInTheDocument();
  });

  it("should render article title and feed name", () => {
    render(
      <InlineReader
        source={mockSource}
        sources={mockSources}
        currentIndex={0}
        onBack={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    expect(screen.getByText("Test Article Title")).toBeInTheDocument();
    expect(screen.getByText("Test Feed")).toBeInTheDocument();
  });

  it("should call onBack when back button is clicked", () => {
    const onBack = vi.fn();
    render(
      <InlineReader
        source={mockSource}
        sources={mockSources}
        currentIndex={0}
        onBack={onBack}
        onNavigate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("today.inline_reader.back"));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("should call onNavigate with next index when next button clicked", () => {
    const onNavigate = vi.fn();
    render(
      <InlineReader
        source={mockSource}
        sources={mockSources}
        currentIndex={0}
        onBack={vi.fn()}
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByText("today.inline_reader.next"));
    expect(onNavigate).toHaveBeenCalledWith(1);
  });

  it("should call onNavigate with previous index when prev button clicked", () => {
    const onNavigate = vi.fn();
    render(
      <InlineReader
        source={mockSource}
        sources={mockSources}
        currentIndex={1}
        onBack={vi.fn()}
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByText("today.inline_reader.prev"));
    expect(onNavigate).toHaveBeenCalledWith(0);
  });

  it("should disable prev button at first source", () => {
    render(
      <InlineReader
        source={mockSource}
        sources={mockSources}
        currentIndex={0}
        onBack={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    const prevButton = screen.getByText("today.inline_reader.prev").closest("button")!;
    expect(prevButton.disabled).toBe(true);
  });

  it("should disable next button at last source", () => {
    render(
      <InlineReader
        source={mockSource}
        sources={mockSources}
        currentIndex={2}
        onBack={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    const nextButton = screen.getByText("today.inline_reader.next").closest("button")!;
    expect(nextButton.disabled).toBe(true);
  });

  it("should show source position indicator", () => {
    render(
      <InlineReader
        source={mockSource}
        sources={mockSources}
        currentIndex={1}
        onBack={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });
});
