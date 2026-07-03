import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComponentsGallery } from "../index";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/components/MainPanel", () => ({
  MainPanel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/layout/Intelligence/SignalCard", () => ({
  SignalCard: ({ signal }: { signal: { title: string } }) => (
    <div data-testid="signal-card">{signal.title}</div>
  ),
}));

vi.mock("@/layout/Intelligence/Topics/TopicCard", () => ({
  TopicCard: ({ topic }: { topic: { title: string } }) => (
    <div data-testid="topic-card">{topic.title}</div>
  ),
}));

vi.mock("@/components/ArticleItem", () => ({
  ArticleItem: ({ article }: { article: { title: string } }) => (
    <div data-testid="article-item">{article.title}</div>
  ),
}));

vi.mock("@/layout/Search/utils", () => ({
  SearchResultCard: ({ article }: { article: { title: string } }) => (
    <div data-testid="search-result">{article.title}</div>
  ),
  HighlightText: ({ text }: { text: string }) => (
    <span data-testid="highlight-text">{text}</span>
  ),
}));

describe("ComponentsGallery", () => {
  it("renders both component sections", () => {
    render(<ComponentsGallery />);
    expect(screen.getByText("基础组件 Primitives")).toBeInTheDocument();
    expect(screen.getByText("业务组件 Business Components")).toBeInTheDocument();
  });

  it("renders each real business component with its mock data", () => {
    render(<ComponentsGallery />);
    expect(screen.getByTestId("signal-card")).toBeInTheDocument();
    expect(screen.getByTestId("topic-card")).toBeInTheDocument();
    expect(screen.getByTestId("article-item")).toBeInTheDocument();
    expect(screen.getByTestId("search-result")).toBeInTheDocument();
  });

  it("labels each demo with its source file path", () => {
    render(<ComponentsGallery />);
    expect(
      screen.getByText("layout/Intelligence/SignalCard.tsx"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("layout/Intelligence/Topics/TopicCard.tsx"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("components/ArticleItem/index.tsx"),
    ).toBeInTheDocument();
  });
});
