import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { SearchPage } from "../index";

const mockFetchTopics = vi.fn().mockResolvedValue(undefined);
let storeTopics: unknown[] = [];

vi.mock("@/stores/index", () => ({
  useBearStore: vi.fn(() => ({
    topics: storeTopics,
    fetchTopics: mockFetchTopics,
  })),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

vi.mock("@/helpers/request", () => ({
  request: {
    get: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock("@/helpers/errorHandler", () => ({
  showErrorToast: vi.fn(),
}));

vi.mock("@/helpers/parseXML", () => ({
  getFeedLogo: vi.fn(() => ""),
}));

vi.mock("date-fns", () => ({
  formatDistanceToNow: vi.fn(() => "2 days ago"),
  parseISO: vi.fn((s: string) => new Date(s)),
}));

describe("SearchPage topics loading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeTopics = [];
  });

  it("calls fetchTopics on mount when topics array is empty", () => {
    render(<SearchPage />);

    expect(mockFetchTopics).toHaveBeenCalledWith("active", "last_updated");
  });

  it("does not call fetchTopics when topics are already loaded", () => {
    storeTopics = [
      {
        id: 1,
        uuid: "topic-1",
        title: "Existing Topic",
        description: "A topic",
        status: "active",
        article_count: 5,
        source_count: 3,
        first_seen_at: "2026-01-01",
        last_updated_at: "2026-01-02",
        is_following: false,
      },
    ];

    render(<SearchPage />);

    expect(mockFetchTopics).not.toHaveBeenCalled();
  });
});
