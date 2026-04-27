import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SignalSourceList } from "../SignalSourceList";
import type { SignalSource } from "@/stores/createTodaySlice";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown> | string) => {
      if (typeof opts === "string") return opts;
      return opts?.defaultValue ? String(opts.defaultValue) : key;
    },
    i18n: { changeLanguage: vi.fn() },
  }),
}));

vi.mock("../SignalSourceItem", () => ({
  SignalSourceItem: ({
    source,
    onClick,
  }: {
    source: SignalSource;
    onClick: (articleUuid: string, feedUuid: string, articleId: number) => void;
  }) => (
    <button
      data-testid={`source-item-${source.article_id}`}
      onClick={() => onClick(source.article_uuid, source.feed_uuid, source.article_id)}
    >
      {source.title}
    </button>
  ),
}));

const makeSource = (id: number, daysAgo = 0): SignalSource => ({
  article_id: id,
  article_uuid: `uuid-${id}`,
  title: `Article ${id}`,
  link: `https://example.com/${id}`,
  feed_title: "Feed",
  feed_uuid: "feed-uuid",
  pub_date: new Date(Date.now() - daysAgo * 86400000).toISOString(),
  excerpt: null,
});

describe("SignalSourceList", () => {
  const onSourceClick = vi.fn();
  const onLoadAll = vi.fn();

  it("T-SL-01: renders correct number of source items for 5 sources", () => {
    const sources = Array.from({ length: 5 }, (_, i) => makeSource(i + 1));

    render(
      <SignalSourceList sources={sources} onSourceClick={onSourceClick} />,
    );

    for (let i = 1; i <= 5; i++) {
      expect(
        screen.getByTestId(`source-item-${i}`),
      ).toBeInTheDocument();
    }
  });

  it("T-SL-02: with 8 sources, shows only 5 items and show all button", () => {
    const sources = Array.from({ length: 8 }, (_, i) => makeSource(i + 1));

    render(
      <SignalSourceList
        sources={sources}
        onSourceClick={onSourceClick}
        onLoadAll={onLoadAll}
      />,
    );

    for (let i = 1; i <= 5; i++) {
      expect(
        screen.getByTestId(`source-item-${i}`),
      ).toBeInTheDocument();
    }
    expect(
      screen.queryByTestId("source-item-6"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("source-item-7"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("source-item-8"),
    ).not.toBeInTheDocument();

    expect(
      screen.getByText("Show all 8 articles"),
    ).toBeInTheDocument();
  });

  it("T-SL-03: clicking show all button calls onLoadAll", () => {
    const sources = Array.from({ length: 8 }, (_, i) => makeSource(i + 1));

    render(
      <SignalSourceList
        sources={sources}
        onSourceClick={onSourceClick}
        onLoadAll={onLoadAll}
      />,
    );

    fireEvent.click(screen.getByText("Show all 8 articles"));
    expect(onLoadAll).toHaveBeenCalledOnce();
  });

  it("T-SL-04: when loading=true, shows loading text instead of count", () => {
    const sources = Array.from({ length: 8 }, (_, i) => makeSource(i + 1));

    render(
      <SignalSourceList
        sources={sources}
        onSourceClick={onSourceClick}
        onLoadAll={onLoadAll}
        loading={true}
      />,
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText(/Show all/)).not.toBeInTheDocument();
  });

  it("T-F09: sources are sorted by pub_date descending (newest first)", () => {
    const sources = [
      makeSource(1, 3),
      makeSource(2, 0),
      makeSource(3, 1),
    ];

    render(
      <SignalSourceList sources={sources} onSourceClick={onSourceClick} />,
    );

    const items = screen.getAllByTestId(/^source-item-/);
    expect(items[0]).toHaveAttribute("data-testid", "source-item-2");
    expect(items[1]).toHaveAttribute("data-testid", "source-item-3");
    expect(items[2]).toHaveAttribute("data-testid", "source-item-1");
  });

  it("T-F13: continue reading hint is shown", () => {
    const sources = [makeSource(1)];
    render(
      <SignalSourceList sources={sources} onSourceClick={onSourceClick} />,
    );

    expect(
      screen.getByText("today.sources.continue_reading_hint"),
    ).toBeInTheDocument();
  });
});
