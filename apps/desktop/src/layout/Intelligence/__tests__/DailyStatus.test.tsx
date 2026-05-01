import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DailyStatus } from "../DailyStatus";
import type { TodayOverview } from "@/stores/createTodaySlice";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

describe("DailyStatus", () => {
  it("should render loading state", () => {
    render(<DailyStatus overview={null} loading={true} />);
    expect(screen.getByText("today.right_panel.daily_status.title")).toBeInTheDocument();
  });

  it("should render overview stats when available", () => {
    const overview: TodayOverview = {
      summary: "3 signals found",
      signal_count: 3,
      article_count: 12,
      generated_at: "2026-04-30T10:00:00Z",
      is_stale: false,
    };

    render(<DailyStatus overview={overview} loading={false} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("should render empty state when no overview and not loading", () => {
    render(<DailyStatus overview={null} loading={false} />);
    expect(screen.getByText("today.right_panel.daily_status.no_data")).toBeInTheDocument();
  });
});
