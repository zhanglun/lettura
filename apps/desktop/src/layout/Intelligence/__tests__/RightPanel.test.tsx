import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RightPanel } from "../RightPanel";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

describe("RightPanel", () => {
  it("should render collapsed content when not expanded", () => {
    render(
      <RightPanel expanded={false}>
        <div data-testid="collapsed-content">Collapsed</div>
      </RightPanel>,
    );

    expect(screen.getByTestId("collapsed-content")).toBeInTheDocument();
    const panel = screen.getByTestId("right-panel");
    expect(panel.style.width).toBe("var(--right-panel-collapsed-width)");
  });

  it("should render expanded content when expanded", () => {
    render(
      <RightPanel expanded={true}>
        <div data-testid="expanded-content">Expanded</div>
      </RightPanel>,
    );

    expect(screen.getByTestId("expanded-content")).toBeInTheDocument();
    const panel = screen.getByTestId("right-panel");
    expect(panel.style.width).toBe("var(--right-panel-expanded-width)");
  });

  it("should apply transition class for smooth width change", () => {
    render(
      <RightPanel expanded={false}>
        <div>Content</div>
      </RightPanel>,
    );

    const panel = screen.getByTestId("right-panel");
    expect(panel.className).toContain("transition-all");
  });

  it("should have correct base styling", () => {
    render(
      <RightPanel expanded={false}>
        <div>Content</div>
      </RightPanel>,
    );

    const panel = screen.getByTestId("right-panel");
    expect(panel.className).toContain("border-l");
    expect(panel.className).toContain("overflow-hidden");
  });
});
