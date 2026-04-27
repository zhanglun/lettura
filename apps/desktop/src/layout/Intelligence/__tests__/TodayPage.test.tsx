import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TodayPage } from "../TodayPage";

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
const mockStore = {
  signals: [] as Array<{
    id: number;
    title: string;
    summary: string;
    relevance_score: number;
    source_count: number;
    sources: unknown[];
    topic_id: number | null;
    topic_title: string | null;
    created_at: string;
  }>,
  signalsLoading: false,
  signalsError: null as string | null,
  pipelineStatus: "idle" as string,
  pipelineStage: null,
  pipelineProgress: 0,
  aiConfig: null as null | { has_api_key: boolean; model: string; embedding_model: string; base_url: string },
  subscribes: [] as unknown[],
  fetchSignals: vi.fn(),
  fetchAIConfig: vi.fn(),
  setPipelineStatus: vi.fn(),
  setPipelineProgress: vi.fn(),
  triggerPipeline: vi.fn(),
  updateSettingDialogStatus: vi.fn(),
  fetchOverview: vi.fn(),
};

vi.mock("@/stores", () => ({
  useBearStore: (selector: (state: typeof mockStore) => unknown) => selector(mockStore),
}));

vi.mock("zustand/react/shallow", () => ({
  useShallow: (selector: unknown) => selector,
}));

// Mock infrastructure
vi.mock("@tauri-apps/plugin-shell", () => ({ open: vi.fn() }));
vi.mock("react-hotkeys-hook", () => ({ useHotkeys: vi.fn() }));

// Mock child components
vi.mock("../SignalList", () => ({
  SignalList: ({ signals }: { signals: unknown[] }) => (
    <div data-testid="signal-list">Signals: {signals.length}</div>
  ),
}));

vi.mock("../PipelineIndicator", () => ({
  PipelineIndicator: ({ status }: { status: string }) => (
    <div data-testid="pipeline-indicator">Status: {status}</div>
  ),
}));

vi.mock("../TodayEmptyState", () => ({
  TodayEmptyState: ({ type }: { type: string }) => (
    <div data-testid="empty-state">EmptyState: {type}</div>
  ),
}));

vi.mock("../TodayOverview", () => ({
  TodayOverview: () => (
    <div data-testid="today-overview">Overview</div>
  ),
}));

vi.mock("@/components/MainPanel", () => ({
  MainPanel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-panel">{children}</div>
  ),
}));

describe("TodayPage (Signal-based)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default empty state
    mockStore.signals = [];
    mockStore.signalsLoading = false;
    mockStore.signalsError = null;
    mockStore.pipelineStatus = "idle";
    mockStore.pipelineStage = null;
    mockStore.pipelineProgress = 0;
    mockStore.aiConfig = null;
    mockStore.subscribes = [];
  });

  it("should render no_subscriptions empty state when no feeds", () => {
    // subscribes is [], aiConfig is null
    render(<TodayPage />);

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("EmptyState: no_subscriptions")).toBeInTheDocument();
  });

  it("should render no_api_key state when has subscriptions but no AI config", () => {
    mockStore.subscribes = [{ uuid: "feed-1", title: "Test Feed" }];
    // aiConfig is null → hasApiKey false

    render(<TodayPage />);

    expect(screen.getByText("today.empty.no_api_key")).toBeInTheDocument();
    expect(screen.getByText("today.empty.go_to_settings")).toBeInTheDocument();
  });

  it("should render no_api_key state when AI config has no key", () => {
    mockStore.subscribes = [{ uuid: "feed-1", title: "Test Feed" }];
    mockStore.aiConfig = { has_api_key: false, model: "gpt-4o-mini", embedding_model: "text-embedding-3-small", base_url: "" };

    render(<TodayPage />);

    expect(screen.getByText("today.empty.no_api_key")).toBeInTheDocument();
  });

  it("should render no_signals state when has API key but no signals", () => {
    mockStore.subscribes = [{ uuid: "feed-1", title: "Test Feed" }];
    mockStore.aiConfig = { has_api_key: true, model: "gpt-4o-mini", embedding_model: "text-embedding-3-small", base_url: "" };
    // signals is []

    render(<TodayPage />);

    expect(screen.getByText("today.empty.no_signals")).toBeInTheDocument();
    expect(screen.getByText("today.empty.start_analysis")).toBeInTheDocument();
  });

  it("should render SignalList when has signals and API key", () => {
    mockStore.subscribes = [{ uuid: "feed-1", title: "Test Feed" }];
    mockStore.aiConfig = { has_api_key: true, model: "gpt-4o-mini", embedding_model: "text-embedding-3-small", base_url: "" };
    mockStore.signals = [
      {
        id: 1,
        title: "Test Signal",
        summary: "A summary",
        relevance_score: 0.9,
        source_count: 2,
        sources: [],
        topic_id: null,
        topic_title: null,
        created_at: "2026-01-01",
      },
    ];

    render(<TodayPage />);

    expect(screen.getByTestId("signal-list")).toBeInTheDocument();
    expect(screen.getByText("Signals: 1")).toBeInTheDocument();
  });

  it("should call fetchAIConfig and fetchSignals on mount", () => {
    render(<TodayPage />);

    expect(mockStore.fetchAIConfig).toHaveBeenCalled();
    expect(mockStore.fetchSignals).toHaveBeenCalled();
  });

  it("should render loading spinner when signalsLoading is true and no signals", () => {
    mockStore.subscribes = [{ uuid: "feed-1", title: "Test Feed" }];
    mockStore.aiConfig = { has_api_key: true, model: "gpt-4o-mini", embedding_model: "text-embedding-3-small", base_url: "" };
    mockStore.signalsLoading = true;

    render(<TodayPage />);

    // Loader2 has animate-spin class
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });
});
