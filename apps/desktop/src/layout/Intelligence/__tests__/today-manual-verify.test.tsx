import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TodayPage } from "../TodayPage";

// Mock useArticle hook — control return values per test
const mockUseArticle = vi.fn();
vi.mock("@/layout/Article/useArticle", () => ({
  useArticle: (...args: unknown[]) => mockUseArticle(...args),
}));

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => vi.fn() };
});

// Mock react-i18next — return key as display text
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

// Mock zustand store — controllable per test
const mockUseBearStore = vi.fn();
vi.mock("@/stores", () => ({
  useBearStore: (...args: unknown[]) => mockUseBearStore(...args),
}));
vi.mock("zustand/react/shallow", () => ({
  useShallow: (selector: unknown) => selector,
}));

// Mock infrastructure (already mocked in setup.ts but explicit here for clarity)
vi.mock("@tauri-apps/plugin-shell", () => ({ open: vi.fn() }));
vi.mock("react-hotkeys-hook", () => ({ useHotkeys: vi.fn() }));

// Mock heavy child components that are NOT the focus
vi.mock("../TodayArticleList", () => ({
  TodayArticleList: () => (
    <div data-testid="today-article-list">ArticleList</div>
  ),
}));
vi.mock("@/layout/Article/View", () => ({
  View: () => <div data-testid="article-view">View</div>,
}));
vi.mock("@/components/MainPanel", () => ({
  MainPanel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-panel">{children}</div>
  ),
}));

describe("C4-C6, C9: Integration tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default store: no subscriptions
    mockUseBearStore.mockReturnValue({
      article: null,
      subscribes: [],
      setOnboardingOpen: vi.fn(),
    });
  });

  // C4: No subscriptions → shows "add feeds" empty state
  it("C4: shows 'Add Feeds' empty state when no subscriptions", () => {
    mockUseArticle.mockReturnValue({
      error: null,
      isEmpty: true,
      mutate: vi.fn(),
    });

    render(<TodayPage />);

    // TodayEmptyState renders real component with real text
    expect(
      screen.getByText("today.empty.no_feeds_title"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("today.empty.no_feeds_subtitle"),
    ).toBeInTheDocument();
    expect(screen.getByText("today.empty.add_feeds")).toBeInTheDocument();
  });

  // C5: Has subscriptions but no new articles → shows "no new articles" empty state
  it("C5: shows 'No New Articles' empty state when has subscriptions but empty articles", () => {
    mockUseBearStore.mockReturnValue({
      article: null,
      subscribes: [{ uuid: "feed-1", title: "Test Feed" }],
      setOnboardingOpen: vi.fn(),
    });
    mockUseArticle.mockReturnValue({
      error: null,
      isEmpty: true,
      mutate: vi.fn(),
    });

    render(<TodayPage />);

    expect(
      screen.getByText("today.empty.no_articles_title"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("today.empty.no_articles_subtitle"),
    ).toBeInTheDocument();
    expect(screen.getByText("today.empty.explore_all")).toBeInTheDocument();
  });

  // C6: Has subscriptions and articles → shows article list
  it("C6: shows article list when has subscriptions and articles", () => {
    mockUseBearStore.mockReturnValue({
      article: null,
      subscribes: [{ uuid: "feed-1", title: "Test Feed" }],
      setOnboardingOpen: vi.fn(),
    });
    mockUseArticle.mockReturnValue({
      error: null,
      isEmpty: false,
      mutate: vi.fn(),
    });

    render(<TodayPage />);

    expect(screen.getByTestId("today-article-list")).toBeInTheDocument();
    expect(
      screen.queryByText("today.empty.no_feeds_title"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("today.empty.no_articles_title"),
    ).not.toBeInTheDocument();
  });

  // C9: Click "Add Feeds" → triggers onboarding
  it("C9: clicking 'Add Feeds' button triggers setOnboardingOpen(true)", () => {
    const mockSetOnboardingOpen = vi.fn();
    mockUseBearStore.mockReturnValue({
      article: null,
      subscribes: [],
      setOnboardingOpen: mockSetOnboardingOpen,
    });
    mockUseArticle.mockReturnValue({
      error: null,
      isEmpty: true,
      mutate: vi.fn(),
    });

    render(<TodayPage />);

    const addButton = screen.getByText("today.empty.add_feeds");
    fireEvent.click(addButton);

    expect(mockSetOnboardingOpen).toHaveBeenCalledWith(true);
  });
});
