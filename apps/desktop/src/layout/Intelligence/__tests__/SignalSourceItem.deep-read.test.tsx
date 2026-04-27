import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SignalSourceItem } from "../SignalSourceItem";
import type { SignalSource } from "@/stores/createTodaySlice";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

const makeSource = (overrides: Partial<SignalSource> = {}): SignalSource => ({
  article_id: 1,
  article_uuid: "art-1",
  title: "Test Article",
  link: "https://example.com/1",
  feed_title: "Test Feed",
  feed_uuid: "feed-1",
  pub_date: "2025-01-15T10:00:00Z",
  excerpt: null,
  ...overrides,
});

describe("SignalSourceItem — deep read", () => {
  it("T-F10: shows 'Read Original' button", () => {
    const source = makeSource();
    const onClick = vi.fn();
    render(<SignalSourceItem source={source} onClick={onClick} />);

    expect(screen.getByText("today.sources.read_original")).toBeInTheDocument();
  });

  it("T-F11b: clicking read original triggers onClick with correct args", () => {
    const source = makeSource();
    const onClick = vi.fn();
    render(<SignalSourceItem source={source} onClick={onClick} />);

    fireEvent.click(screen.getByText("today.sources.read_original"));

    expect(onClick).toHaveBeenCalledWith("art-1", "feed-1", 1);
  });

  it("T-F10b: source item is not a single clickable button (whole row)", () => {
    const source = makeSource();
    const onClick = vi.fn();
    render(<SignalSourceItem source={source} onClick={onClick} />);

    const titleText = screen.getByText("Test Article");
    fireEvent.click(titleText);
    expect(onClick).not.toHaveBeenCalled();
  });
});
