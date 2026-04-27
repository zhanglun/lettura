import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TodayOverview } from "../TodayOverview";

const mockNavigate = vi.fn();
const mockFetchOverview = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      if (key === "today.overview_updated_minutes_ago" && params) {
        return `${params.minutes} min ago`;
      }
      return key;
    },
    i18n: { changeLanguage: vi.fn() },
  }),
}));

interface MockStoreState {
  overview: {
    summary: string;
    signal_count: number;
    article_count: number;
    generated_at: string;
    is_stale: boolean;
  } | null;
  overviewLoading: boolean;
  overviewError: string | null;
  fetchOverview: ReturnType<typeof vi.fn>;
}

let mockStoreState: MockStoreState = {
  overview: null,
  overviewLoading: false,
  overviewError: null,
  fetchOverview: mockFetchOverview,
};

vi.mock("@/stores", () => ({
  useBearStore: (selector: (state: MockStoreState) => unknown) => selector(mockStoreState),
}));

vi.mock("zustand/react/shallow", () => ({
  useShallow: (selector: unknown) => selector,
}));

describe("TodayOverview component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState = {
      overview: null,
      overviewLoading: false,
      overviewError: null,
      fetchOverview: mockFetchOverview,
    };
  });

  it("T-F05: renders loading skeleton when overviewLoading is true and no overview", () => {
    mockStoreState.overviewLoading = true;
    render(<TodayOverview />);
    expect(screen.getByText("today.overview")).toBeInTheDocument();
  });

  it("T-F06: renders nothing when overviewError is TODAY_NO_DATA", () => {
    mockStoreState.overviewError = "TODAY_NO_DATA";
    const { container } = render(<TodayOverview />);
    expect(container.innerHTML).toBe("");
  });

  it("T-F07: renders settings link when overviewError is AI_NO_API_KEY", () => {
    mockStoreState.overviewError = "AI_NO_API_KEY";
    render(<TodayOverview />);
    expect(screen.getByText("today.overview_no_api_key")).toBeInTheDocument();

    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith("/settings");
  });

  it("T-F08: renders overview summary text when overview is loaded", () => {
    mockStoreState.overview = {
      summary: "AI tools are evolving rapidly",
      signal_count: 5,
      article_count: 20,
      generated_at: new Date().toISOString(),
      is_stale: false,
    };
    render(<TodayOverview />);
    expect(screen.getByText("AI tools are evolving rapidly")).toBeInTheDocument();
    expect(screen.getByText("today.overview")).toBeInTheDocument();
  });

  it("T-F09: renders stale indicator with refresh button when overview is stale", () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    mockStoreState.overview = {
      summary: "AI tools are evolving rapidly",
      signal_count: 5,
      article_count: 20,
      generated_at: tenMinutesAgo,
      is_stale: true,
    };
    render(<TodayOverview />);
    expect(screen.getByText("10 min ago")).toBeInTheDocument();

    const refreshButtons = screen.getAllByRole("button");
    const refreshButton = refreshButtons.find((b) => b.title === "today.overview");
    expect(refreshButton).toBeDefined();
    fireEvent.click(refreshButton!);
    expect(mockFetchOverview).toHaveBeenCalled();
  });

  it("T-F10: renders error text for generic errors", () => {
    mockStoreState.overviewError = "Some unexpected error";
    mockStoreState.overviewLoading = false;
    const { container } = render(<TodayOverview />);
    expect(screen.getByText("today.overview_error")).toBeInTheDocument();
  });
});
