import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useHotkeys } from "react-hotkeys-hook";
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

const shellState = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}));

vi.mock("@/stores", () => ({
  useBearStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector(shellState.value),
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
  beforeEach(() => {
    vi.clearAllMocks();
    shellState.value = {
      collectionMeta: { total: { unread: 247 }, today: { unread: 0 } },
      currentFilter: { id: 1, title: "Unread" },
      setFilter: vi.fn(),
      getSubscribes: vi.fn(),
      initCollectionMetas: vi.fn(),
      tracks: [],
      podcastPlayingStatus: false,
      updatePodcastPlayingStatus: vi.fn(),
      syncAllArticles: vi.fn(),
      addFeedModalOpen: false,
      setAddFeedModalOpen: vi.fn(),
      playerMode: "bar",
      setPlayerMode: vi.fn(),
    };
  });

  it("renders the product wordmark, top nav and command entry", () => {
    render(
      <MemoryRouter initialEntries={["/local/all"]}>
        <AppLayout />
      </MemoryRouter>,
    );

    // 顶栏左上是产品名（不是当前页名）；当前位置由导航高亮表达
    expect(screen.getByText("Lettura")).toBeInTheDocument();
    expect(screen.getByText("fusion.nav.starred")).toBeInTheDocument();
    expect(screen.getByText("fusion.nav.history")).toBeInTheDocument();
    expect(screen.getByText("fusion.nav.subscriptions")).toBeInTheDocument();
    expect(screen.getByText("fusion.nav.unread")).toBeInTheDocument();
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

  describe("esc 逐级退回", () => {
    const escapeHandler = () => {
      const call = (useHotkeys as unknown as { mock: { calls: unknown[][] } }).mock.calls.find(
        ([keys]) => keys === "escape",
      );
      return call?.[1] as (e: { defaultPrevented: boolean }) => void;
    };

    const renderShell = () =>
      render(
        <MemoryRouter initialEntries={["/local/all"]}>
          <AppLayout />
        </MemoryRouter>,
      );

    it("沉浸页裸按 esc：收回底条", () => {
      shellState.value.playerMode = "full";
      renderShell();

      escapeHandler()({ defaultPrevented: false });

      expect(shellState.value.setPlayerMode).toHaveBeenCalledWith("bar");
    });

    it("浮层已处理的 esc（defaultPrevented）：不抢着收条", () => {
      shellState.value.playerMode = "full";
      renderShell();

      escapeHandler()({ defaultPrevented: true });

      expect(shellState.value.setPlayerMode).not.toHaveBeenCalled();
    });
  });
});
