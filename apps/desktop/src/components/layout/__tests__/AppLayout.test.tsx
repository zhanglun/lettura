import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppLayout } from "../AppLayout";

vi.mock("react-hotkeys-hook", () => ({
  useHotkeys: vi.fn(),
}));

vi.mock("@/helpers/busChannel", () => ({
  busChannel: { on: () => () => {} },
}));

vi.mock("@/components/LPodcast", () => ({
  LPodcast: () => null,
}));

vi.mock("@/components/AddFeed", () => ({
  AddFeedChannel: () => null,
}));

vi.mock("../CommandPalette", () => ({
  CommandPalette: () => null,
}));

vi.mock("@/stores", () => ({
  useBearStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      collectionMeta: { total: { unread: 247 }, today: { unread: 0 } },
      currentFilter: { id: 1, title: "Unread" },
      setFilter: vi.fn(),
      getSubscribes: vi.fn(),
      tracks: [],
      podcastPlayingStatus: false,
      updatePodcastPlayingStatus: vi.fn(),
      syncAllArticles: vi.fn(),
      addFeedModalOpen: false,
      setAddFeedModalOpen: vi.fn(),
    }),
}));

vi.mock("zustand/react/shallow", () => ({
  useShallow: (selector: unknown) => selector,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    Outlet: () => <main data-testid="outlet" />,
  };
});

describe("AppLayout (fusion shell)", () => {
  it("renders top nav and command entry inside the glass panel", () => {
    render(
      <MemoryRouter initialEntries={["/local/all"]}>
        <AppLayout />
      </MemoryRouter>,
    );

    expect(screen.getByText("fusion.nav.starred")).toBeInTheDocument();
    expect(screen.getByText("fusion.nav.history")).toBeInTheDocument();
    expect(screen.getByText("fusion.nav.subscriptions")).toBeInTheDocument();
    // 未读文案同时出现在章节标题和导航项里
    expect(screen.getAllByText("fusion.nav.unread").length).toBeGreaterThan(0);
    expect(screen.getByText("fusion.search.placeholder")).toBeInTheDocument();
    expect(screen.getByText("247")).toBeInTheDocument();
    expect(screen.getByTestId("outlet")).toBeInTheDocument();
  });

  it("keeps the unread nav item active on /local/all with the unread filter", () => {
    render(
      <MemoryRouter initialEntries={["/local/all"]}>
        <AppLayout />
      </MemoryRouter>,
    );

    const active = document.querySelector(".fusion-nav button.on");
    expect(active?.textContent).toBe("fusion.nav.unread");
  });
});
