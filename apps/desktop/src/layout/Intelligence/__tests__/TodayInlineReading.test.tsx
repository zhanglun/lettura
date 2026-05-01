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

const sources: SignalSource[] = [
  {
    article_id: 1,
    article_uuid: "u1",
    title: "Article One",
    link: "https://a.com/1",
    feed_title: "Feed A",
    feed_uuid: "fa",
    pub_date: "2026-04-30T10:00:00Z",
    excerpt: "First excerpt",
  },
  {
    article_id: 2,
    article_uuid: "u2",
    title: "Article Two",
    link: "https://b.com/2",
    feed_title: "Feed B",
    feed_uuid: "fb",
    pub_date: "2026-04-30T11:00:00Z",
    excerpt: "Second excerpt",
  },
];

describe("Today inline reading flow", () => {
  it("should display first source when opened", () => {
    render(
      <InlineReader
        source={sources[0]}
        sources={sources}
        currentIndex={0}
        onBack={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    expect(screen.getByText("Article One")).toBeInTheDocument();
    expect(screen.getByText("Feed A")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("should navigate to next source", () => {
    const onNavigate = vi.fn();
    render(
      <InlineReader
        source={sources[0]}
        sources={sources}
        currentIndex={0}
        onBack={vi.fn()}
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByText("today.inline_reader.next"));
    expect(onNavigate).toHaveBeenCalledWith(1);
  });

  it("should navigate to previous source", () => {
    const onNavigate = vi.fn();
    render(
      <InlineReader
        source={sources[1]}
        sources={sources}
        currentIndex={1}
        onBack={vi.fn()}
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByText("today.inline_reader.prev"));
    expect(onNavigate).toHaveBeenCalledWith(0);
  });

  it("should call onBack when back button clicked", () => {
    const onBack = vi.fn();
    render(
      <InlineReader
        source={sources[0]}
        sources={sources}
        currentIndex={0}
        onBack={onBack}
        onNavigate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("today.inline_reader.back"));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
