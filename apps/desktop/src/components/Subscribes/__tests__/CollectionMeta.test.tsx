import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CollectionMeta } from "../CollectionMeta";

// Mock react-router-dom — keep NavLink, override useNavigate
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => vi.fn() };
});

// Mock react-i18next — return key as display text
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

// Mock zustand store — controllable per test
const mockUseBearStore = vi.fn();
vi.mock("@/stores", () => ({
  useBearStore: (...args: unknown[]) => mockUseBearStore(...args),
}));

// Mock useShallow to just return the selector function
vi.mock("zustand/react/shallow", () => ({
  useShallow: (selector: unknown) => selector,
}));

describe("C7: CollectionMeta sidebar order", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBearStore.mockReturnValue({
      setFeed: vi.fn(),
      setViewMeta: vi.fn(),
      collectionMeta: { today: { unread: 0 }, total: { unread: 0 } },
      initCollectionMetas: vi.fn(),
    });
  });

  it("should render Today before All Items before Starred", () => {
    render(
      <MemoryRouter>
        <CollectionMeta />
      </MemoryRouter>,
    );

    const allLinks = screen.getAllByRole("link");
    const todayIdx = allLinks.findIndex(
      (l) => l.getAttribute("href") === "/local/today",
    );
    const allIdx = allLinks.findIndex(
      (l) => l.getAttribute("href") === "/local/all",
    );
    const starredIdx = allLinks.findIndex(
      (l) => l.getAttribute("href") === "/local/starred",
    );

    expect(todayIdx).toBeLessThan(allIdx);
    expect(allIdx).toBeLessThan(starredIdx);
  });

  it("should render all three collection links", () => {
    render(
      <MemoryRouter>
        <CollectionMeta />
      </MemoryRouter>,
    );

    const allLinks = screen.getAllByRole("link");
    const hrefs = allLinks.map((l) => l.getAttribute("href"));

    expect(hrefs).toContain("/local/today");
    expect(hrefs).toContain("/local/all");
    expect(hrefs).toContain("/local/starred");
  });
});
