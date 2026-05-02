import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUseArticle = vi.fn().mockReturnValue({
  articles: [],
  isLoading: false,
  isEmpty: true,
  isReachingEnd: true,
  size: 1,
  setSize: vi.fn(),
});

vi.mock("@/layout/Article/useArticle", () => ({
  useArticle: (props: Record<string, unknown>) => mockUseArticle(props),
}));

vi.mock("@/helpers/starredApi", () => ({
  getCollections: vi.fn().mockResolvedValue([]),
  getTags: vi.fn().mockResolvedValue([]),
  createCollection: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

vi.mock("@/helpers/parseXML", () => ({
  getFeedLogo: vi.fn(() => ""),
}));

vi.mock("date-fns", () => ({
  formatDistanceToNow: vi.fn(() => "2 days ago"),
  isToday: vi.fn(() => false),
  parseISO: vi.fn((s: string) => new Date(s)),
}));

import { render, screen, fireEvent } from "@testing-library/react";
import { StarredPage } from "../index";

describe("Read Later filter", () => {
  beforeEach(() => {
    mockUseArticle.mockClear();
    mockUseArticle.mockReturnValue({
      articles: [],
      isLoading: false,
      isEmpty: true,
      isReachingEnd: true,
      size: 1,
      setSize: vi.fn(),
    });
  });

  it("sends isReadLater=true and isStarred=null for read_later filter", () => {
    render(<StarredPage />);

    const readLaterChip = screen.getByText("starred.filter.read_later");
    fireEvent.click(readLaterChip);

    const lastCall = mockUseArticle.mock.calls[mockUseArticle.mock.calls.length - 1];
    const props = lastCall[0];

    expect(props.isReadLater).toBe(true);
    expect(props.isStarred).toBeNull();
  });

  it("does not include isStarred override when read_later filter is active", () => {
    render(<StarredPage />);

    fireEvent.click(screen.getByText("starred.filter.read_later"));

    const lastCall = mockUseArticle.mock.calls[mockUseArticle.mock.calls.length - 1];
    const props = lastCall[0];

    expect(props.isStarred).toBeNull();
    expect(props.isReadLater).toBe(true);
    expect(props.isArchived).toBeUndefined();
    expect(props.hasNotes).toBeUndefined();
  });

  it("restores isStarred=1 when switching from read_later back to all", () => {
    render(<StarredPage />);

    fireEvent.click(screen.getByText("starred.filter.read_later"));
    let props = mockUseArticle.mock.calls[mockUseArticle.mock.calls.length - 1][0];
    expect(props.isStarred).toBeNull();

    fireEvent.click(screen.getByText("starred.filter.all"));
    props = mockUseArticle.mock.calls[mockUseArticle.mock.calls.length - 1][0];
    expect(props.isStarred).toBe(1);
    expect(props.isReadLater).toBeUndefined();
  });
});
