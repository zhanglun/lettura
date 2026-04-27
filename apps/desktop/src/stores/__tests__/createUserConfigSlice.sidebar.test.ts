import { describe, it, expect, beforeEach, vi } from "vitest";
import { create } from "zustand";
import {
  createUserConfigSlice,
  UserConfigSlice,
} from "../createUserConfigSlice";

vi.mock("@/helpers/dataAgent", () => ({
  getUserConfig: vi.fn(() =>
    Promise.resolve({
      data: { purge_on_days: 7, purge_unread_articles: false },
    }),
  ),
  updateUserConfig: vi.fn(() => Promise.resolve()),
}));

const storage = new Map<string, string>();

const workingLocalStorage = {
  getItem: vi.fn((key: string) => storage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storage.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    storage.delete(key);
  }),
  clear: vi.fn(() => {
    storage.clear();
  }),
  get length() {
    return storage.size;
  },
  key: vi.fn((_index: number) => null),
};

Object.defineProperty(globalThis, "localStorage", {
  value: workingLocalStorage,
  writable: true,
});

const createTestStore = () =>
  create<UserConfigSlice>((set, get, ...args) =>
    createUserConfigSlice(set, get as never, ...args),
  );

describe("F5: UserConfigSlice sidebarCollapsed persistence", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    storage.clear();
  });

  it("reads sidebarCollapsed from localStorage on initialization", () => {
    storage.set("sidebar_collapsed", "true");

    store = createTestStore();

    expect(store.getState().sidebarCollapsed).toBe(true);
  });

  it("defaults sidebarCollapsed to false when localStorage is unset", () => {
    store = createTestStore();

    expect(store.getState().sidebarCollapsed).toBe(false);
  });

  it("toggleSidebar() flips state and writes to localStorage", () => {
    store = createTestStore();
    expect(store.getState().sidebarCollapsed).toBe(false);

    store.getState().toggleSidebar();

    expect(store.getState().sidebarCollapsed).toBe(true);
    expect(storage.get("sidebar_collapsed")).toBe("true");
  });

  it("toggleSidebar() from true back to false writes 'false' to localStorage", () => {
    storage.set("sidebar_collapsed", "true");
    store = createTestStore();
    expect(store.getState().sidebarCollapsed).toBe(true);

    store.getState().toggleSidebar();

    expect(store.getState().sidebarCollapsed).toBe(false);
    expect(storage.get("sidebar_collapsed")).toBe("false");
  });

  it("handles multiple toggles correctly: false → true → false", () => {
    store = createTestStore();

    expect(store.getState().sidebarCollapsed).toBe(false);

    store.getState().toggleSidebar();
    expect(store.getState().sidebarCollapsed).toBe(true);
    expect(storage.get("sidebar_collapsed")).toBe("true");

    store.getState().toggleSidebar();
    expect(store.getState().sidebarCollapsed).toBe(false);
    expect(storage.get("sidebar_collapsed")).toBe("false");
  });
});
