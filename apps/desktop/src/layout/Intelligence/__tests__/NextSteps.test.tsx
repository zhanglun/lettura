import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextSteps } from "../NextSteps";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

describe("NextSteps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render title and manage feeds button always", () => {
    const onOpenSettings = vi.fn();
    render(<NextSteps hasSignals={false} hasApiKey={true} onOpenSettings={onOpenSettings} />);
    expect(screen.getByText("today.right_panel.next_steps.title")).toBeInTheDocument();
    expect(screen.getByText("today.right_panel.next_steps.manage_feeds")).toBeInTheDocument();
  });

  it("should show explore topics button when hasSignals is true", () => {
    render(<NextSteps hasSignals={true} hasApiKey={true} onOpenSettings={vi.fn()} />);
    expect(screen.getByText("today.right_panel.next_steps.explore_topics")).toBeInTheDocument();
  });

  it("should not show explore topics button when hasSignals is false", () => {
    render(<NextSteps hasSignals={false} hasApiKey={true} onOpenSettings={vi.fn()} />);
    expect(screen.queryByText("today.right_panel.next_steps.explore_topics")).not.toBeInTheDocument();
  });

  it("should show configure AI button when hasApiKey is false", () => {
    const onOpenSettings = vi.fn();
    render(<NextSteps hasSignals={false} hasApiKey={false} onOpenSettings={onOpenSettings} />);
    expect(screen.getByText("today.right_panel.next_steps.configure_ai")).toBeInTheDocument();
    fireEvent.click(screen.getByText("today.right_panel.next_steps.configure_ai"));
    expect(onOpenSettings).toHaveBeenCalledOnce();
  });

  it("should navigate to topics when explore clicked", () => {
    render(<NextSteps hasSignals={true} hasApiKey={true} onOpenSettings={vi.fn()} />);
    fireEvent.click(screen.getByText("today.right_panel.next_steps.explore_topics"));
    expect(mockNavigate).toHaveBeenCalled();
  });

  it("should navigate to feeds when manage feeds clicked", () => {
    render(<NextSteps hasSignals={false} hasApiKey={true} onOpenSettings={vi.fn()} />);
    fireEvent.click(screen.getByText("today.right_panel.next_steps.manage_feeds"));
    expect(mockNavigate).toHaveBeenCalled();
  });
});
