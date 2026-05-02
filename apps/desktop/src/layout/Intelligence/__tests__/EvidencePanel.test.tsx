import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EvidencePanel } from "../EvidencePanel";
import type { Signal } from "@/stores/createTodaySlice";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

const baseSignal: Signal = {
  id: 1,
  title: "Test Signal",
  summary: "Summary",
  why_it_matters: "WIM",
  relevance_score: 0.85,
  source_count: 3,
  sources: [
    { article_id: 1, article_uuid: "u1", title: "Source 1", link: "https://a.com/1", feed_title: "Feed A", feed_uuid: "fa", pub_date: "2026-04-30T10:00:00Z", excerpt: null },
    { article_id: 2, article_uuid: "u2", title: "Source 2", link: "https://b.com/2", feed_title: "Feed B", feed_uuid: "fb", pub_date: "2026-04-30T11:00:00Z", excerpt: "Excerpt" },
    { article_id: 3, article_uuid: "u3", title: "Source 3", link: "https://c.com/3", feed_title: "Feed C", feed_uuid: "fc", pub_date: "2026-04-30T12:00:00Z", excerpt: null },
  ],
  topic_id: null,
  topic_title: null,
  created_at: "2026-04-30T09:00:00Z",
};

describe("EvidencePanel", () => {
  it("should render null when no signal provided", () => {
    const { container } = render(<EvidencePanel signal={null} />);
    expect(container.innerHTML).toBe("");
  });

  it("should render evidence title", () => {
    render(<EvidencePanel signal={baseSignal} />);
    expect(screen.getByText("today.right_panel.evidence_title")).toBeInTheDocument();
  });

  it("should render source titles", () => {
    render(<EvidencePanel signal={baseSignal} />);
    expect(screen.getByText("Source 1")).toBeInTheDocument();
    expect(screen.getByText("Source 2")).toBeInTheDocument();
    expect(screen.getByText("Source 3")).toBeInTheDocument();
  });

  it("should show feed titles as labels", () => {
    render(<EvidencePanel signal={baseSignal} />);
    expect(screen.getByText("Feed A")).toBeInTheDocument();
    expect(screen.getByText("Feed B")).toBeInTheDocument();
  });
});
