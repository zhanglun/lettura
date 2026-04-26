import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TodayPage } from "../TodayPage";

// Mock useArticle hook — control return values per test
const mockUseArticle = vi.fn();
vi.mock("@/layout/Article/useArticle", () => ({
  useArticle: (...args: any[]) => mockUseArticle(...args),
}));

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

// Mock zustand store — controllable per test
const mockUseBearStore = vi.fn();
vi.mock("@/stores", () => ({
  useBearStore: (...args: any[]) => mockUseBearStore(...args),
}));

// Mock useShallow
vi.mock("zustand/react/shallow", () => ({
  useShallow: (selector: any) => selector,
}));

// Mock @tauri-apps/plugin-shell
vi.mock("@tauri-apps/plugin-shell", () => ({
  open: vi.fn(),
}));

// Mock react-hotkeys-hook
vi.mock("react-hotkeys-hook", () => ({
  useHotkeys: vi.fn(),
}));

// Mock child components to simplify testing
vi.mock("../TodayArticleList", () => ({
  TodayArticleList: () => <div data-testid="today-article-list">ArticleList</div>,
}));

vi.mock("@/layout/Article/View", () => ({
  View: () => <div data-testid="article-view">View</div>,
}));

vi.mock("@/components/MainPanel", () => ({
  MainPanel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-panel">{children}</div>
  ),
}));

describe("TodayPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBearStore.mockReturnValue({
      article: null,
      subscribes: [],
    });
  });

  it("should render load_error empty state when useArticle has error", () => {
    mockUseArticle.mockReturnValue({
      error: new Error("fetch failed"),
      isEmpty: false,
      mutate: vi.fn(),
    });

    render(<TodayPage />);

    expect(screen.getByText("today.empty.error_title")).toBeInTheDocument();
    expect(screen.queryByTestId("today-article-list")).not.toBeInTheDocument();
  });

  it("should render no_subscriptions empty state when no feeds", () => {
    mockUseArticle.mockReturnValue({
      error: null,
      isEmpty: true,
      mutate: vi.fn(),
    });

    render(<TodayPage />);

    expect(screen.getByText("today.empty.no_feeds_title")).toBeInTheDocument();
  });

  it("should render article list when has subscriptions and articles are not empty", () => {
    mockUseBearStore.mockReturnValue({
      article: null,
      subscribes: [{ uuid: "feed-1", title: "Test Feed" }],
    });

    mockUseArticle.mockReturnValue({
      error: null,
      isEmpty: false,
      mutate: vi.fn(),
    });

    render(<TodayPage />);

    expect(screen.getByTestId("today-article-list")).toBeInTheDocument();
  });

  it("should render no_new_articles empty state when has subscriptions but articles are empty", () => {
    mockUseBearStore.mockReturnValue({
      article: null,
      subscribes: [{ uuid: "feed-1", title: "Test Feed" }],
    });

    mockUseArticle.mockReturnValue({
      error: null,
      isEmpty: true,
      mutate: vi.fn(),
    });

    render(<TodayPage />);

    expect(screen.getByText("today.empty.no_articles_title")).toBeInTheDocument();
    expect(screen.queryByTestId("today-article-list")).not.toBeInTheDocument();
  });
});
