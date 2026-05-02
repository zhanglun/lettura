import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopicDetailPage } from "../TopicDetailPage";

const mockFetchTopicDetail = vi.fn().mockResolvedValue(undefined);
const mockClearSelectedTopic = vi.fn();
const mockFollowTopic = vi.fn();
const mockUnfollowTopic = vi.fn();

vi.mock("@/stores", () => ({
  useBearStore: vi.fn(() => ({
    topics: [],
    selectedTopic: null,
    detailLoading: true,
    error: null,
    fetchTopicDetail: mockFetchTopicDetail,
    clearSelectedTopic: mockClearSelectedTopic,
    followTopic: mockFollowTopic,
    unfollowTopic: mockUnfollowTopic,
  })),
}));

vi.mock("react-router-dom", () => ({
  useParams: () => ({ uuid: "test-uuid-123" }),
  useNavigate: () => vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

vi.mock("@/helpers/cn", () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(" "),
}));

vi.mock("./TopicArticleItem", () => ({
  TopicArticleItem: () => null,
}));

vi.mock("./SourceGroup", () => ({
  SourceGroup: () => null,
}));

describe("TopicDetailPage direct URL access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls fetchTopicDetail with uuid string when topic is not in the list", () => {
    render(<TopicDetailPage />);

    expect(mockFetchTopicDetail).toHaveBeenCalledWith("test-uuid-123");
  });

  it("shows loading state when detailLoading is true", () => {
    render(<TopicDetailPage />);

    expect(screen.getByText("layout.topics.detail.loading_detail")).toBeInTheDocument();
  });

  it("calls clearSelectedTopic on unmount", () => {
    const { unmount } = render(<TopicDetailPage />);
    unmount();

    expect(mockClearSelectedTopic).toHaveBeenCalled();
  });
});
