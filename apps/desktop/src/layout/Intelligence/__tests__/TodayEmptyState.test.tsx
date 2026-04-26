import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TodayEmptyState } from "../TodayEmptyState";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock react-i18next — return the key as display text for assertions
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

// Mock zustand store
const mockSetOnboardingOpen = vi.fn();
vi.mock("@/stores", () => ({
  useBearStore: () => ({
    setOnboardingOpen: mockSetOnboardingOpen,
  }),
}));

// Mock useShallow to just return the selector result
vi.mock("zustand/react/shallow", () => ({
  useShallow: (selector: any) => selector,
}));

describe("TodayEmptyState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("no_subscriptions state", () => {
    it("should render no_feeds_title and no_feeds_subtitle", () => {
      render(<TodayEmptyState type="no_subscriptions" />);

      expect(screen.getByText("today.empty.no_feeds_title")).toBeInTheDocument();
      expect(screen.getByText("today.empty.no_feeds_subtitle")).toBeInTheDocument();
    });

    it('should render "Add Feeds" button that opens onboarding', () => {
      render(<TodayEmptyState type="no_subscriptions" />);

      const addButton = screen.getByText("today.empty.add_feeds");
      fireEvent.click(addButton);

      expect(mockSetOnboardingOpen).toHaveBeenCalledWith(true);
    });
  });

  describe("no_new_articles state", () => {
    it("should render no_articles_title and no_articles_subtitle", () => {
      render(<TodayEmptyState type="no_new_articles" />);

      expect(screen.getByText("today.empty.no_articles_title")).toBeInTheDocument();
      expect(screen.getByText("today.empty.no_articles_subtitle")).toBeInTheDocument();
    });

    it('should render "Explore All" button that navigates to /local/all', () => {
      render(<TodayEmptyState type="no_new_articles" />);

      const exploreButton = screen.getByText("today.empty.explore_all");
      fireEvent.click(exploreButton);

      expect(mockNavigate).toHaveBeenCalledWith("/local/all");
    });
  });

  describe("load_error state", () => {
    it("should render error_title and error_subtitle", () => {
      render(<TodayEmptyState type="load_error" />);

      expect(screen.getByText("today.empty.error_title")).toBeInTheDocument();
      expect(screen.getByText("today.empty.error_subtitle")).toBeInTheDocument();
    });

    it("should render Retry button when onRetry is provided", () => {
      const onRetry = vi.fn();
      render(<TodayEmptyState type="load_error" onRetry={onRetry} />);

      const retryButton = screen.getByText("today.empty.retry");
      fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledOnce();
    });

    it("should not render Retry button when onRetry is not provided", () => {
      render(<TodayEmptyState type="load_error" />);

      expect(screen.queryByText("today.empty.retry")).not.toBeInTheDocument();
    });
  });
});
