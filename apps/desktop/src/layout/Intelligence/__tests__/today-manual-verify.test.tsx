import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TodayPage } from "../TodayPage";

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => vi.fn() };
});

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

// Mock zustand store
const mockStore = {
  signals: [] as unknown[],
  signalsLoading: false,
  signalsError: null as string | null,
  pipelineStatus: "idle" as string,
  pipelineStage: null as string | null,
  pipelineProgress: 0,
  aiConfig: null as null | { has_api_key: boolean; model: string; embedding_model: string; base_url: string },
  subscribes: [] as unknown[],
  fetchSignals: vi.fn(),
  fetchAIConfig: vi.fn(),
  setPipelineStatus: vi.fn(),
  setPipelineProgress: vi.fn(),
  triggerPipeline: vi.fn(),
  updateSettingDialogStatus: vi.fn(),
  setOnboardingOpen: vi.fn(),
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
    <div data-testid="empty-state">
      <span>EmptyState: {type}</span>
      {type === "no_subscriptions" && (
        <button data-testid="add-feeds-btn" onClick={() => mockStore.setOnboardingOpen(true)}>
          today.empty.add_feeds
        </button>
      )}
    </div>
  ),
}));
vi.mock("@/components/MainPanel", () => ({
  MainPanel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-panel">{children}</div>
  ),
}));

describe("Integration tests: TodayPage signal-based UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.signals = [];
    mockStore.signalsLoading = false;
    mockStore.signalsError = null;
    mockStore.pipelineStatus = "idle";
    mockStore.pipelineStage = null;
    mockStore.pipelineProgress = 0;
    mockStore.aiConfig = null;
    mockStore.subscribes = [];
  });

  it("C4: shows no_subscriptions empty state when no subscriptions", () => {
    render(<TodayPage />);

    expect(screen.getByText("EmptyState: no_subscriptions")).toBeInTheDocument();
    expect(screen.getByText("today.empty.add_feeds")).toBeInTheDocument();
  });

  it("C5: shows no_new_articles state when has subscriptions, API key, but no signals", () => {
    mockStore.subscribes = [{ uuid: "feed-1", title: "Test Feed" }];
    mockStore.aiConfig = { has_api_key: true, model: "gpt-4o-mini", embedding_model: "text-embedding-3-small", base_url: "" };

    render(<TodayPage />);

    expect(screen.getByText("today.empty.no_signals")).toBeInTheDocument();
    expect(screen.getByText("today.empty.start_analysis")).toBeInTheDocument();
  });

  it("C6: shows SignalList when has subscriptions, API key, and signals", () => {
    mockStore.subscribes = [{ uuid: "feed-1", title: "Test Feed" }];
    mockStore.aiConfig = { has_api_key: true, model: "gpt-4o-mini", embedding_model: "text-embedding-3-small", base_url: "" };
    mockStore.signals = [
      {
        id: 1,
        title: "Signal 1",
        summary: "Summary 1",
        relevance_score: 0.9,
        source_count: 1,
        sources: [],
        topic_id: null,
        topic_title: null,
        created_at: "2026-01-01",
      },
    ];

    render(<TodayPage />);

    expect(screen.getByTestId("signal-list")).toBeInTheDocument();
    expect(screen.queryByText("EmptyState: no_subscriptions")).not.toBeInTheDocument();
    expect(screen.queryByText("today.empty.no_signals")).not.toBeInTheDocument();
  });

  it("C9: clicking Add Feeds button triggers setOnboardingOpen(true)", () => {
    render(<TodayPage />);

    const addFeedsBtn = screen.getByTestId("add-feeds-btn");
    fireEvent.click(addFeedsBtn);

    expect(mockStore.setOnboardingOpen).toHaveBeenCalledWith(true);
  });

  it("shows PipelineIndicator with current status", () => {
    mockStore.subscribes = [{ uuid: "feed-1", title: "Test Feed" }];
    mockStore.aiConfig = { has_api_key: true, model: "gpt-4o-mini", embedding_model: "text-embedding-3-small", base_url: "" };
    mockStore.signals = [
      {
        id: 1,
        title: "Signal",
        summary: "S",
        relevance_score: 0.8,
        source_count: 1,
        sources: [],
        topic_id: null,
        topic_title: null,
        created_at: "2026-01-01",
      },
    ];
    mockStore.pipelineStatus = "running";

    render(<TodayPage />);

    expect(screen.getByText("Status: running")).toBeInTheDocument();
  });

  it("triggerPipeline is called when start_analysis button is clicked", () => {
    mockStore.subscribes = [{ uuid: "feed-1", title: "Test Feed" }];
    mockStore.aiConfig = { has_api_key: true, model: "gpt-4o-mini", embedding_model: "text-embedding-3-small", base_url: "" };

    render(<TodayPage />);

    const startBtn = screen.getByText("today.empty.start_analysis");
    fireEvent.click(startBtn);

    expect(mockStore.triggerPipeline).toHaveBeenCalled();
  });
});
