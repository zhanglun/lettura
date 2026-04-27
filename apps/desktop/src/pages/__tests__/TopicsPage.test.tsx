import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/" }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

vi.mock("@/components/MainPanel", () => ({
  MainPanel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-panel">{children}</div>
  ),
}));

import { TopicsPage } from "../TopicsPage";

describe("F6: TopicsPage", () => {
  it("renders the empty state title", () => {
    render(<TopicsPage />);

    expect(screen.getByText("topics.empty_title")).toBeInTheDocument();
  });

  it("renders the empty state description", () => {
    render(<TopicsPage />);

    expect(
      screen.getByText("topics.empty_description"),
    ).toBeInTheDocument();
  });

  it("renders the Layers icon placeholder", () => {
    const { container } = render(<TopicsPage />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders inside MainPanel", () => {
    render(<TopicsPage />);

    expect(screen.getByTestId("main-panel")).toBeInTheDocument();
    expect(screen.getByText("topics.empty_title")).toBeInTheDocument();
  });
});
