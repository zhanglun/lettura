import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { StarredPage } from "../index";

const mockUseArticle = vi.fn();

vi.mock("@/hooks/useArticle", () => ({
  useArticle: (props: Record<string, unknown>) => mockUseArticle(props),
}));

vi.mock("@/helpers/starredApi", () => ({
  getCollections: vi.fn().mockResolvedValue([
    { uuid: "collection-1", name: "Research", article_count: 2 },
  ]),
  getTags: vi.fn().mockResolvedValue([
    { uuid: "tag-1", name: "agent", article_count: 1 },
  ]),
  createCollection: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values?.count !== undefined ? `${key}:${values.count}` : key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

vi.mock("@/helpers/parseXML", () => ({
  getFeedLogo: vi.fn(() => ""),
}));

vi.mock("@/layout/Article/View", () => ({
  View: ({ onClose }: { onClose?: () => void }) => (
    <div data-testid="article-view">
      <button type="button" onClick={onClose}>
        close-reader
      </button>
    </div>
  ),
}));

vi.mock("../StarredOrganizeBar", () => ({
  StarredOrganizeBar: () => <div data-testid="starred-organize-bar" />,
}));

vi.mock("date-fns", () => ({
  formatDistanceToNow: vi.fn(() => "2 hours ago"),
  isToday: vi.fn((value: Date) => value.getFullYear() === 2026),
  parseISO: vi.fn((s: string) => new Date(s)),
}));

const article = {
  uuid: "article-1",
  title: "Agent SDK changes how teams debug tools",
  description: "A practical article about agent traces and tool reliability.",
  content: "",
  create_date: "2026-05-28T10:00:00.000Z",
  feed_uuid: "feed-1",
  feed_title: "Engineering Weekly",
  feed_url: "https://example.com/feed.xml",
  feed_logo: "",
  starred: 1,
};

describe("Starred workbench layout", () => {
  beforeEach(() => {
    mockUseArticle.mockClear();
    mockUseArticle.mockReturnValue({
      articles: [article],
      isLoading: false,
      isEmpty: false,
      isReachingEnd: true,
      size: 1,
      setSize: vi.fn(),
    });
  });

  it("renders starred as a collection workbench", async () => {
    const { container } = render(<StarredPage />);

    expect(container.querySelector(".starred-workbench")).toBeTruthy();
    expect(container.querySelector(".starred-library-sidebar")).toBeTruthy();
    expect(container.querySelector(".starred-main")).toBeTruthy();
    expect(container.querySelector(".starred-panel")).toBeTruthy();
    expect(container.querySelector(".starred-article-card")).toBeTruthy();
    expect(container.querySelector(".starred-article-card--active")).toBeFalsy();
    expect(screen.getByText("starred.header.subtitle")).toBeInTheDocument();
    expect(await screen.findByText("Research")).toBeInTheDocument();
  });

  it("opens the selected saved article in the reading pane", async () => {
    const { container } = render(<StarredPage />);
    await screen.findByText("Research");

    const firstCard = container.querySelector(
      ".starred-article-card",
    ) as HTMLButtonElement;
    fireEvent.click(firstCard);

    expect(container.querySelector(".starred-article-card--active")).toBeTruthy();
    expect(screen.getByTestId("starred-organize-bar")).toBeInTheDocument();
    expect(screen.getByTestId("article-view")).toBeInTheDocument();

    fireEvent.click(screen.getByText("close-reader"));

    expect(screen.queryByTestId("article-view")).not.toBeInTheDocument();
    expect(container.querySelector(".starred-panel")).toBeTruthy();
  });

  it("renders a saved note block only when the article has notes", () => {
    const { container, rerender } = render(<StarredPage />);
    expect(container.querySelector(".starred-article-note")).toBeFalsy();

    mockUseArticle.mockReturnValue({
      articles: [{ ...article, notes: "适合作为生态变化的起点" }],
      isLoading: false,
      isEmpty: false,
      isReachingEnd: true,
      size: 1,
      setSize: vi.fn(),
    });
    rerender(<StarredPage />);

    const noteEl = container.querySelector(".starred-article-note");
    expect(noteEl).toBeTruthy();
    expect(noteEl?.textContent).toContain("适合作为生态变化的起点");
  });

  it("keeps the active saved card border stable in css", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/styles/custom-components.css"),
      "utf8",
    );
    const activeRule = css.match(
      /\.starred-article-card--active\s*\{(?<body>[^}]+)\}/,
    );

    expect(activeRule?.groups?.body).toContain("border-color: var(--workbench-amber);");
    expect(activeRule?.groups?.body).not.toContain("border-width");
    expect(activeRule?.groups?.body).not.toContain("border: 2px");
  });
});
