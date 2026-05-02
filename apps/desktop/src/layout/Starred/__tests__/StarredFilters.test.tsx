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

describe("StarredPage filters", () => {
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

  it("passes default (all) filter props to useArticle", () => {
    render(<StarredPage />);
    const lastCall = mockUseArticle.mock.calls[mockUseArticle.mock.calls.length - 1];
    const props = lastCall[0];

    // Default filter is "all": isStarred=1, others undefined
    expect(props.isStarred).toBe(1);
    expect(props.isArchived).toBeUndefined();
    expect(props.isReadLater).toBeUndefined();
    expect(props.hasNotes).toBeUndefined();
    expect(props.collectionUuid).toBeNull();
    expect(props.tagUuid).toBeNull();
  });

  it("passes archived filter props when archived filter is active", () => {
    render(<StarredPage />);

    // Find the filter chips and click the "archived" one
    // Filter labels: all, read_later, archived, notes — rendered as t() keys
    const archivedChip = screen.getByText("starred.filter.archived");
    fireEvent.click(archivedChip);

    const lastCall = mockUseArticle.mock.calls[mockUseArticle.mock.calls.length - 1];
    const props = lastCall[0];

    expect(props.isArchived).toBe(true);
    expect(props.isStarred).toBe(1);
    expect(props.isReadLater).toBeUndefined();
    expect(props.hasNotes).toBeUndefined();
  });

  it("passes notes filter props when notes filter is active", () => {
    render(<StarredPage />);

    const notesChip = screen.getByText("starred.filter.notes");
    fireEvent.click(notesChip);

    const lastCall = mockUseArticle.mock.calls[mockUseArticle.mock.calls.length - 1];
    const props = lastCall[0];

    expect(props.hasNotes).toBe(true);
    expect(props.isStarred).toBe(1);
    expect(props.isArchived).toBeUndefined();
    expect(props.isReadLater).toBeUndefined();
  });

  it("passes read_later filter props when read_later filter is active", () => {
    render(<StarredPage />);

    const readLaterChip = screen.getByText("starred.filter.read_later");
    fireEvent.click(readLaterChip);

    const lastCall = mockUseArticle.mock.calls[mockUseArticle.mock.calls.length - 1];
    const props = lastCall[0];

    // When read_later is active: isStarred=null, isReadLater=true
    expect(props.isReadLater).toBe(true);
    expect(props.isStarred).toBeNull();
    expect(props.isArchived).toBeUndefined();
    expect(props.hasNotes).toBeUndefined();
  });

  it("switches between filters correctly", () => {
    render(<StarredPage />);

    // Click archived
    fireEvent.click(screen.getByText("starred.filter.archived"));
    let props = mockUseArticle.mock.calls[mockUseArticle.mock.calls.length - 1][0];
    expect(props.isArchived).toBe(true);

    // Click notes
    fireEvent.click(screen.getByText("starred.filter.notes"));
    props = mockUseArticle.mock.calls[mockUseArticle.mock.calls.length - 1][0];
    expect(props.hasNotes).toBe(true);

    // Click all
    fireEvent.click(screen.getByText("starred.filter.all"));
    props = mockUseArticle.mock.calls[mockUseArticle.mock.calls.length - 1][0];
    expect(props.isStarred).toBe(1);
    expect(props.isArchived).toBeUndefined();
    expect(props.hasNotes).toBeUndefined();
  });
});
