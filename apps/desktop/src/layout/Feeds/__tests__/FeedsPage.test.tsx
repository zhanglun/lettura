import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { FeedsPage } from "../index";

const mocks = vi.hoisted(() => ({
  articleView: vi.fn((_props: Record<string, unknown>) => (
    <div data-testid="article-view" />
  )),
  getSubscribes: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useParams: () => ({ uuid: "feed-1" }),
  useNavigate: () => mocks.navigate,
}));

vi.mock("@/layout/Article/ArticleView", () => ({
  ArticleView: mocks.articleView,
}));

vi.mock("@/stores", () => ({
  useBearStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      subscribes: [
        {
          uuid: "feed-1",
          item_type: "channel",
          title: "Feed One",
          unread: 3,
          children: [],
        },
      ],
      getSubscribes: mocks.getSubscribes,
    }),
}));

vi.mock("zustand/react/shallow", () => ({
  useShallow: (selector: unknown) => selector,
}));

describe("FeedsPage", () => {
  beforeEach(() => {
    mocks.articleView.mockClear();
    mocks.getSubscribes.mockClear();
    mocks.navigate.mockClear();
  });

  it("uses the default article layout for a selected feed", () => {
    render(<FeedsPage />);

    expect(screen.getByTestId("article-view")).toBeInTheDocument();
    expect(mocks.articleView).toHaveBeenCalled();
    const props = mocks.articleView.mock.calls[0][0];
    expect(props).not.toHaveProperty("feed");
    expect(props).not.toHaveProperty("onBack");
  });
});
