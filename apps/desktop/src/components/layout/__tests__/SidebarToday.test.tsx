import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SidebarToday } from "../SidebarToday";

const mockNavigate = vi.fn();
const mockStore = {
  signals: [
    {
      id: 11,
      title: "AI Agent 竞争格局",
      summary: "Summary",
      why_it_matters: "Reason",
      relevance_score: 0.9,
      source_count: 3,
      sources: [],
      topic_id: 101,
      topic_title: "AI Agent 竞争格局",
      topic_uuid: "topic-ai-agent",
      created_at: "2026-05-01T00:00:00Z",
    },
  ],
  topics: [
    {
      id: 101,
      uuid: "topic-ai-agent",
      title: "AI Agent 竞争格局",
      is_following: true,
    },
  ],
  followingTopicIds: new Set([101]),
  overview: null,
  expandedSignalId: null as number | null,
  fetchSignals: vi.fn(),
  fetchOverview: vi.fn(),
  fetchTopics: vi.fn(),
  focusSignal: vi.fn(),
};

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/stores", () => ({
  useBearStore: (selector: (state: typeof mockStore) => unknown) => selector(mockStore),
}));

vi.mock("zustand/react/shallow", () => ({
  useShallow: (selector: unknown) => selector,
}));

describe("SidebarToday", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.expandedSignalId = null;
  });

  it("focus item selects Today signal instead of navigating to topic detail", () => {
    render(<SidebarToday />);

    fireEvent.click(screen.getAllByRole("button", { name: /AI Agent 竞争格局/ })[0]);

    expect(mockStore.focusSignal).toHaveBeenCalledWith(11);
    expect(mockNavigate).not.toHaveBeenCalledWith("/local/topics/topic-ai-agent");
  });

  it("tracked topic item still navigates to topic detail", () => {
    render(<SidebarToday />);

    const buttons = screen.getAllByRole("button", { name: /AI Agent 竞争格局/ });
    fireEvent.click(buttons[1]);

    expect(mockNavigate).toHaveBeenCalledWith("/local/topics/topic-ai-agent");
  });
});
