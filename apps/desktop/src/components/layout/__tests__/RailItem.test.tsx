import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Sun, Settings } from "lucide-react";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/" }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

vi.mock("@/helpers/cn", () => ({
  cn: (...args: (string | false | undefined)[]) =>
    args.filter(Boolean).join(" "),
}));

vi.mock("@radix-ui/themes", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-wrapper">{children}</div>
  ),
}));

import { RailItem } from "../RailItem";

describe("F3: RailItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("route mode", () => {
    it("renders a button and click calls navigate with the target path", () => {
      render(<RailItem icon={Sun} label="Today" to="/local/today" />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();

      fireEvent.click(button);
      expect(mockNavigate).toHaveBeenCalledWith("/local/today");
    });
  });

  describe("callback mode", () => {
    it("calls onClick when clicked", () => {
      const mockOnClick = vi.fn();

      render(
        <RailItem icon={Settings} label="Settings" onClick={mockOnClick} />,
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledOnce();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("active state", () => {
    it("does not have active class when location does not match", () => {
      render(<RailItem icon={Sun} label="Today" to="/local/today" />);

      const button = screen.getByRole("button");
      expect(button.className).not.toContain("bg-accent-9");
    });

    it("respects explicit active prop", () => {
      render(
        <RailItem
          icon={Sun}
          label="Today"
          to="/local/today"
          active={true}
        />,
      );

      const button = screen.getByRole("button");
      expect(button.className).toContain("bg-accent-9");
    });
  });

  describe("tooltip", () => {
    it("wraps the button in a tooltip element", () => {
      render(<RailItem icon={Sun} label="Today" to="/local/today" />);

      expect(screen.getByTestId("tooltip-wrapper")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });
});
